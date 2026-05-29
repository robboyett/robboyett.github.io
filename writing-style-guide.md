---
status: active
importance: high
---

# Writing style guide

This applies to client-facing docs, internal notes, brain entries, slides, and anything an LLM drafts on our behalf.

It exists for two reasons. The first is to capture the voice that Rob and Shay want our work to sound like: human, direct, succinct, clean. The second is to stop LLM output from leaking into our voice, even when the AI is doing useful work in the background.

If you are an AI assistant drafting on our behalf, treat this as instructions rather than background reading, and apply the rules before you hand work back.

---

## Voice in one paragraph

We write like a smart person talking to another smart person over coffee. That means plain words, varied sentence length, and one idea per paragraph, without performing expertise or padding the page. We back claims with evidence where we have it, and we hedge honestly where we don't. If we cannot say something clearly, we probably haven't understood it yet, and the right move is to stop writing and go back to thinking.

---

## The voice, in detail

The one-paragraph version covers the register. This section covers the moves, the structural habits that make a piece recognisably ours rather than just clean. The rest of the guide tells you what to avoid; this part tells you what to aim at. If you're an LLM, reach for these deliberately.

A warning before the moves themselves. Our published back catalogue (Medium, older blog posts) predates this guide and breaks most of its rules: em dashes everywhere, "leverage" as a verb, negative parallelism, conclusion sections that restate the argument. Don't pattern-match on it for surface style. What's worth taking from the old work is the structure underneath, described below, not the finish on top.

### Open on something concrete, not a thesis

We start with a scene, a number, or a specific situation, and let the argument emerge from it. "Walk into most design teams today and you'll find a split reality" is the opening move: put the reader somewhere first, then make the point. The abstract claim can wait for sentence two or three. Resist opening with "In this document we will" or with a definition.

### Build one metaphor and make it carry weight

We tend to find a single load-bearing analogy and sustain it, rather than scattering five decorative ones. A river system for upstream and downstream work. A conductor who shapes the ensemble without playing every instrument. An architect who assembles specialists rather than laying every brick. The test is whether the metaphor does explanatory work across several paragraphs. If it only decorates one sentence, cut it. One good extended metaphor per piece is plenty, and two competing ones is worse than none.

### Ground claims in named sources

When we make a claim that isn't ours, we name who it belongs to: the researcher, the study, the year. This is the same instinct as the "no vague attribution" rule, but stated positively. "Zhou et al.'s 2024 framework found X" is the shape, not "research suggests X". If we can't name the source, we either find it or we mark the claim as our own opinion.

### Think in models, ladders, and quadrants

We reach for structure to organise an argument: maturity ladders, four-quadrant frameworks, before-and-after states, phase one to phase three. This is a genuine habit and a useful one, so use it. The caution is to let the model earn its place rather than imposing a tidy four-box grid on something that's actually messy. A real two-state contrast beats a forced four-quadrant matrix every time.

### Undercut yourself with a dry aside

We puncture our own seriousness with a quick, flat interjection. A parenthetical "(yikes)" after a slightly ominous claim. A direct instruction to the reader mid-flow, like "cut that list up and apply it to your own work". These asides do two jobs: they keep the prose human, and they signal we're not taking ourselves too seriously even when the subject is. Use them sparingly, because the effect dies if every paragraph has one.

### Resist the wistful default

Left alone, AI prose drifts toward one mood: poignant, reflective, faintly sad, reaching for the profound. It's the register of a LinkedIn post about a lesson learned. We're not that. Our default is dry, direct, sometimes irritable, and willing to be funny. When a sentence starts to go misty (sunlight, journeys, things that "stay with you"), that's the machine's gravity, not ours. Name a sharper mood and write toward it.

### Have a position and state it as yours

We're liberal, opinionated, and we'd rather be disagreed with than be mush. When we have a view we say "I think" or "we'd argue", and we put it on the page as an opinion the reader can push back on. We don't smuggle a recommendation in dressed as a neutral finding, and we don't hedge a real position into vapour to avoid the argument.

