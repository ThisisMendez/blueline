# Blueline Lease backlog

Updated November 18, 2026. This is the starting point for product planning. **Approved** means the direction is settled. **Proposed** means a choice or priority still needs approval. **Parked** means no work is scheduled. Stages show order, not delivery dates.

| Where to look | What it contains |
| --- | --- |
| [HUMAN-STEPS.md](HUMAN-STEPS.md) | Open vendor work, the evidence beside each item, and what must be true to close it |
| [QUESTIONS.md](QUESTIONS.md) | What the owner already decided and the choices still open |
| [`.scratch/lease-review/issues/`](.scratch/lease-review/issues/) | Build tickets and acceptance criteria in GitHub's Files view |
| [Release audit](docs/handoff/beta-release-audit.md) | What shipped, how it was checked, and older gaps to reconcile with current code |
| [Product blueprint](research/competitors/leaseguard-ai/05-implementation-blueprint.md) | Earlier designs and tradeoffs, including ideas we have since deferred |

GitHub **Issues** is used for operating alerts such as a failed official source check. Product tickets live in the repository tree. When the owner approves a proposal, record the dated decision here or in QUESTIONS.md and link an existing ticket or create one with acceptance criteria. Leave proposed and parked ideas out of implementation queues.

## Now · Rhode Island pilot and trustworthy operations

- **In progress — vendor and site closeout.** Finish Formspree Free deletion and contract coverage, and OpenRouter/Fireworks retention and deletion. Confirm the other hosting and inbox questions before expansion. Follow the [operating checklist](HUMAN-STEPS.md). No new spend.
- **Approved direction — Rhode Island only.** Support residential rentals in Rhode Island first. Users pick the state, and Rhode Island is the only supported choice. Keep the official statewide links separate from the lease report and score. Show that municipal rules are outside the pilot. The remaining implementation choice is a location selection alone or location selection plus invitations. [Pilot intake ticket](.scratch/lease-review/issues/38-ri-pilot-state-selection.md)
- **Maintenance — source monitoring.** The November 18 hosted run matched all eleven official source checks; [issue #11](https://github.com/ThisisMendez/blueline/issues/11) closed. Monitor the scheduled check and renew the dated review before December 16, 2026 UTC. If a source changes, hold it until reviewed against the official text. [Source process](docs/legal/rhode-island-pilot.md)
- **Verification — prove what works.** Do a production selectable-text PDF check with non-sensitive test material when it can be kept within approved controls and budget. The AI-assisted development baseline is complete. The separate human benchmark still needs owner confirmation, two blind reviewers, a separate adjudicator and its first scored run. Start with renters unless funding and separately labeled landlord cases justify a paired run. A five-template score is a first baseline. Nothing here authorizes a paid run. [Release evidence](docs/handoff/v0.4.0-development-evaluation.md) · [Holdout plan](evals/holdout/README.md)

## Next · Make findings easier to verify

- **Proposed — show the page for a verified quote and keep attachment matches when a saved review is reopened.** This helps people find the exact language and remember which uploaded file satisfies a reference. Browser extraction and existing data should suffice without another model call. Page breaks, repeated quotes, older reports, and saved data changes need explicit tests. Keep document-level citations where there is no reliable page. [Evidence and gaps](docs/handoff/beta-release-audit.md#reconciliation)
- **Proposed — print or Save as PDF from the browser.** After the citations are easier to verify, a print view makes it easier to take a report to a discussion. The user controls who gets the downloaded copy. Keep lease text out of automatic email and avoid a new service. [Print design](research/competitors/leaseguard-ai/05-implementation-blueprint.md#feature-8-downloadable-report-pdf)
- **Proposed — use observed problems to prioritize clarity.** Short finding titles, severity filters, the score explanation, progress and stated terms already ship. [Readability](.scratch/lease-review/issues/24-flag-titles-and-readability.md) is the remaining work under ticket 24. A [clause map](.scratch/lease-review/issues/25-clause-map.md) may help with long packets, but an unmarked clause could look cleared. Keep the existing [editable draft](src/features/negotiation/ReviewSuggestions.tsx); extra tones, subject lines, and wider selection can wait for evidence of demand.

## Later · Add depth and new markets in stages

- **Approved direction — cited fee list.** List fees with exact quotes; don't label normal charges as problems. The current fee filter finds fee-related flags and does not inventory all charges. Define coverage and evaluate omissions before enabling this, especially if extraction would add model cost. [Decision G3](QUESTIONS.md#leaseguard-equivalent-features-decided-2026-11-12) · [Design](research/competitors/leaseguard-ai/05-implementation-blueprint.md#feature-3-fee-inventory-and-fee-flags-junk-fee-detection--gate-g3)
- **Approved direction — Homes for one signer.** Group saved reviews for the same property; no property-manager portfolio. **Proposed after Homes:** compare an original and a revised lease, once version grouping and citations are reliable. [Decision G4](QUESTIONS.md#leaseguard-equivalent-features-decided-2026-11-12) · [Comparison design](research/competitors/leaseguard-ai/05-implementation-blueprint.md#feature-9-original-vs-revised-comparison)
- **Approved direction — expand beyond Rhode Island in stages.** Add U.S. states one at a time after the pilot can maintain accurate references, handle privacy requests and show useful review evidence. Pick the next state based on demand and ability to maintain its official sources. Municipal coverage is separate future work.
- **Discovery — Dominican Republic.** Start with public sources and synthetic Dominican Spanish examples. Before accepting live uploads, confirm the local residential scope, Spanish-language review quality, data transfers and deletion, and who owns ongoing source and support maintenance. [Dominican Republic discovery](docs/product/dominican-republic-discovery.md)

## Parked · Revisit only when there is a reason

- Keep verified manual deletion through Contact for the pilot while it is manageable. Revisit self-service review deletion first if requests become frequent or slow; an account button still would not delete copies at outside vendors. [Deletion procedure](docs/legal/privacy-deletion-procedure.md)
- Live co-signer sharing, emailed reports and move-in/deposit records are deferred. A free law-clinic review can happen if available. Entity/DBA and trademark filings are optional decisions with a separate budget.
