# Journal manifest drift: findings before you fix anything

Written 21 August 2026, while adding the `capgras-ai-agents` article. Nothing in this note has been acted on. Both manifests are exactly as they were.

You were right to be cautious. At least one of the four gaps is deliberate, and "cleaning up" it would republish something you had deliberately withheld.

## The short version

`journal.xml` feeds the nav dropdown. `feed.xml` is the RSS feed. Twenty articles have folders under `/journal/`; sixteen are in both manifests and correct. These four are not.

| Article | journal.xml | feed.xml | Verdict |
| --- | --- | --- | --- |
| `synthetic-vs-human-evaluation` | missing | missing | **Deliberate. Do not add.** |
| `m5-monzo-display` | missing | present | Probably superseded, your call |
| `drawbot` | present | missing | Looks like an oversight |
| `synthetic-nielsen-review` | present | missing | Looks like an oversight |

## The one you must not touch

`synthetic-vs-human-evaluation` was hidden on purpose, and the record of why was later deleted.

It was in both manifests, wrapped in this comment:

```xml
<!-- HIDDEN: Awaiting permission to publish
<entry>
    <title>Synthetic vs Human Research Evaluation</title>
    ...
```

Commit `ac03e2b` (9 Feb 2026, "Add determinism-ai-ux journal entry and assets") deleted the commented block outright from both files. That commit was tidying up: it added `determinism-ai-ux` as a commented-out entry pending publish, and while doing so it removed the older commented-out block rather than leaving it. So the entry went from "hidden, with a stated reason" to "gone, with no trace", which is why the gap now reads as an accident.

Whatever permission you were waiting on, adding this to the manifests grants it.

### The part that needs your attention regardless

Hiding it from the manifests never actually unpublished it:

- The page is live at `https://robboyett.com/journal/synthetic-vs-human-evaluation/`.
- It carries no `noindex`, so search engines are free to index it.
- `51-million-no-receipts-ai-research` links straight to it from published body copy, at line 148: `<a href="/journal/synthetic-vs-human-evaluation/">full report</a>`.

So it is reachable, crawlable, and linked from a published article. If the permission still has not come through, the manifests are not where the problem is. If it has come through, then adding it is fine and the link is already doing the work.

Related: the same article links to it a second time at line 113 with `href="/synthetic-vs-human-evaluation/"`, missing the `/journal` prefix. That one is a dead link and worth fixing either way.

## The one that is a judgement call

`m5-monzo-display` is in the feed but not the nav, and it looks superseded rather than forgotten.

- `m5-monzo-display`, 14 January 2026, 475 words, "Pocket Money, Made Physical". Hooking an M5Stick to the Monzo API to show your kids' balances.
- `pocket-money-device`, 30 January 2026, 1,373 words, "Am I a bank now?". Its subtitle reads "From a balance display to a local ledger", which describes the first post as its starting point.

Two weeks apart, same project, the second one three times longer and framed as the continuation. Dropping the short first post from the nav while leaving the fuller one is a reasonable editorial choice, and it may be exactly what you did.

Against that reading: it is still in the RSS feed, which you would probably also have removed if you were retiring it. Commit `d88a479` added four articles but its message names only three, and `m5-monzo-display` is the one it does not mention, so it may simply have been lost in a busy commit.

Your call. The options are to add it to the nav, or to pull it from the feed, or to leave the split as is.

## The two that look like plain oversights

**`drawbot`.** Commit `460aa03` added the page and the `journal.xml` entry and never touched `feed.xml` at all. No comment, no hidden block, no sign of intent. Worth knowing before you add it: it is dated February 2020, six years older than anything else local, so in a newest-first feed it lands near the bottom among the 2019 Medium pieces. It is also a crafting-kit product piece rather than a journal essay, so leaving it out of RSS may suit you.

**`synthetic-nielsen-review`.** Dated 23 October 2025. Commit `689c5fe` edited both manifests in the same change and gave this article a `journal.xml` entry but no `feed.xml` item. Nothing marks it as intentional. Most likely missed.

## Other things the audit turned up

None of these are blocking, and none were changed.

**A date that cannot exist.** `determinism-ai-ux` has `<pubDate>Fri, 07 Feb 2026</pubDate>` in the feed. 7 February 2026 was a Saturday. The article itself disagrees with the feed and with itself: `datetime="2026-02-06"` but display text "February 7, 2026". Strict RSS readers can reject a mismatched weekday, so this one is worth correcting. Pick a day and make all three agree.

**Titles drift between the two manifests.** `journal.xml` carries a truncated title where `feed.xml` carries the full one, for `camera-was-always-off` and `vibe-coding-field-guide`. Both manifests disagree with the page's own `h1` for `bringing-back-the-fun` and `pocket-money-device`. This is cosmetic, but it means the nav and the feed name the same article differently.

**Ordering is not strictly newest-first.** In `journal.xml`, `drawbot` (2020) sits at position 13 above four 2025 articles, and `synthetic-nielsen-review` (Oct 2025) sits above two newer ones. In both files, the older Medium block has a few inversions. Nothing breaks, since readers sort by `pubDate` themselves, but the nav dropdown renders in file order.

**Two stale `<title>` tags.** `determinism-ai-ux` still has the browser title "From deterministic to not: AI, UX, and the contract we broke", which is an earlier draft name. `ai-native-aesthetic` drops ", eventually" from its title tag compared with its `h1`.

**No dead ends in the manifests.** Every `/journal/...` URL in both files resolves to a real folder. The sixteen external Medium, Design Week and GitHub links in each file are intentional and match across both. The only defects are omissions.

## Why this happened, structurally

`journal.xml` and `feed.xml` are maintained by hand, separately, with no check that they agree with each other or with what is on disk. Anything hidden is hidden by commenting it out, and a comment is easy to delete during unrelated tidying, which is precisely what happened in `ac03e2b`.

If you want this to stop recurring, the cheap fix is a script that cross-references the three sources and prints the diff, run before you commit. It would have caught all four of these. Happy to write it.

## What was and was not done

Not done: no entries added, removed or reordered in either manifest. No article files touched. No dates or titles corrected. No links fixed.

Done, separately and already pushed: the `capgras-ai-agents` article was added to both manifests correctly, and `lastBuildDate` was bumped to 21 August 2026.