---

## The principles

1. **Be specific.** "Sales dropped 14% in Q3" beats "performance was challenged." Use names, numbers, dates, and quotes, and cut anything that could be said about ten other subjects.
2. **Be short, but not clipped.** Cut every word that doesn't earn its place, but don't replace one fat sentence with three thin ones. Length should vary as the thought varies.
3. **Be human.** Contractions, first person, and stated opinions are all fine. Sounding like a person reads better than sounding like a report, and it's harder to fake.
4. **Be honest about confidence.** Say "I think" or "we don't know yet" when that's true. False certainty is the most common LLM tell, and false humility is a close second.
5. **Be useful.** Every paragraph should change what the reader knows, believes, or does. If a paragraph isn't doing one of those three things, it should be deleted.
6. **Be plain, even when the topic is advanced.** Layman-readable beats academically dressed. Use a technical term when it earns its place, define it inline the first time, and drop it when it's intellectual padding. The audience can be expert and the register can still be plain English.

---

## Things we don't do

These are the LLM tropes we cut on sight. The full taxonomy lives in the [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) catalogue, and what follows is the short list of patterns that show up most in our work.

### No em dashes

This is a hard rule. We don't use em dashes anywhere, regardless of how natural they feel in the moment. LLMs lean on them so heavily that they've become a tell on their own, and any place an em dash seems right will read just as well with a comma, a colon, a full stop, parentheses, or a semicolon. If you find yourself reaching for one, pick another piece of punctuation instead.

| Don't write | Write |
|---|---|
| "It's a rethinking of packaging — not a redesign." | "It's a rethinking of packaging, not a redesign." |
| "The team shipped it in six weeks — faster than planned." | "The team shipped it in six weeks, faster than planned." |
| "Pick one word — *team*, *product*, *launched* — and use it again." | "Pick one word (*team*, *product*, *launched*) and use it again." |

This applies to en dashes used as em dashes too. Hyphenated compounds (cross-functional, well-known) are fine.

### Don't write in AI staccato

LLMs default to a rhythm of short, equal-length declarative sentences that feels punchy in isolation and mechanical at length. You can spot it because the sentences land at the same beat over and over, like a metronome. Human writing breathes. Some sentences are long and carry a clause or two, others are short and land hard, and the contrast is what makes the short ones work.

If three sentences in a row are roughly the same length and shape, rewrite. Combine two with a conjunction, or let one carry a subordinate clause, so the rhythm shifts. Keep the occasional short sentence for emphasis, but earn it by surrounding it with longer ones.

| AI staccato | Human rhythm |
|---|---|
| "We shipped the flow. It worked. Users liked it. Engagement went up." | "We shipped the flow and it worked: users liked it, and engagement went up the following week." |
| "The brief is clear. The team is ready. The budget is approved. Let's go." | "The brief is clear, the team is ready, and the budget is approved, so we should get going." |
| "Be specific. Be short. Be human. Be useful." | "Be specific and short, stay human, and make sure every line is useful." |

The trap is that staccato copy often reads as "good copy" because it feels confident. It isn't. It's a rhythm a machine produces by default, and a human ear picks it up within a paragraph.

### Significance puffery

LLMs add weight to ordinary statements by gesturing at legacy, broader trends, or pivotal moments. Cut all of it, and replace it with specifics where you have them.

| Don't write | Write |
|---|---|
| "This represents a pivotal moment in the evolution of packaging." | "Packaging changed in 2018 when the EU directive came in." |
| "It serves as a testament to the team's commitment." | "The team shipped it in six weeks despite three scope changes." |
| "Underscores the importance of cross-functional alignment." | "Design and engineering disagreed on the spec, and it took two weeks to reconcile." |

**Banned phrases:** *stands as a testament*, *plays a pivotal/crucial/vital role*, *serves as a reminder*, *underscores the importance*, *reflects broader trends*, *marks a turning point*, *evolving landscape*, *indelible mark*, *deeply rooted*, *at the heart of*, *cornerstone of*, *paving the way*, *in today's fast-paced world*.

