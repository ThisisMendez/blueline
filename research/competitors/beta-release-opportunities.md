# Beta release opportunities for renters and landlords

Reviewed 2026-11-13 against Blue Line’s beta candidate at `4ebdab0`. Scope covers the public paths of LeaseGuard AI and TurboTenant. The existing LeaseGuard research remains the detailed record. [Feature inventory](leaseguard-ai/01-feature-inventory.md) · [User journey](leaseguard-ai/02-user-journey.md) · [Implementation blueprint](leaseguard-ai/05-implementation-blueprint.md)

## What the evidence shows

| Product | Observed in the public browser | First-party documentation and limits |
| --- | --- | --- |
| LeaseGuard AI | Its fictional sample presents an overall grade, severity counts, ranked findings, lease excerpts, consequences, next steps, statute links, and an upgrade prompt. The page labels the lease fictional. | Negotiation templates per flag, PDF and email export, statute coverage and the draft-versus-revised comparison are vendor descriptions. The paid flows and real-lease analysis were outside this check. [Sample report](https://leaseguardai.com/analyze?demo=true) · [How it works](https://leaseguardai.com/how-it-works) · [Pricing](https://leaseguardai.com/pricing) |
| TurboTenant | Its public Lease Agreement Audit AI shows a jurisdiction selector and a lease upload control. | The vendor documents a free landlord audit with an emailed results link, and a separate guided lease builder with fees, deposits, obligations, supporting attachments, and e-signatures. The audit output, citation quality, accuracy, and internal method were outside this check. [Audit intake](https://rental.turbotenant.com/lease-agreement-audit-ai) · [Audit help](https://support.turbotenant.com/en/articles/9437901-how-to-use-the-lease-agreement-audit-ai) · [Lease builder](https://support.turbotenant.com/en/articles/4403674-how-to-create-a-lease-agreement) |

Confidence is high for the rendered entry points and sample layout, and limited to the vendor’s own statements for runtime capabilities. The existing [LeaseGuard evidence index](leaseguard-ai/03-rea-evidence.md) tracks 17 public captures. This pass ran the local REA 6.7.0 CLI at `3fca2e0` with an isolated browser, URL and accessibility capture, and a six-second wait. Both commands exited 0. Evidence IDs were `ev_56e6336c42703b7b11777a8d5132998679177fa616271334f7af280ae558b751` (LeaseGuard sample) and `ev_1c9bc04e9d1e835463790d8a932760147a9cb185fb2813bd7c7af1d115a46240` (TurboTenant intake). No lease, account details, or payment were submitted. No REA MCP was exposed in this session. The local CLI was sufficient.

## Where Blue Line can improve

Keep the sample’s readable order of score, counts, and cited findings. Blue Line already implements it. Borrow the practice of ending each finding with a concrete next step. TurboTenant’s staged workflow also supports keeping an explanation and its suggested revision close together. Blue Line’s own finding cards already show the source, next step, proposed edit, and remaining risk. [Current report](../../src/features/review/components/ReviewResult.tsx) · [Finding cards](../../src/features/review/components/RiskFlagCard.tsx)

Keep each improvement within Layer 1. State comparisons, enforceability labels, coverage claims, legal conclusions, competitor scoring formulas, automatic sending, upgrades, and signing workflows belong outside this release. The score already has a local documented rule, and the beta plan keeps core findings available to both roles. [Layer 1 decision](../../docs/adr/0014-layer-1-reads-the-lease-not-the-law.md) · [Scoring](../../docs/scoring.md) · [Beta plan](../../docs/beta-pricing-plan.md)

### Renter candidate

A shortlist of up to three discussion points is a contained slice of [ticket 26](../../.scratch/lease-review/issues/26-negotiation-email-draft.md). Take distinct High and Medium findings in report order. Each row keeps the same verified quote, practical consequence, and proposed change. Three keeps the list readable and leaves the full report available when more issues matter. Skip findings without usable proposal text or whose language was withheld. Let the renter select which suggestions to include and copy or edit an optional draft. No new model request is necessary for an assembled draft, and the renter owns any communication. Preserve the proposal and its limitations when a flag is opened. [Counter-offer decision](../../docs/adr/0010-draft-plausible-counter-offers.md) · [Counter-offer and remaining risk check](../../docs/adr/0013-check-a-counter-offer-against-its-own-residual-risk.md) · [Withheld-field behavior](../../src/features/analysis/legal-claims.ts)

### Landlord candidates

Scores are relative to this release, on a 1–5 scale. Higher effort scores mean less work. Weighted total uses user value 30%, effort 25%, fit 20%, reliability and testability 15%, and reuse 10%.

| Candidate | Value | Effort | Fit | Reliability | Reuse | Weighted / 5 | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| A. Lease Improvement Assistant | 5 | 5 | 5 | 4 | 5 | 4.85 | Choose a small landlord-only shortcut to already cited, usable revisions. Keep wording editable and clear that proposals require review. |
| C. Clause Consistency Checker | 4 | 3 | 5 | 3 | 4 | 3.80 | Defer a dedicated checker. A related citation can be a cap or exception as well as a conflict. A reliable filter needs an explicit distinction and test cases where terms reconcile. |
| B. Landlord Obligation Summary | 4 | 2 | 4 | 3 | 3 | 3.25 | Defer an exhaustive summary. Some topics have existing checklist evidence, but a complete inventory of parties, obligations, deadlines and notices needs broader extraction and grounding. |

The renter candidate scores **4.85/5** with the same inputs as A. Both role experiences can reuse verified findings, with a renter discussion prompt and a landlord revision prompt drawn from the report for the chosen role. Blue Line’s analysis prompt already asks for both sides of a genuine contradiction and for caps or exceptions where relevant. Its separate consistency pass checks an existing proposed edit against its own stated remaining risk. That pass does not classify conflicts between clauses. [Analysis prompt](../../src/features/analysis/prompt.ts) · [Consistency prompt](../../src/features/analysis/consistency-prompt.ts) · [Finding data](../../src/features/analysis/types.ts)

Verification should cover older saved reports, absence of eligible findings, source ordering, withheld proposals, more than three candidates, and role-specific copy. Run it through both anonymous and saved report routes. Confirm that the new presentation does not change the score or trigger another analysis call. [Report entry point](../../src/features/review/components/ReviewResult.tsx) · [Library types](../../src/features/library/store.ts)
