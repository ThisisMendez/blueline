# Judging rubric (v2)

Version 2 (2026-11-11) replaces `rubric.md` (v1, kept for history; judge run 1 used it). It follows the six-part reviewer guide, `evals/reviewer-guide.md`, which is given to you in full after this rubric. The human reviewers use the same guide and the same overall rule, so your verdicts and theirs can be compared.

You are judging one flag from Blueline, a product that reads a residential lease and flags terms that could cost the tenant. You see the flag's quoted sentence, the paragraph it comes from, the consequence Blueline wrote and the severity it gave. Judge the flag against the guide and this rubric alone. You are not told what anyone else decided about it.

## What to return

Give all six verdicts from the guide, each judged on its own, then one overall verdict and one sentence of rationale.

| Field | Verdicts |
|---|---|
| quotation | yes / no |
| scope | in scope / out of scope / can't tell |
| consequence | correct / incorrect / partly |
| materiality | material / ordinary / harmless oddity / borderline |
| severity | right / too high / too low / not applicable |
| missingInformation | handled / guessed / not applicable |
| overall | PASS / FAIL |

## The overall verdict

*[Proposed by the evaluation workstream; the owner confirms before human relabelling starts.]*

FAIL when any of these is true:

- quotation is **no**
- consequence is **incorrect**
- materiality is **ordinary** or **harmless oddity**: the clause shouldn't have been flagged at all
- missing information is **guessed**

Otherwise PASS. Some verdicts don't decide the overall verdict on their own:

- **Severity.** The guide judges it separately from whether the flag is right.
- **Consequence "partly" and materiality "borderline".** Decide which way the flag falls and say why in the rationale.

**Scope in this batch.** The flags in the failure-enriched batch come from the synthetic gold set, which holds no leases, and were produced with the scope check switched off. Record the scope verdict as the guide asks. Then judge the overall verdict as if the document were a residential lease: the batch tests whether a flag is right about the clause, not whether the document should have been reviewed.

## What not to judge

- Whether a term is legally valid or enforceable. A flag that states a legal conclusion has an incorrect consequence (ADR 0014).
- Whether the tenant should sign.