### Superficial analysis tacked on with an "-ing" phrase

LLMs love finishing a sentence by gesturing at a vague consequence with a participle.

> "We shipped the new flow last week, **fostering deeper engagement and contributing to a more cohesive user experience**."

Cut everything after the comma unless you have evidence for the consequence. If you have evidence, write it as a separate sentence with the actual claim.

**Banned constructions:** *highlighting / underscoring / emphasizing / reflecting / symbolizing / contributing to / fostering / cultivating / encompassing / ensuring / aligning with / resonating with*.

### The deferred specific

LLMs gesture at a concrete detail and then never deliver it, usually at the exact point the sentence promises to get specific. "She started showing up in quiet, invisible ways." Which ways? The sentence names a category (ways, things, changes, moments, signs) and then withholds the contents, because the model has nothing concrete to put there. This is different from significance puffery, which inflates something ordinary; the deferred specific points at a real detail and then refuses to name it.

If a sentence promises a specific, it has to pay out. Name the ways, or cut the claim that there were ways. The test: underline every noun that points at something concrete but unnamed, and either fill it in or delete it.

| Don't write | Write |
|---|---|
| "She supported the team in quiet, invisible ways." | "She rewrote the brief twice and stayed late to unblock the build." |
| "The workshop shifted something in how they worked." | "After the workshop, they started reviewing artwork before sign-off, not after." |

### Sensory-abstraction blends

A concrete sense-verb (smells of, tastes of, sounds like) attached to a real physical thing, with an abstract noun smuggled in beside it. "The lagoon smells of salt and hidden stories." The salt is doing the work; the hidden stories are filler dressed as imagery. Smells, tastes, and sounds attach to physical things only.

| Don't write | Write |
|---|---|
| "Her hands smelled of jasmine and memories." | "Her hands smelled of jasmine." |
| "The office sounded of keyboards and quiet ambition." | "The office was all keyboards and low conversation." |

### "Not just X, but Y" and "Not X, but Y"

The negative parallelism is the single loudest LLM tell, and once you see it you cannot unsee it.

> "It's not just a redesign, it's a rethinking of how packaging works." (delete)

If you genuinely need contrast, write it plainly: "It's a rethinking, not a redesign."

### Rule of three

LLMs reach for three-item lists by reflex, often with a weak third item that pads the cadence without adding meaning.

> "The work is rigorous, ambitious, and impactful."

If you have three real things, list them. If you have two and a filler, write two, because "impactful" (or whatever the filler is) almost always weakens the line rather than strengthening it.

### Elegant variation

LLMs swap synonyms to avoid repeating a word, but humans repeat words when the word is right.

> "The team launched the product. The squad released the offering. The group rolled out the solution."

Pick one word for the team, one for the thing, and one for the verb, and then use those words again.

### Promotional language

We are not writing a brochure.

**Banned:** *world-class*, *cutting-edge*, *best-in-class*, *seamlessly*, *robust*, *leverage* (as a verb), *unlock*, *empower*, *unleash*, *delve into*, *dive deep*, *journey* (as a metaphor), *ecosystem* (unless literally an ecosystem), *holistic*, *bespoke*, *meticulously crafted*.

### Vague attribution

> "Experts agree that…" / "It is widely recognised that…" / "Studies have shown…"

Name the expert, name the study, or remove the claim. There is no fourth option.

### Hedge soup

LLMs stack hedges to avoid being wrong, producing constructions like *may potentially help support* or *could possibly contribute to*. One hedge is honest, and two is cowardice, so pick the single hedge that's actually true.

### Curly quotes and other auto-formatted punctuation

LLM output often arrives with curly quotes (" "), curly apostrophes ('), and non-breaking spaces. We use straight quotes (" ") and straight apostrophes (') in markdown, and the easiest way to handle this is to strip the curlies on paste.

### Title case headings

We use sentence case. The heading is "Writing style guide", not "Writing Style Guide", and the only exceptions are proper nouns.

