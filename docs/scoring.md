# Lease Risk Score

Version `lrs-1`. Code: `src/features/score/score.ts`. Tests: `src/features/score/score.test.ts`. Decision: [ADR 0016](adr/0016-lease-risk-score.md).

## The rule

1. Count the review's verified risk flags by severity. One flag is one finding, however many passages it cites (`relatedCitations`). Two entries with the same id count once, at the more serious severity.
2. Start at 100 and deduct per flag:

   | Severity | Deduction |
   | --- | --- |
   | High | 16 |
   | Medium | 7 |
   | Low | 3 |

3. Clamp the result into the band the most serious flags set:

   | Flags present | Score range | Grade |
   | --- | --- | --- |
   | Two or more High | 1 to 59 | F |
   | Exactly one High | 60 to 69 | D |
   | Medium, no High | 70 to 79 | C |
   | Low only | 80 to 100 | A or B |
   | None | 100 | A |

4. The rule is the same for renter and landlord reviews.

Adding a flag never raises the score (tested over every mix up to 8 of each severity).

## Grade bands

| Grade | Score | Label |
| --- | --- | --- |
| A | 90 to 100 | Few or no concerns found |
| B | 80 to 89 | Minor concerns |
| C | 70 to 79 | Notable concerns |
| D | 60 to 69 | High-risk concerns |
| F | 1 to 59 | Severe concerns found |

Exported as `GRADE_BANDS`. With these weights, Low-only reviews score 100, 97, 94, 91, 88, 85, 82, then 80, so 89 and 90 never occur.

## What never counts

- Checklist topics that weren't found (ADR 0007).
- Personal red-line matches.
- Proposed flags that failed citation verification. These don't count, and if any exist the score is withheld.

## When there is no score

`scoreReview` returns `available: false` with a reason and a signer-facing explanation (`UNAVAILABLE_EXPLANATIONS`):

| Reason | When |
| --- | --- |
| `incomplete-packet` | Outcome `blocked`: a required document is missing |
| `out-of-scope` | Not a residential lease, or the check couldn't tell |
| `completeness-unverified` | Completeness couldn't be verified, so no review ran |
| `review-failed` | A model call failed |
| `request-rejected` | The request never reached the model |
| `unverified-flags` | `droppedFlagCount > 0`. The verified counts are still returned |
| `legacy-review` | No `role` on the review: saved before role selection (migration 0007) |
| `unscoreable-data` | An unknown severity, a missing or invalid `droppedFlagCount`, or no flag list |

A dropped flag withholds the score even when the verified flags already sit at 1. The counts would still be wrong, and the rule stays simple to explain.

## Revisions from the starting rule

The brief proposed: deduct 16/7/3 from 100, clamp 1 to 100, cap at 79 when any Medium or High exists, cap at 59 with two or more High.

| Case | Starting rule | `lrs-1` | Why it changed |
| --- | --- | --- | --- |
| 1 High | 79, C | 69, D | One decision-changing loss (ADR 0003) shouldn't read "Notable concerns" |
| 1 High, 2 Low (L01, development lease) | 78, C | 69, D | Same |
| 8 Low | 76, C | 80, B | Minor effects alone shouldn't reach "Notable concerns" |
| 5 Medium | 65, D | 70, C | "High-risk concerns" with no High flag contradicts the counts |
| 1 High, 4 Medium | 56, F | 60, D | "Severe concerns found" is kept for two or more High flags |
| 2 High | 59, F | 59, F | Unchanged. The 59 cap is confirmed |

## Validation

None of these cases is held out, and none comes from `evals/holdout`. Fixture expectations were written by agents and the gold set by a model, so this checks that the rule sends a sensible signal on real-shaped reviews. It says nothing about whether the severities are right.

### Synthetic fixtures (expected severities from the sidecars)

| Case | Role | High / Medium / Low | Score | Grade |
| --- | --- | --- | --- | --- |
| `clean-lease` | renter | 0 / 0 / 0 | 100 | A |
| `adhesion-lease` | renter | 5 / 4 / 0 | 1 | F |
| `referencing-lease` with `fee-schedule` and `pet-addendum` | renter | 2 / 5 / 0 | 33 | F |
| `tests/support/role-fixture-model.ts`, run through `runGeneralReview` | renter | 1 / 2 / 0 | 69 | D |
| Same packet | landlord | 1 / 1 / 1 | 69 | D |

### Development leases, real model output (renter prompt before role selection)

`evals/lease-corpus/runs/2026-11-12T04-11-51.871Z-x3.json` (local only), `z-ai/glm-5.3-flash`, three repeat runs. L03, L07 and L10 were blocked as incomplete in all three, so they get no score.

| Lease | Run 1 | Run 2 | Run 3 |
| --- | --- | --- | --- |
| L01 | 1 / 0 / 2: 69, D | 1 / 0 / 1: 69, D | 1 / 0 / 1: 69, D |
| L08 | 0 / 1 / 2: 79, C | 0 / 0 / 3: 91, A | 0 / 0 / 3: 91, A |

L08 shows the score can move a whole grade between identical runs, because the model's severity for one flag changed. Treat a single run's grade with that in mind.

### Gold set, real model output (renter, ungated, not leases)

`evals/gold-set/runs/2026-11-12T04-06-26.390Z-ungated.json`. None of these documents is a lease, and the gated product blocks them, so they only show how the rule spreads real-shaped flag mixes.

| Document | High / Medium / Low | Dropped | Score |
| --- | --- | --- | --- |
| adhesion-contract | 9 / 4 / 4 | 2 | unavailable (`unverified-flags`); would be 1, F |
| saas-subscription | 5 / 3 / 5 | 1 | unavailable (`unverified-flags`); would be 1, F |
| offer-letter | 4 / 3 / 0 | 0 | 15, F |
| storage-unit-rental | 5 / 1 / 2 | 0 | 7, F |
| phone-plan-terms | 4 / 4 / 2 | 0 | 2, F |
| internship-agreement | 5 / 1 / 1 | 0 | 10, F |
| clean-document | 0 / 0 / 2 | 0 | 94, A |
| swim-lesson-registration | 0 / 0 / 2 | 0 | 94, A |
| library-volunteer-agreement | 0 / 0 / 0 | 0 | 100, A |

Two of the three documents meant to be clean scored 94 rather than 100 because of Low flags the gold set counts as false alarms. The grade stays A, which is the right signal for two minor flags.

## Versioning

Any change to a weight, band, cap, floor, label or exclusion makes a new version (`lrs-2`, and so on) and a new ADR or an amendment to ADR 0016. The version travels with every score, so a saved screenshot or export can say which rule produced it.
