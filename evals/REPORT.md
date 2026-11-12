# Blueline eval report

## What the product does

Blueline helps someone who is about to sign a residential lease. They paste the lease or upload a PDF, along with every document it refers to. If a referenced document is missing, Blueline names what's missing and stops instead of reviewing part of the packet. Otherwise it summarises the agreement in plain English and flags the terms that could cost the signer. Every flag quotes the exact sentence it relies on, says what the consequence is, and says when it would matter. Blueline never says a lease is safe to sign or legally valid. It reports what the document says.

PRD.md lists the clauses Blueline promises to flag:

- deposit forfeiture or broad deductions
- early termination, reassignment, or penalty fees
- waivers of dispute rights, including forced arbitration where the text says so
- any other term with a plausible, material downside, such as a consequential rent change, a repair obligation or an access term

Severity is high, medium or low, set by the consequence in the particular agreement, not by how rare the clause sounds.

## What I measured

I ran Blueline's analysis on a gold set of 9 documents with 40 planted clauses across 7 clause types. Six documents carry planted clauses. The other three should come back with no flags. The gold set comes from an instructor's repository and was copied byte for byte, because its sentences deliberately contain curly quotes, ligatures, non-breaking spaces, em dashes and double spaces that a model tends to retype.

The numbers below come from the newest run: `evals/gold-set/runs/2026-11-10T19-09-14.532Z-ungated.txt`, started 2026-11-10 at 19:09 UTC, model `z-ai/glm-5.3-flash`. The run went through the same analysis route the product uses, with one step skipped: the completeness check. In the normal, gated run, 6 of the 9 documents are blocked before review because they refer to schedules or handbooks the gold set doesn't include. That's the right behaviour for the product, but it leaves nothing to measure recall on. The ungated run shows how the review stage performs. It isn't what a signer would see.

I mapped the gold set's 7 clause types onto PRD.md's red lines. Four count toward recall:

| Gold-set type | Blueline red line |
|---|---|
| Arbitration and class-action waiver | Waivers of dispute rights |
| Fee escalators and late fees | Early termination, reassignment or penalty fees; a consequential rent change |
| Auto-renewal | Any other term: renewal at the then-current rate is a consequential rent change and an early-exit cost |
| Unilateral modification | Any other term: a power to rewrite the terms, fees included, is a consequential rent change |

Three are out of scope and never count as misses:

- **Non-compete:** it comes from employment agreements, which PRD.md leaves out of the first version.
- **Limitation of liability** and **indemnification:** they appear in leases, but PRD.md's research section calls the evidence for them thin.

That leaves 26 of the 40 planted clauses in scope.

## The numbers

**Recall: 20/26 (76.9%).** That counts planted clauses found, out of the in-scope planted clauses. A clause counts as found when a flag quotes a sentence that overlaps it.

| Clause type | Found |
|---|---|
| Arbitration and class-action waiver | 5/5 |
| Fee escalators and late fees | 8/9 |
| Unilateral modification | 5/6 |
| Auto-renewal | 2/6 |

Four of the six misses are auto-renewal clauses. The out-of-scope types were flagged anyway, 13/14 times, but those don't count either way.

**Groundedness: 52/52 (100.0%).** Every flag the model returned quoted a sentence that appears in the document character for character. The product drops any flag whose quote doesn't match, and none were dropped in this run.

**Clean documents: 1/3 came back with no flags.** The other two got 1 flag each, 2 flags in total, against a target of 0.

**Character split:** recall on in-scope sentences containing a character a model tends to retype was 4/5 (80.0%), against 16/21 (76.2%) on plain sentences.

| Sentence contains | Found |
|---|---|
| Non-breaking space | 1/1 |
| fi or fl ligature | 2/3 |
| Two spaces in a row | 1/1 |
| Curly quote or apostrophe | 0/0 |
| Em dash | 0/0 |

Only 5 in-scope sentences carry any of these characters, so this split shows a direction, not a figure. The sentences with curly quotes or em dashes are all in out-of-scope types, so this run doesn't test those two at all.

**My hand labels: 10/10 PASS.** I labelled ten flags from this run by hand. My rule was: PASS if the quoted sentence really is the kind of clause the flag names and really costs the reader something, otherwise FAIL. The ten were picked to include the flags that matched no planted clause, spread across as many documents as possible.

## How far a model judge agrees with me

I wrote a rubric from PRD.md and my own notes, without describing any of the ten flags. Then I gave it to a fresh model that saw only the rubric and the ten flags, not my labels.

- Of the 10 flags I passed, the judge passed 9.
- I failed none, so this run cannot show whether the judge catches a bad flag.

On every flag in the run, the judge passed **48/52**.

The judge wasn't consistent. The all-flags run included my ten flags, and on that run it failed 2 of them where the first run failed 1. The rubric was the same both times, so the same flag got a different verdict on a different run.

## Limits

- **A model wrote the gold set, and none of its documents is a lease.** The clauses are hidden in the ways its author thought of, and they're worded to read like their clause type. These numbers are an upper bound, never a promise to a reader.
- **The results vary from run to run.** An earlier ungated run with the same mapping and model scored 17/26 recall, with fees at 5/9. One run isn't enough to show whether a change helped.
- **The newest run skipped the completeness check,** so it measures the review stage, not what a signer sees.
- **Blueline's flags don't carry a clause type,** so I can't measure whether a flag named the right type. The rubric judges the sentence against the four red-line kinds instead.
- **Ten labels is a start.** They all passed, which tells me my rule was too broad. A rule that fails nothing can't separate good flags from bad ones.
- **TODO: independent evidence on real leases.** The independent evaluation (ticket 09, `npm run eval:independent`) needs real lease packets labelled by two independent reviewers before seeing any output. I don't have that corpus yet, so the expansion decision it feeds is still pending.

## What I would fix next

1. **Auto-renewal recall.** It's the weakest in-scope type at 2/6, and it accounts for four of the six misses. When I fix it, auto-renewal recall should rise, and so should overall recall from 20/26.
2. **My labelling rule.** Flag 8 is where the judge and I disagreed. Reviewing it showed me that finding a cost isn't enough: I need to separate ordinary payments from penalties, lost rights and significant exposure. I'll also judge accuracy, materiality, severity and scope separately. The next round needs flags likely to fail. When I fix it, my FAIL count should rise above 0, which finally makes "of the flags I failed, the judge failed Y" measurable.
3. **Flags on clean documents.** Two of the three clean documents got a flag. When I fix it, clean documents with no flags should rise from 1/3 toward 3/3, and flags on clean documents should fall from 2 toward 0.
4. **Judge consistency.** I'll judge the same flags two or three times before trusting a verdict. When I fix it, the number of flags whose verdict changes between repeat runs should fall to 0.
