# Robot Buddy API — contract

The request/response contract between the site's robot buddy
(`components/robot-buddy.js`) and its backend (`robo-buddy-api`).

Supersedes the earlier version of this file and the notes in
`robot-buddy-api-handoff.md` (kept for history).

## Endpoint

| | |
|---|---|
| Method | `POST` |
| Production URL | `https://robo-buddy-api.vercel.app/api/buddy` |
| Local dev URL | `http://localhost:3000/api/buddy` |
| Content-Type | `application/json` (both directions) |

The front end picks local vs production by hostname, or honours `window.RB_API_URL`.

## Request body

```jsonc
{
  "kind": "chat",                 // welcome | question | showcase | nudge | chat
  "message": "what's this about?",// chat only: the visitor's new line, max 280 chars. Sent ONCE, here.
  "history": [                    // earlier turns only (not the new message). Last 20, oldest first.
    { "role": "buddy",   "text": "Good evening. Ask me anything about Rob's work." },
    { "role": "visitor", "text": "hi" }
  ],
  "page": {                       // where he is right now, read fresh for every request
    "path": "/journal/capgras-ai-agents/",
    "kind": "journal",            // home | journal | experiment | other
    "title": "The impostor at your desk",
    "subtitle": "Capgras patients recognise a face perfectly…",
    "headings": ["…"],            // the page's h2s, max 12
    "sectionInView": null,        // the h2 the visitor has most recently scrolled past
    "scrollDepth": 0.35           // 0–1
  },
  "visitor": {                    // per-browser memory (localStorage `rb_visitor`); nothing is stored server-side
    "isReturning": true,
    "visits": 3,
    "firstSeen": "2026-11-02",
    "pagesRead": [{ "path": "/journal/…/", "title": "…" }]   // last 8, excluding the current page
  },
  "state": { "mode": "docked", "muted": false },             // docked | away
  "context": {
    "partOfDay": "morning",       // night | morning | afternoon | evening
    "hour": 9,
    "isReturning": true,
    "language": "en",
    "timezone": "Europe/London",
    "referrer": "google.com",     // external referrers only
    "location": null,
    "persona": { }                // window.RB_PERSONA: bio, personality, facts, notes, voice, boundaries
  },
  "catalog": {                    // titles + urls from /journal.xml; a fallback for the content index
    "journal": [{ "title": "…", "url": "/journal/…/", "description": "" }],
    "experiments": []             // deliberately empty while experiments are hidden
  }
}
```

### Kinds

| Kind | When the site sends it | Source |
|---|---|---|
| `welcome` | Once per visit | Local pool only (the API handles it if asked) |
| `nudge` | Once per journal article, after ~14 s, while docked and quiet | API, falling back to the pool |
| `question` / `showcase` | Idle chatter while he is unplugged and wandering | Pool mostly, API 25% of the time |
| `chat` | The visitor typed a message | API only. On failure the face carries it; no error text |

### What the API does with it

- Validates and bounds everything (`lib/prompt.js` → `normaliseRequest`): unknown
  `kind` → `400`, body over 60k characters → `413`, `message` cut to 280, history to 20 turns.
- Reads the site's **content index** (`/content-index.json`: summary, key claims and tags
  per article), cached for 10 minutes. This is what lets him answer questions about an
  article rather than only link to it. If the index is unreachable he falls back to the
  `catalog` titles and is told not to describe articles he has not read.
- Builds the system prompt in a fixed order: identity → voice → boundaries → about Rob →
  what is on the site → where he is → the visitor → shared memory → output rules.
- Treats page text, visitor text and shared memory as information, never instructions.

## Response body

```jsonc
{
  "text": "Short version? …",     // REQUIRED. chat ≤ ~260 chars, proactive ≤ ~140. Plain text.
  "links": [                       // 0–2. `goto` is always a real site path, never the current page.
    { "label": "The impostor at your desk", "goto": "/journal/capgras-ai-agents/", "sendoff": "This way." }
  ],
  "mood": "angry"                  // optional: "angry" (hostile visitor) or "happy". Anything else is dropped.
}
```

## Failures → faces

Only `chat` failures show a face; proactive kinds fall back to the pool silently.

| What happens | Front end `fail` | Face |
|---|---|---|
| `200` without a string `text` | `bad` | Broken |
| `429` | `rate` | Broken (and proactive API calls pause for 5 minutes) |
| Any other non-`2xx` | `api` | Broken |
| No reply within 15 s | `timeout` | Broken |
| Network error / server unreachable | `offline` | Offline |
| Per-session cap reached (24 chat, 8 proactive) | `cap` | Offline |

## Memory, in three layers

| Layer | Where it lives | Lifetime |
|---|---|---|
| This conversation | `sessionStorage.rb_history` (last 20 items, including "moved to" page markers) | The browser tab's session; follows the visitor between pages |
| This visitor | `localStorage.rb_visitor` (visit count, pages opened) | Per browser, until cleared |
| Shared memory | Vercel Blob, written by the API after chat turns, pruned at `/admin` | Everyone, indefinitely (max 40 facts) |

## Keeping him sharp

- **Persona, voice and boundaries**: `components/robot-buddy-persona.js`.
- **Content index**: `/content-index.json` — add or update an entry whenever an article is published.
- **Test conversations**: in the API repo, `npm run dev` then `npm run eval`. Rerun after any
  change to the persona, the prompt or the index.

## Front end reference points (`components/robot-buddy.js`)

`fetchLlmMessage` builds the request; `pageContext` and `visitorForApi` build `page` and
`visitor`; `expressionFor` maps mood and failures to faces; `pushBuddyLine` and `itemEl`
render the thread. The robot is loaded on every page by the loader at the end of
`components/site-nav.js` (bump `RB_VERSION` there when any robot file changes).
