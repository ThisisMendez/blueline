# Judge run 1: review

Run 1 (`run-1.json`) disagreed with the owner on one flag of ten. Both labels stand as recorded. The disagreement is kept on purpose, as the clearest evidence so far of where the rule was too broad.

## The disagreement

| Flag | Owner | Judge |
|---|---|---|
| 8 | PASS: "Missing the cancellation deadline results in another monthly charge that cannot be refunded, creating a real financial downside." | FAIL: "The subscriber keeps the service until the end of the period already paid for and is not charged for another one, so no material cost is shown." |

## What the owner took from it

In the owner's words:

> Reviewing the disagreement on Flag #8 showed me that identifying a financial cost is not enough. I need to distinguish ordinary contractual payments from meaningful financial risks. A nonrefundable monthly subscription charge may be inconvenient without being material enough to flag. Going forward, I'll consider whether a clause creates an additional obligation, penalty, loss of rights, or significant financial exposure, rather than passing every clause involving money. I'll also evaluate severity separately from whether the flag is accurate.

## What follows

- `evals/reviewer-guide.md` now separates ordinary payments from meaningful financial risk, with examples on each side.
- The next labelling round needs flags that should fail, not just more clauses with a possible cost. Run 1 can't show whether the judge catches a bad flag, because the owner failed none.
- The guide's examples must never come from the ten flags in `evals/labels/flags.json`. If they did, the judge would be given the answer to a flag it is about to judge.
