# 12: Automatic renewal as a named red line

**What to build:** Name automatic renewal and extension as a red line, in PRD.md's "My red lines" table and in the analysis prompt, so the review flags every term that renews, extends or continues an agreement without a fresh signature. The flag quotes the sentence that creates the renewal, not only a sentence about its consequence, and its triggering condition gives the notice deadline.

**Why:** Auto-renewal was the weakest in-scope type in the gold-set eval, at 2/6 in two runs in a row (`evals/gold-set/runs/2026-11-10T18-39-51.849Z-ungated.txt` and `2026-11-10T19-09-14.532Z-ungated.txt`), and it accounted for four of the six misses in the newest run. The prompt never mentioned renewal. Of the four misses, one quoted the next sentence instead of the renewal sentence, and three weren't flagged at all.

**Decision (owner, 2026-11-11):** a rolling month-to-month continuation that can be ended on ordinary notice is still flagged, at low severity, because the signer should know the agreement does not end on its own. The target is all six gold-set auto-renewal clauses.

**Blocked by:** 01 (flags), 11 (the eval that measures this)

**Status:** built; measured on three runs

- [x] PRD.md "My red lines" has an "Automatic renewal or extension" row with its severity rule
- [x] The analysis prompt names it, asks for the renewal sentence itself, and gives the notice deadline in triggeringCondition
- [x] Prompt wording is general. No gold-set sentence or phrasing is copied into it
- [x] Gold-set mapping points `auto-renewal` at the new red line; nothing else in the scorer changes
- [x] Three `npm run eval` runs: auto-renewal recall rises from 2/6, while groundedness, clean documents and unmatched flags don't get worse

Watch: groundedness (52/52 before), clean documents with no flags (1/3, with 2 flags, before), flags on planted documents matching no planted clause (17 before).

Evidence: `npm run typecheck` clean; `npm test` 26 files, 234 tests pass. Three complete ungated runs on 2026-11-11 (two more, at 18:22 and 18:24, were rate-limited by OpenRouter and are left out):

| Run | Recall | Auto-renewal | Groundedness | Clean docs with no flags | Unmatched flags |
|---|---|---|---|---|---|
| Baseline, 2026-11-10T19:09 | 20/26 | 2/6 | 52/52 | 1/3 (2 flags) | 17 |
| 18:15 | 24/26 | 5/6 | 58/59 | 1/3 (2 flags) | 19 |
| 18:19 | 22/26 | 5/6 | 53/55 | 1/3 (3 flags) | 16 |
| 18:34 | 24/26 | 4/6 | 55/55 | 1/3 (3 flags) | 15 |

`saas-subscription` P-03 (a monthly rollover) was missed in all three. No renewal flag landed on a clean document or an unusual-but-harmless sentence; the clean-document flags are the same no-refund and leftover-item terms as before.