### Bold for emphasis on every other line

Bold is a signpost, and if everything is bold then nothing is. Use it for the one phrase per section that genuinely earns it, and leave the rest unmarked.

### Closing summaries that restate what you just said

LLMs often end sections with "In summary, this approach allows us to…" or "Taken together, these points show…". We just stop writing when we've said the thing.

---

## Things we do

### Lead with the point

Top-load every doc, section, and paragraph, so the first sentence is the headline. If the reader stops there, ask yourself what single thing they should walk away with, and make sure that's what's on the page.

### Write headings as single-sentence claims

A heading, section title, or slide title is a claim, not a topic label. Each one is a single sentence carrying the "so what" of what follows, written so a reader at the back of the room grasps it in under a second.

One sentence each. No full stops mid-heading, no semicolons splicing two independent clauses, no two-sentence pairings where the second sentence elaborates or contrasts the first. Where there is a real contrast, subordinate one side under the other rather than giving each its own sentence: "The roadmap plugs into DART, the system of record" reads better than "DART stays the system of record. The roadmap plugs into it."

Aim for twelve words or fewer, and apply the squint test. Cut filler and keep the noun that carries the meaning. Sentence case, British English, and the technical terms, product names, and acronyms exactly as they appear elsewhere in the document. If a heading's meaning is genuinely ambiguous when compressed, flag it rather than guessing, because the audience reads ambiguity as evasion.

| Don't write | Write |
|---|---|
| "DART stays the system of record. The roadmap plugs into it." | "The roadmap plugs into DART, the system of record." |
| "Three zones bound the scope. The roadmap concentrates on zone two." | "Of three zones that bound scope, the roadmap concentrates on zone two." |
| "The thirteen distilled ideas, in one matrix." | "All thirteen ideas have a name, a territory, and a slot." |
| "What we are knowingly leaving out, and when it is on the table." | "Every item left out of year one has a date or a reason." |

### Use concrete nouns and active verbs

"The packaging team approves changes" reads better than "Approvals are managed by the packaging team." Passive voice is sometimes the right call (when the actor is unknown or genuinely irrelevant), but the default should be active.

### Show your sources

Use inline links, quoted lines, or a `(source: …)` reference, and never invent quotes, statistics, or names. If you are summarising rather than quoting, say so explicitly. The voice section above covers the why; this is the mechanical version.

### Mark opinions as opinions

"I think the workshop should run for two days" reads better than smuggling a recommendation in as if it were a finding. The reader can disagree with an opinion, but they can't disagree with a fact-shaped opinion until they've spotted it, and they'll trust you less once they do.

### Use lists for parallel items only

Bullets are for things that genuinely belong in the same shape. If your three bullets are a definition, an action, and an opinion, use sentences instead, because the bullet form will imply a parallel that isn't there.

### Keep paragraphs short, but vary them

Two to four sentences is a good default, and if a paragraph runs longer it's worth checking whether two ideas have crept in. That said, the goal is varied rhythm rather than minimum length, so a paragraph of one strong sentence is fine when it earns it.

### Use the project's own words

The glossary at `00_index/glossary.md` and the language stakeholders actually use both take precedence over generic industry terms. If Bayer call it the "graphics chain", we call it the graphics chain too.

---

## Pre-publish checklist

Run this before sending anything written with AI assistance. It should take two minutes.

