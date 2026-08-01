# Robot Buddy API — handoff note

**For:** a Claude Code instance working in the **`robo-buddy-api`** repo (the backend at
`https://buddy.robboyett.com/api/buddy`, local `http://localhost:3000/api/buddy`).

**Why:** the front-end (the robot mascot in `robboyett.github.io`, `components/robot-buddy.js`)
just had a round of changes. The request/response contract shifted and the product now
expects a few new backend capabilities. This note is the actionable summary; the full
field-by-field contract lives in `robot-buddy-api-contract.md` (front-end repo).

Nothing here breaks the current API — the request shape is **backward-compatible**. If you
do nothing, the robot still works; it just won't remember across sessions, won't use Rob's
bio, and won't ever show its "angry" face. The tasks below turn those on.

---

## What the front-end now sends (POST body)

```jsonc
{
  "kind": "chat" | "welcome" | "question" | "showcase",
  "message": "you're useless",        // ONLY when kind === "chat"
  "context": {
    "partOfDay": "morning", "hour": 9, "isReturning": false,
    "language": "en", "timezone": "Europe/London", "referrer": null, "location": null,
    "persona": {                       // NEW — background info about Rob (may be null)
      "bio": "…", "personality": "…", "facts": ["…"],
      "links": { "experiments": "/experiments/", "journal": "/journal/", "about": "/#intro" },
      "notes": "…"
    }
  },
  "catalog": { "experiments": [ { "title","url","description" } ], "journal": [ … ] },
  "history": [ { "role": "visitor"|"buddy", "text": "…" } ]   // last ~20 turns, session-scoped
}
```

## What the front-end expects back

```jsonc
{
  "text": "…",                                   // REQUIRED string on 200
  "links": [ { "label","goto","sendoff" } ],     // optional, default []
  "mood": "angry"                                // optional; only "angry" has an effect today
}
```

`links[].goto` must be a real site-relative URL (ideally sourced from `catalog`). `sendoff`
is the line shown as the buddy "walks" the visitor to that URL.

**Response length — there's a hard 200-char cap to remove.** The front-end imposes **no cap**
on `text` and never truncates it; the bubble renders whatever it's given. Verified against the
**live** API (fetched directly, bypassing the front-end): responses are **hard-capped at exactly
200 characters** — short replies come back whole (e.g. a 125-char answer ending cleanly with
punctuation), but longer ones are sliced **mid-word at 200** (e.g. `…and AI tooli`). That's a
character truncation in this repo — a `.slice(0, 200)` / `maxLength: 200` on the response `text`,
**not** `max_tokens` (which wouldn't land on a round 200 or cut mid-word). Find it and remove or
raise it (and if you also want a length guard, do it on `max_tokens`, not a blind char slice).

---

## Tasks (priority order)

### 1. Central shared memory  ← the main new build

The product goal: **one memory shared across all sessions and all visitors.** If someone
tells the buddy a name, he still knows it for the next person, tomorrow. The front-end
**cannot** do this (browser storage is per-device) — it only persists the current session's
last ~20 turns and sends them as `history`. So durable memory is entirely yours.

Implement:
- A **global memory store** — a single record/document (KV or DB row), **not** keyed per user.
  A small JSON blob is fine, e.g. `{ facts: string[], updatedAt }`, kept bounded (cap the
  number of facts; evict oldest / least-useful).
- **Read** it on every request and **inject** it into the system prompt (e.g. a
  "Things you remember:" section).
- **Write** to it after conversations: extract durable, sharable facts (names given to the
  buddy, recurring topics). Do this with a cheap follow-up extraction call or a heuristic —
  your choice. Keep it bounded and sane.
- **Do not store** secrets, PII, or anything a stranger shouldn't see later — this memory is
  shown to *everyone*. Filter aggressively.
- Treat `history` (in the request) as short-term working memory for the current visitor;
  treat the global store as long-term shared memory. They're complementary.

### 2. Use `context.persona` in the system prompt

Every request carries `context.persona` (Rob's bio, personality, facts, links, notes; may be
`null`). Weave it into the system prompt so the buddy speaks **as Rob's mascot** (third person
about Rob) and can answer questions about him. Without this, the bio Rob maintains in
`robot-buddy-persona.js` does nothing.

### 3. Return `mood` for the Angry state

Add an optional `"mood"` to the response. The only value the front-end reacts to today is
`"angry"`, which triggers an angry face + steam. Set it when the visitor is genuinely hostile
in a `chat` turn (classify from `message` / `history`). Pair it with a `text` that pushes back.
Don't over-trigger — reserve it for real hostility, not mild disagreement.

### 4. Handle the `welcome` kind

Proactive lines now include `kind: "welcome"` (greeting on arrival), alongside the existing
`question` / `showcase`. The client mixes your responses with a small local pregenerated pool,
so you won't be called for every one — but make sure `welcome` returns a sensible short greeting.
(`showcase` is where you suggest an experiment/article from `catalog`.)

### 5. Failure behaviour — status codes only, no error copy

The front-end **no longer shows any error text.** A failed chat just shows the robot's
Offline/Broken face (compose stays open to retry, face resets after a few seconds). So:
- Don't craft friendly error strings — just use the right HTTP status.
- Return **`429`** for rate-limiting, any **non-`2xx`** for other errors.
- **Always** include a `text` string on a `200` (a `200` with no `text` is treated as a failure).
- Keep responses **under ~15 s** (the client aborts at 15 s and shows Broken).

---

## Not your job (handled front-end)

Expression/animation, the typewriter reveal, movement, the yellow speech bubble, per-session
`history` persistence, and mapping failures → faces are all client-side. You only produce
`{ text, links?, mood? }` and maintain the shared memory.

## Verifying

- Locally the front-end hits `http://localhost:3000/api/buddy`. Run the site
  (`python3 -m http.server` in the front-end repo) and chat with the robot.
- Memory: tell the buddy a name in one browser, then open a **different** browser/incognito and
  ask — he should recall it (proves the store is global, not per-session).
- Persona: put a distinctive fact in `robot-buddy-persona.js`, ask about it, confirm he uses it.
- Angry: send something hostile, confirm the response includes `"mood": "angry"`.
- Failure: stop the API, send a chat — the front-end should show the Offline/Broken face with
  **no words** (that's correct; nothing for you to fix there).

Full contract reference: `robot-buddy-api-contract.md`.
