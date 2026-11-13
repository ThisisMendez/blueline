# Beta pricing plan: Starter and Pro

Internal. Drafted 2026-11-13. Nothing here is a commitment, a price, or a launch date. The public `/pricing` page says the beta is free with no card, shows Starter as live and Pro as planned, and has no price, checkout, or paywall.

## Rule we're pricing under

[ADR 0012](adr/0012-require-independent-trust-evidence-before-expansion.md): a review that feels useful, or people saying they'd pay, doesn't prove the analysis can be trusted. Before we charge, independent review must show that quotes verify against the lease and that serious flags are reliably caught. Charging money is a trust claim, so the same bar applies.

## Starter: everything live today, free during beta

These ship now and we can support them with the current team and stack. They stay in Starter after the beta, because a paywall on the core review would make the verified-quote trust claim depend on payment.

- Renter or landlord review of a residential lease ([ADR 0015](adr/0015-renter-first-with-landlord-reviews.md)).
- PDF intake parsed in the browser, with the referenced documents and the missing-document stop ([ADR 0005](adr/0005-require-complete-referenced-agreement-before-review.md)).
- Verified flags with exact quotes, severity filters, the fees and charges filter, and plain-English explanations with a suggested edit.
- Lease Risk Score, a summary of verified flags only.
- The six-topic checklist ([ADR 0008](adr/0008-use-a-published-coverage-checklist.md)).
- Saved reviews (30 days, or 90 from a save, per [ADR 0011](adr/0011-expire-automatic-and-explicitly-saved-reviews.md)) and personal red lines.

## Pro candidates

Each is a candidate, not a plan. Scope and dependencies are listed so we can tell what blocks it.

| Candidate | Scope | Depends on | Needs legal review? |
| --- | --- | --- | --- |
| State and local law references | A separate section with statute titles and official links from a hand-checked list, per QUESTIONS.md G2. Never feeds the flags or the score. | A narrow Layer 2 ADR superseding part of [ADR 0014](adr/0014-layer-1-reads-the-lease-not-the-law.md); validated coverage per state and city; a process to keep links current. | Yes, before any state ships. |
| Plain-English summaries of those laws | Short summaries next to each checked reference. | The reference list above, plus written review of each summary. | Yes. |
| Jurisdiction-aware checks | Comparing a clause with a specific rule. | Both rows above, an eval set of adjudicated jurisdiction cases, and a way to show the rule's source like we show the lease's. | Yes. Highest risk of reading as legal advice. |
| Negotiation templates | Editable messages built from a flag's suggested edit. | The counter-offer residual-risk check ([ADR 0013](adr/0013-check-a-counter-offer-against-its-own-residual-risk.md)) holding up in evals; copy review so templates don't read as advice. | Light review of the template wording. |
| Printable or downloadable report | One report for co-signers (QUESTIONS.md G5). | A PDF renderer would be a new dependency and needs approval. | No. |

Anything that needs validated state or local coverage stays out of Pro until that coverage exists and a lawyer has reviewed it. Until then it isn't a feature we can sell.

## Evidence that would support charging

- Independent evaluation passing the ADR 0012 bar on the held-out set, for both roles.
- Repeat use: signers coming back to saved reviews or running a second lease, measured in our own data, not surveys.
- A Pro candidate that is built, evaluated, and requested by people already using Starter, as opposed to a feature that only looks useful.
- Direct willingness-to-pay signals for this product. Research so far only anchors on lawyer review cost ($300 to $660 and up), which is not evidence for an AI review ([PRODUCT.md](../PRODUCT.md), Evidence on Hand).
- Unit costs per review (OpenRouter calls: completeness, analysis, possible retry, checklist, legal-boundary repair, consistency) so any price covers them.

## Not in scope for Pro

- Billing, refunds, subscriptions, or checkout. None are built and none should be until the evidence above exists.
- Expansion to other contract types or property-manager portfolios. That's an ADR 0012 decision, not a pricing one.
