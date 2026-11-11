# Reviewer guide (v2): judging a Blueline flag

For anyone labelling Blueline output by hand: the owner now, and the two independent reviewers the lease corpus and ticket 09 need. Version 2 (2026-11-11, Option B) replaces the single PASS/FAIL rule with six separate judgments. Every example is invented. None comes from the gold set, the public lease corpus or the ten labelled flags, so a reviewer or judge who has read this guide hasn't been given anyone's answers.

Don't manufacture a FAIL to balance the counts. If every flag you see is right, record that. What matters is that each verdict follows from the clause and the definitions below.

## The six judgments

Give each flag a verdict on all six, independently. A flag can pass one and fail another.

| # | Dimension | Question | Verdicts |
|---|---|---|---|
| 1 | Exact quotation | Is the quoted sentence in the document, character for character? | yes / no |
| 2 | Scope | Is the document a residential lease, or a document a residential lease makes part of itself? | in scope / out of scope / can't tell |
| 3 | Consequence | Does the flag describe what the clause actually does, and when it would matter, without adding facts or a legal conclusion? | correct / incorrect / partly |
| 4 | Materiality | Does the clause create a meaningful downside beyond an ordinary payment? | material / ordinary / harmless oddity / borderline |
| 5 | Severity | If material, is high, medium or low right? | right / too high / too low / not applicable |
| 6 | Missing information | Where the clause depends on a blank, a figure elsewhere or a document not supplied, does the flag say so instead of guessing? | handled / guessed / not applicable |

Code checks the first one already. You record it anyway, because a reviewer who finds a quote that isn't in their copy has found a bug.

## 1. Exact quotation

- **Clearly right:** the sentence appears in the document exactly, including its punctuation and odd spacing.
- **Clearly wrong:** a tidied-up version: straight quotes where the lease has curly ones, a fixed typo, two sentences joined.
- **Borderline:** the quote is exact but stops mid-sentence. Record yes, and note that it's partial.

## 2. Scope

- **Clearly in scope:** "This Lease is between Landlord and Tenant for Apartment 4B…"; a pet addendum the lease names as part of the agreement.
- **Clearly out of scope:** a gym membership, a storage unit agreement, a job offer, a parking-space licence on its own.
- **Borderline:** student-housing "occupancy agreements" and room licences in a shared house. Mark "can't tell" and explain; the owner decides how these are treated.

## 3. Consequence

The flag must describe what the clause does, using the clause's own figures, and the event that sets it off. It must not state what a law allows, whether the term is enforceable, or whether to sign (ADR 0014).

- **Clearly correct:** clause "Tenant shall pay a fee of $300 if the lease is ended before its term", flag "Leaving before the end of the lease costs $300."
- **Clearly incorrect:** the same clause, flag "You'll owe all the remaining rent if you leave early." That adds an obligation the clause doesn't state.
- **Also incorrect:** "This fee is probably unenforceable in most states." A legal conclusion, whatever the clause says.
- **Borderline:** the flag is right about the money but names the wrong trigger ("if you're evicted" when the clause says "if you end the lease"). Mark "partly" and say which half is wrong.

## 4. Materiality

An **ordinary payment** is the agreed price of what the signer gets, on the terms they'd expect. A clause is **material** when it creates at least one of:

- an obligation beyond the basic deal
- a penalty or charge for leaving, changing or missing a step
- the loss of a right, remedy, refund or option the signer would otherwise have
- financial exposure that is large, open-ended or out of proportion to what they get

A **harmless oddity** is unusual wording that costs nothing.

| Clause | Verdict | Why |
|---|---|---|
| Rent is due on the first of each month. | Ordinary | The basic deal. |
| A one-off application fee is stated up front. | Ordinary | Known in advance and bounded. |
| The tenant pays the electricity bill for the unit directly to the utility. | Ordinary | A usual running cost of living there. |
| Ending the lease early costs two months' rent plus rent until the unit is re-let. | Material: penalty, open-ended exposure | The amount depends on events the tenant can't control. |
| The landlord may keep the whole deposit for "any cleaning required", with no itemised list. | Material: lost right, large exposure | It can cost most or all of the deposit with no way to check. |
| The tenant waives any right to a jury trial. | Material: lost right | It removes a route to contest a problem. |
| Tenants must use the building's laundry room before 10 p.m. | Harmless oddity | Specific, but costs nothing. |
| Rent prepaid for the rest of a term is kept if the tenant leaves early, but refunded if the landlord ends it. | Borderline | A real forfeiture, but how material depends on the amount. Mark it borderline and say what would decide it. |

## 5. Severity

Judge severity only after materiality, and separately from whether the flag is right. Weigh:

- how much money or which right is at stake
- whether it's capped or open-ended
- how long it lasts
- how plausible the triggering event is for an ordinary tenant
- whether it can be undone
- whether it threatens the tenant's housing

PRD.md's "My red lines" sets the bands. High: a large or open-ended loss, or a waiver, that could change the decision to sign. Medium: a meaningful but bounded cost. Low: a real but small effect the tenant should still know about.

- **Clearly right:** losing the whole deposit on a plausible event, graded high.
- **Clearly too low:** an open-ended liability for "all costs the landlord incurs" graded low.
- **Clearly too high:** a $25 late fee graded high.
- **Borderline:** a lease that renews month to month and ends on 30 days' notice. The owner's rule (ticket 12) is to flag it, at low. Record a disagreement with the rule in your rationale rather than in the verdict.

## 6. Missing information

- **Handled:** "The amount is set in the Schedule of Fees, which isn't in what you gave us."
- **Guessed:** "This is likely around $50" when the lease leaves a blank or points elsewhere.
- **Borderline:** the flag grades a blank amount high on the grounds that it is open-ended. Acceptable if the flag says the amount is blank; guessed if it implies a figure.

## Recording a verdict

For each flag, record the six verdicts and one sentence of rationale. Mark an item **borderline** rather than forcing it. Two reviewers work separately and don't see each other's verdicts, or any Blueline output for the documents they label, until both have finished. Disagreements go to adjudication (see `evals/lease-corpus/README.md`).