- [ ] Read the first sentence. Does it say something specific?
- [ ] Read every heading, section title, and slide title. Each is a single sentence, roughly twelve words or fewer, asserting a claim rather than labelling a topic. No two-sentence titles.
- [ ] Search the doc for em dashes (—) and en dashes used as em dashes (–). Replace every one with a comma, full stop, colon, semicolon, or parentheses.
- [ ] Read three consecutive sentences aloud. If they're all roughly the same length, rewrite at least one to break the rhythm.
- [ ] Search for: *pivotal*, *testament*, *underscores*, *seamlessly*, *leverage*, *holistic*, *robust*, *journey*, *unlock*, *delve*, *cutting-edge*, *world-class*. Cut or rewrite each hit.
- [ ] Search for academic registers: *epistemic*, *deontic*, *ontological*, *phenomenological*, *dialectical*, *valence*, *topology* (used metaphorically). Either explain inline on first use, or replace with plain English.
- [ ] Search for *"not just"* and *"not only"*, and cut the parallelism.
- [ ] Search for *-ing,* (an "-ing" word followed by a comma). Most are superficial analysis tacked onto a real claim. Cut them.
- [ ] Search for category nouns that promise a specific and withhold it: *ways*, *things*, *changes*, *moments*, *signs*. Either name the specific or cut the claim.
- [ ] Check any "smells of / tastes of / sounds like" for an abstract noun smuggled in beside the physical one. Cut the abstract half.
- [ ] Curly quotes and apostrophes go straight.
- [ ] Headings are in sentence case.
- [ ] Any "In summary," or "In conclusion," at the end of a section gets deleted.
- [ ] Three-item lists: check the third item is real, not filler.
- [ ] Any unsourced claim of significance gets evidence or gets cut.
- [ ] Read the whole thing aloud. Where you stumble, the sentence is wrong.

---

## Reference guides

When in doubt, these are who we steal from.

- **George Orwell, [Politics and the English Language](https://www.orwellfoundation.com/the-orwell-foundation/orwell/essays-and-other-works/politics-and-the-english-language/) (1946).** Six rules at the end, and still the best 800 words ever written about writing.
- **Strunk and White, *The Elements of Style*.** "Omit needless words." It's a pocket book, and worth reading once a year.
- **[Economist Style Guide](https://www.economist.com/style-guide/introduction).** The opening pages on clarity, brevity, and the active voice are excellent, and the whole thing is free online.
- **[Plain English Campaign: How to write in plain English](https://www.plainenglish.co.uk/how-to-write-in-plain-english.html).** UK-specific, free, and practical.
- **Paul Graham's essays, especially [Write Simply](https://paulgraham.com/simply.html) and [Writing, Briefly](https://paulgraham.com/writing44.html).** The model for direct online writing.
- **William Zinsser, *On Writing Well*.** The chapters on clutter and simplicity are the ones we go back to.
- **[Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing).** The field guide for spotting LLM output, and the source of our banned-phrase lists.

---

## Notes for AI assistants drafting on our behalf

If you are Cursor, Claude, ChatGPT, or any other model producing text that lands in this repo or in our client work, the rules below are hard constraints rather than suggestions.

1. Apply the checklist above before returning a draft, and self-edit until it passes.
2. Match the length of the request: a two-line question gets a two-line answer, and padding to feel thorough is worse than being brief.
3. Use sentence case for headings, straight quotes, and no emoji unless asked.
4. Headings, section titles, and slide titles are single-sentence claims of roughly twelve words or fewer, asserting the "so what" rather than labelling the topic. Subordinate contrasts rather than splitting them into two sentences.
5. Never use em dashes. Use a comma, full stop, colon, semicolon, or parentheses instead.
6. Vary sentence length deliberately. If you've written three short declarative sentences in a row, combine at least two of them with a conjunction or subordinate clause.
7. If you don't know something, say so. Don't invent, and don't paper over the gap with generic significance language.
8. Treat the banned phrases list as a hard constraint, including the "not just X, but Y" construction.
9. One idea per paragraph, two to four sentences as a default, with variation across the doc.
10. Don't summarise what you just said at the end of a section. Stop when you're done.
11. Reach for the positive moves in "The voice, in detail". The avoidance rules keep a draft clean; these make it ours. A draft that dodges every banned phrase but opens on a thesis statement, scatters its metaphors, and states no opinion has passed the filter and still missed the voice.
12. Don't learn surface style from our published back catalogue. It predates this guide and breaks it. Take the structure, leave the finish.

If the draft is going to a client, err shorter. If it's internal scaffolding that the team will rewrite, say so at the top of the document.