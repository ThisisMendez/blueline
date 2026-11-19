# Blueline Lease backlog

Updated November 19, 2026. The [project tracker](TRACKER.md) is the starting point for decisions and releases. This backlog records build stages. **Approved** means the direction and place in the backlog are settled. The owner approved the safeguards and tracker production release on November 19. Other tickets keep their stated scope and release gates. **Proposed** means a choice or priority still needs approval. **Parked** means no work is scheduled. Stages show order, not delivery dates.

| Where to look | What it contains |
| --- | --- |
| [HUMAN-STEPS.md](HUMAN-STEPS.md) | Open vendor work, the evidence beside each item, and what must be true to close it |
| [QUESTIONS.md](QUESTIONS.md) | What the owner already decided and the choices still open |
| [`.scratch/lease-review/issues/`](.scratch/lease-review/issues/) | Build tickets and acceptance criteria in GitHub's Files view |
| [Release audit](docs/handoff/beta-release-audit.md) | What shipped, how it was checked, and older gaps to reconcile with current code |
| [Product blueprint](research/competitors/leaseguard-ai/05-implementation-blueprint.md) | Earlier designs and tradeoffs, including ideas we have since deferred |

GitHub **Issues** is used for operating alerts such as a failed official source check. Product tickets live in the repository tree. When the owner approves a proposal, record the dated decision here or in QUESTIONS.md and link an existing ticket or create one with acceptance criteria. Leave proposed and parked ideas out of implementation queues.

**Future release targets:** v0.5.0 is the proposed Rhode Island pilot hardening release. v0.6.0 is a tentative target for a limited Dominican Republic pilot only if discovery supports launch and the owner approves it. Discovery can run alongside Rhode Island on the current plans. Neither target is a release commitment.

## Current release · v0.4.4

Release the PR #24 safeguards and consolidate the previous planning records into the [project tracker](TRACKER.md), using local checks, staging Preview, PR review and a verified production merge.

## Now · v0.5.0 Rhode Island pilot and trustworthy operations

- **In progress — vendor and site closeout.** Finish Formspree Free deletion and contract coverage, and OpenRouter/Fireworks retention and deletion. Confirm the other hosting and inbox questions before expansion. Follow the [operating checklist](HUMAN-STEPS.md). No new spend.
- **Approved — Rhode Island rental state before upload.** Ask where the rental property is located before accepting a file. Rhode Island is the only supported state; the pilot uses the user’s selection without invitations or proof of residence. Keep the statewide reference links separate from the report and score. Municipal rules remain outside the pilot. [Ticket 38](.scratch/lease-review/issues/38-ri-pilot-state-selection.md)
- **Maintenance — source monitoring.** The November 18 hosted run matched all eleven official source checks; [issue #11](https://github.com/ThisisMendez/blueline/issues/11) closed. Monitor the scheduled check and renew the dated review before December 16, 2026 UTC. If a source changes, hold it until reviewed against the official text. **v0.5.0 target:** upgrade the existing GitHub bot to warn early, attach evidence and deduplicate alerts so the owner does not have to check every week. [Source process](docs/legal/rhode-island-pilot.md) · [Ticket 43](.scratch/lease-review/issues/43-rhode-island-source-monitoring.md)
- **Closed by owner waiver — independent human renter benchmark.** On November 18 the owner approved the five sample leases for renter evaluation and chose to proceed without recruiting independent reviewers. No reviewer participation, human labels, adjudication or passing benchmark is recorded. Accuracy remains independently unvalidated. Any future AI-only assessment must be labelled as such. [Decision and ticket 17](.scratch/lease-review/issues/17-human-labelled-real-lease-holdout.md) · [Previous offline checks](docs/handoff/renter-benchmark-runbook.md)
- **Verification — production PDF check.** Do a production selectable-text PDF check with non-sensitive test material when it can be kept within approved controls and budget. This decision board did not authorize running that check. [Release evidence](docs/handoff/v0.4.0-development-evaluation.md)

## Next · v0.5.0 report usability, after pilot controls

- **Approved — help people trace report evidence.** In the same stage, locate verified quotes on PDF pages and retain attachment matches when a saved report is reopened. Preserve useful document-level citations and file lists on older reports. [Ticket 39: PDF page citations](.scratch/lease-review/issues/39-pdf-page-citations.md) · [Ticket 40: saved attachment matches](.scratch/lease-review/issues/40-persist-attachment-matches.md)
- **Approved — browser Print / Save as PDF after evidence work.** Build it after tickets 39 and 40, using browser printing so users control their copy. Keep emailed reports and live sharing parked. [Ticket 41](.scratch/lease-review/issues/41-print-save-review-as-pdf.md)
- **Proposed — use observed problems to prioritize clarity.** Short finding titles, severity filters, the score explanation, progress and stated terms already ship. [Readability](.scratch/lease-review/issues/24-flag-titles-and-readability.md) is the remaining work under ticket 24. A [clause map](.scratch/lease-review/issues/25-clause-map.md) may help with long packets, but an unmarked clause could look cleared. Keep the existing [editable draft](src/features/negotiation/ReviewSuggestions.tsx); extra tones, subject lines, and wider selection can wait for evidence of demand.

## Later · Add depth and new markets in stages

- **Approved direction — cited fee list.** List fees with exact quotes; don't label normal charges as problems. The current fee filter finds fee-related flags and does not inventory all charges. Define coverage and evaluate omissions before enabling this, especially if extraction would add model cost. [Decision D14](TRACKER.md#decisions) · [Design](research/competitors/leaseguard-ai/05-implementation-blueprint.md#feature-3-fee-inventory-and-fee-flags-junk-fee-detection--gate-g3)
- **Approved direction — Homes for one signer.** Group saved reviews for the same property; no property-manager portfolio. **Proposed after Homes:** compare an original and a revised lease, once version grouping and citations are reliable. [Decision D14](TRACKER.md#decisions) · [Comparison design](research/competitors/leaseguard-ai/05-implementation-blueprint.md#feature-9-original-vs-revised-comparison)
- **Approved direction — expand beyond Rhode Island in stages.** Add U.S. states one at a time after the pilot can maintain accurate references, handle privacy requests and show useful review evidence. Pick the next state based on demand and ability to maintain its official sources. Municipal coverage is separate future work.
- **Approved — Dominican Republic discovery alongside the Rhode Island pilot.** Use public sources and synthetic Dominican Spanish examples on the current plans. Discovery feeds the tentative v0.6.0 launch decision. A Dominican launch and live uploads require separate approval after local scope, quality, privacy and support are understood. [Ticket 42](.scratch/lease-review/issues/42-dominican-republic-discovery.md) · [Discovery note](docs/product/dominican-republic-discovery.md)

## Parked · Revisit only when there is a reason

- **Decided — keep verified manual deletion through Contact for the pilot.** Self-service stays parked. Revisit review deletion first if requests become frequent or slow; an in-app button would not handle copies at outside vendors. [Deletion procedure](docs/legal/privacy-deletion-procedure.md)
- Live co-signer sharing, emailed reports and move-in/deposit records are deferred. A free law-clinic review can happen if available. Entity/DBA and trademark filings are optional decisions with a separate budget.
