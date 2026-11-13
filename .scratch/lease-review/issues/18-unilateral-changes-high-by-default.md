# 18: Material unilateral changes are High by default

**What to build:** A clause that lets the landlord or another party change terms, charges or the signer's obligations without the signer's agreement is graded High by default, including a change that takes effect when a new version is posted. Medium stays available only when the text bounds the power with clear limits: a stated cap on any increase, advance notice together with a right to leave without penalty, or a power limited to a narrow named subject. Notice alone and "reasonable" are not limits. The severity explanation is grounded in the clause text.

**Blocked by:** 15

**Status:** built; see the measured runs below

**2026-11-12 update.** The default above applies to the renter-side exposure it describes. A landlord review grades the landlord's supported exposure and explains its basis using the same underlying contract terms. [Product requirements](../../../PRD.md#my-red-lines).

Blueline has no Critical tier (severity is high, medium or low). The brief's "apply Critical when the existing Critical criteria are met" has nothing to attach to, and adding a tier was not approved. The gold set grades all six unilateral cases critical, so the best a product grade can do is High. The report shows that as a gap instead of hiding it: exact-band agreement uses the gold set's own labels, so High on a critical case is not exact.

- [x] PRD.md "My red lines" has a unilateral-changes row; the analysis prompt has the matching bullet
- [x] Report lists the six cases' grades each run and prints `Six unilateral cases High: n/6`
- [x] Exact-band agreement prints beside the mapped agreement; original gold labels are preserved
- [x] Unit tests (no network) for the six-case report and exact-band agreement
- [ ] Owner decision: whether a Critical tier is wanted. Not added.

Baseline (not "0/6"): High in 2/6, 1/6, 2/6, 2/6 runs; mapped agreement 64-72%.

## Measured (final prompt, complete ungated runs)

| Run | Six cases High | Recall /26 | Mapped agreement | Exact-band agreement |
|---|---|---|---|---|
| 2026-11-11T20-30-21 | 6/6 | 25 | 21/25 | 10/25 |
| 2026-11-12T03-42-15 | 6/6 | 25 | 21/25 | 10/25 |
| 2026-11-12T03-46-02 | 6/6 | 26 | 22/26 | 11/26 |

Baseline mapped agreement was 64-72%; these are 84-85%. Exact band is 0/11 on every gold-critical clause, because Blueline has no Critical tier: that is the visible gap. Three earlier runs with the first prompt (6/6 High each) had recall 25, 22, 23 because a narrower charge clause was folded into the broad-power flag; the per-clause-flag instruction fixed it. Three later runs (2026-11-11T22-55, 23-23, 2026-11-12T01-13) came back with "model returned no content" on 4 to 6 documents and are not counted.
