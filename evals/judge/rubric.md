# Judging rubric

You are judging flags from Blueline, a product that reads an agreement and flags terms that could cost the person signing it. Each flag quotes one sentence from the agreement. Judge each flag PASS or FAIL against this rubric alone.

## The rule

PASS if the quoted sentence really is the kind of clause the flag names and really costs the reader something. Otherwise FAIL.

Judge the quoted sentence, read in its paragraph. Do not judge:

- the severity the flag gives. Severity is not part of the rule.
- whether the quote is copied correctly. That is already checked.
- whether the agreement is the kind of document Blueline is meant for.
- whether a term is legally valid or enforceable.

## The kinds of clause Blueline flags

From PRD.md, "My red lines":

> These are Blueline's initial flag priorities, not the signer's personal red lines. Severity depends on the consequence in the particular agreement, not on how rare the clause sounds or whether the model guesses it is enforceable.

| Clause to inspect | Why it matters |
| --- | --- |
| Deposit forfeiture or broad deductions | The signer may lose money they expect to recover when moving out. |
| Early termination, reassignment, or penalty fees | A move or change in circumstances can become much more expensive than the advertised rent. |
| Waivers of dispute rights, including forced arbitration where the text says so | A renter may learn only during a dispute that the agreement narrows the route for challenging the landlord. The analysis describes the document's terms; it does not declare whether a waiver is legally valid. |
| Any other term with a plausible, material downside | A closed list would miss a consequential rent change, repair obligation, access term, or other case-specific harm. The research is thinner for several of these categories, so the explanation must rest on the actual lease text. |

For "any other term": "do not flag it just for being uncommon."

**When the flag names no clause type:** judge the first half of the rule by asking whether the sentence fits one of the four kinds above. "Any other term with a plausible, material downside" counts as a kind. *[Proposed: your notes don't settle this. Edit or delete.]*

From PRD.md, "What good looks like":

> a clean lease must not acquire an invented problem

> a plausible warning that turns out harmless is acceptable but must be counted as a false alarm

> Reviewers should be able to tell from each uncertain flag what event would make the risk real, rather than receiving either a vague hedge or a certain prediction.

## What "costs the reader something" means

A sentence costs the reader something when it creates a real downside the reader could plausibly face. Any of these counts:

- **A financial downside:** money the reader must pay, money they forfeit, a payment that can't be refunded, or a balance that falls due sooner than expected.
- **A financial obligation:** a new or continuing duty to pay, such as another term of charges or a repayment.
- **A risk moved onto the reader:** the reader bears a loss, or must insure against one, that would otherwise not be theirs.
- **Lost expected income or opportunity:** something the reader expected to get from the agreement can be taken away.
- **A lasting limitation:** a restriction on what the reader may do that continues after the agreement ends.

## Edge cases

1. **A small cost still counts.** A real financial downside passes even if the amount may be small.
2. **A conditional cost counts when the condition is plausible.** If the cost only arrives when the reader misses a deadline, cancels, leaves early or is let go, it still counts, as long as that event could plausibly happen.
3. **An optional part still counts.** A cost tied to an optional part of the agreement counts for a reader who takes that part.
4. **The other side's power counts when the reader bears the effect.** A term letting the other party end, change or withhold something passes when it would cost the reader money, income or an opportunity.
5. **Costs need not be money.** A lasting professional or practical limitation counts.
6. **A downside that is only possible is not enough.** The reader must plausibly face it, and it must be material. An unusual sentence with no real cost fails.
