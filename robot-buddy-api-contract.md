# Robot Buddy API — contract & what to update

This describes the request/response contract the site's robot buddy
(`components/robot-buddy.js`) expects from the backend (`robo-buddy-api`, served at
`https://buddy.robboyett.com/api/buddy`).

**If you only read one thing:** the emotional-states update added **one new,
optional response field — `mood`**. Everything else below is the existing contract,
documented so you have the full picture. The frontend degrades gracefully, so
nothing breaks if `mood` is missing — you just never get the **Angry** face.

---

## TL;DR — what actually needs to change

1. **Add an optional `mood` string to the JSON response.** The only value the
   frontend reacts to today is `"angry"`, which it shows when a visitor is hostile
   in chat. Any other value (or omitting it) → the normal **Speaking** face.
2. **(Optional but recommended) Be deliberate about HTTP status codes on failure**,
   because they now drive the **Broken** vs **Offline** faces (see
   [Error handling](#error-handling--how-failures-map-to-faces)).

That's it. No request-shape changes are required.

---

## Endpoint

| | |
|---|---|
| Method | `POST` |
| Production URL | `https://buddy.robboyett.com/api/buddy` |
| Local dev URL | `http://localhost:3000/api/buddy` |
| Content-Type | `application/json` (both directions) |

The frontend picks local vs prod by hostname, or honours `window.RB_API_URL` if set.

---

## Request body

The frontend sends this JSON:

```jsonc
{
  "kind": "chat",                    // see "kinds" below
  "message": "you're useless",       // ONLY present when kind === "chat" (the visitor's text)
  "context": {
    "partOfDay": "morning",          // "night" | "morning" | "afternoon" | "evening"
    "hour": 9,                       // 0–23, visitor local time
    "isReturning": false,            // true if visits this session > 1
    "language": "en",                // navigator.language, primary subtag only
    "timezone": "Europe/London",     // IANA tz, or null
    "referrer": "google.com",        // referring hostname, or null
    "location": null                 // reserved, always null for now
  },
  "catalog": {
    "experiments": [
      { "title": "…", "url": "/experiments/…/", "description": "…" }
    ],
    "journal": [
      { "title": "…", "url": "/journal/…/", "description": "…" }
    ]
  },
  "history": [
    { "role": "visitor", "text": "hi" },
    { "role": "buddy",   "text": "good morning. new here?" }
  ]
}
```

### Field notes

- **`kind`** — which prompt to run. One of: `welcome`, `question`, `showcase`, `chat`.
  - `chat` — visitor typed a message (the `message` field is set). **LLM‑only** on the
    client: there is **no scripted reply**. If you error or are unreachable, the
    front‑end shows the **Offline/Broken face with no words** (see failure section) —
    you don't need to return friendly error copy. This is the only kind where **mood**
    matters.
  - `welcome` / `question` / `showcase` — **proactive** chatter the buddy starts on its
    own. The client mixes your responses with a *small* local pregenerated pool, so you
    won't be called for every one, and a failure here just falls back to a canned line
    (no error face). `showcase` is where you'd suggest an experiment/article from `catalog`.
- **`message`** — present **only** for `kind === "chat"`. The raw visitor text
  (max 280 chars, client-enforced).
- **`context`** — ambient signals + **`persona`** (see below). All best-effort; any
  field may be `null`.
- **`context.persona`** — **NEW.** Background info about Rob the site owner, authored in
  `components/robot-buddy-persona.js` (bio, personality, facts, links, notes). Weave it
  into your **system prompt** so the buddy speaks as Rob's mascot and knows his details.
- **`catalog`** — the live site catalog, parsed from `/experiments.xml` and
  `/journal.xml`. Use it to recommend real, current links (especially for `showcase`).
- **`history`** — recent conversation (last ~20 turns), persisted in the visitor's
  browser session so it survives page navigation. `role` is `"visitor"` or `"buddy"`.
  This is **short‑term** context; durable memory is separate — see **Central memory**.

---

## Response body

Return JSON in this shape:

```jsonc
{
  "text": "That was a very mean thing to say. Please stop.",  // REQUIRED, string
  "links": [                                                  // optional, default []
    { "label": "Read about it", "goto": "/journal/…/", "sendoff": "This way —" }
  ],
  "mood": "angry"                                             // NEW, optional
}
```

### Field reference

| Field | Type | Required | Notes |
|---|---|---|---|
| `text` | string | **Yes** | The buddy's line. If missing or not a string, the frontend treats the call as failed (`bad`) → **Broken** face on chat. |
| `links` | array | No | Navigation suggestions. Each: `{ label, goto, sendoff }` — `label` is the button text, `goto` is a site-relative URL, `sendoff` is the line shown as the buddy "walks" the visitor there. Omit or `[]` for none. |
| `mood` | string | No | **New.** Drives the buddy's face. See below. |

### The `mood` field (the new bit)

`mood` is an optional hint about the emotional tone of *this* reply. The frontend maps
it to the buddy's expression:

| `mood` value | Buddy face | When to use |
|---|---|---|
| `"angry"` | **Angry** — angular eyes, red steam puffs, tense arms, shake | Visitor is hostile, abusive, or deliberately provoking in chat. Pair it with a `text` that pushes back (see the Figma "Angry" copy). |
| anything else / omitted | **Speaking** — normal talking face | Default for every ordinary reply. |

Notes:
- Only `"angry"` has a visual effect **today**. You can send other values
  (`"happy"`, `"neutral"`, …) safely — they're ignored for now and reserved for
  future faces, so feel free to populate them if it's cheap.
- `mood` is read on **every** kind, but in practice only `chat` replies will be
  hostile, so that's where it matters.
- Don't overuse `"angry"` — it's a deliberate reaction to genuine hostility, not mild
  disagreement.

---

## Error handling — how failures map to faces

The buddy shows different faces depending on **how** a chat call fails. You control
which one via the HTTP status (and by simply being up or down). This only applies to
`kind === "chat"`; passive kinds fail silently with no scary face.

**The buddy no longer shows any error text.** On a chat failure the client shows the
face only (compose stays open to retry, face returns to normal after a few seconds).
So you don't need to craft error copy — just use the right HTTP status.

| What happens | Frontend `fail` code | Buddy face |
|---|---|---|
| `200` but `text` missing/not a string | `bad` | **Broken** |
| `429 Too Many Requests` | `rate` | **Broken** |
| Any other non-`2xx` (`4xx`/`5xx`) | `api` | **Broken** |
| Request exceeds 15 s (client aborts) | `timeout` | **Broken** |
| Network error / server unreachable | `offline` | **Offline** |
| Client hit its per-session cap | `cap` | **Offline** |

Takeaways for the backend:
- **Return `429` for rate limiting** — it gets the "lots of visitors, try again"
  message rather than a generic error.
- **Always send a `text` string on `200`.** A `200` with no `text` still shows a
  Broken face.
- **Keep responses under ~15 s.** Past that the client aborts and shows Broken.

---

## Central memory (backend‑owned) — NEW

The buddy should have **one shared, durable memory across all sessions and all
visitors** — e.g. if someone tells him a name, he still knows it for the next person,
tomorrow. The front‑end **cannot** do this (browser storage is per‑device); it only
persists the last ~20 turns of the *current* session for local coherence and sends them
as `history`.

So durable memory is **yours to build**:
- Keep a **global memory store** (a KV/DB record, not per‑user) that accumulates salient
  facts the buddy learns from conversations (names given, recurring questions, etc.).
- **Inject** that memory into the system prompt on every call so replies reflect it.
- **Update** it after conversations (extract new durable facts; keep it bounded and
  sensible — don't store secrets or PII you shouldn't).
- Treat `history` as short‑term working memory for the current visitor; treat the global
  store as long‑term shared memory.

Until this exists, the buddy still works — he just won't remember across sessions/users.

## Limits & timeouts (client-side, for context)

These are enforced by the frontend; you don't need to implement them, but they shape
traffic:

| Constant | Value | Meaning |
|---|---|---|
| `LLM_MAX_PASSIVE` | 8 | Max passive (`question`/`showcase`/`approached`) calls per session |
| `LLM_MAX_CHAT` | 24 | Max `chat` calls per session |
| `LLM_TIMEOUT_MS` | 15000 | Client aborts a request after 15 s |

---

## Minimal implementation checklist

- [ ] Response includes `text` (string) on every `200`.
- [ ] Response **optionally** includes `mood: "angry"` when the visitor is hostile in
      chat; omit otherwise.
- [ ] Hostility detection runs on `message` (and optionally `history`) for
      `kind === "chat"`.
- [ ] Rate limiting returns HTTP `429`.
- [ ] Errors return a non-`2xx` status (not a `200` with an error body).
- [ ] Typical responses complete well under 15 s.
- [ ] `links[].goto` values are real, site-relative URLs (ideally sourced from the
      `catalog` in the request).

---

*Frontend reference points (`components/robot-buddy.js`): request body is built in
`fetchLlmMessage`; the response is validated there (`data.text` / `data.links` /
`data.mood`); `mood`→face and failure→face mapping lives in `expressionFor`.*
