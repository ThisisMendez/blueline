# Product decisions and parked questions

See [BACKLOG.md](BACKLOG.md) for the current stages and ticket links.

## LeaseGuard-equivalent features: decided 2026-11-12

Recorded from the owner's answers. Details are in `research/competitors/leaseguard-ai/05-implementation-blueprint.md`.

- **G1, Health Score A–F.** **Build it.** A deterministic risk grade from verified flags, labelled "Low risk" to "High risk", never "safe to sign" or "good/bad lease". Record in a new ADR when built.
- **G2, state legal references.** **A checked list, sequenced last.** A separate section showing statute titles and official links from a list checked by hand. No AI-written law. A narrow Layer 2 ADR supersedes the relevant part of ADR 0014.
- **G3, junk fees.** **A fee list** with each fee's cited sentence and no judgments. A fee becomes a flag only under existing flag rules.
- **G4, multi-property dashboard.** **Homes for a single signer** in the library. No property-manager portfolio tooling. Landlords are still supported as a review role (updated 2026-11-13, [ADR 0015](docs/adr/0015-renter-first-with-landlord-reviews.md)).
- **G5, co-tenant sharing.** **Defer live sharing.** Co-signers get the printable report (feature 8) for now.
- **G6, Deposit Shield.** **Deferred.**

## v0.4.0 launch decisions, November 16, 2026

- The product and company name is Blueline Lease. Alexis Mendez operates the beta as an individual in Rhode Island. The first homepage and Terms mention uses ™, and the footer carries the 2026 copyright notice. Public support is `support@bluelinelease.com`. The direct address `alexismendez@bluelinelease.com` is reserved for owner correspondence.
- `https://bluelinelease.com` becomes canonical after DNS and TLS pass. The `www` and legacy production host redirect to the apex with HTTP 301. Keep existing Supabase and GitHub identifiers.
- Cloudflare Email Routing handles inbound aliases and catch-all. Resend Free is the selected SMTP provider for branded auth and Gmail send-as. Formspree sends to the verified support address. Keep features off until their delivery checks pass.
- Keep the configured GLM 5.3 Flash production model and the existing spending cap. The two-judge baseline is internal regression evidence only. Use the higher severity for a still-unsettled disagreement unless the text fails the guide. Record the reasons in the [development evaluation](docs/handoff/v0.4.0-development-evaluation.md).
- Terms and Privacy v1 are self-drafted and have not been reviewed by counsel. The free beta is 18+, with express account signup acceptance and no arbitration or class waiver. Support handles verified privacy requests. See the [legal index](docs/legal/README.md).
- Rhode Island's pilot is a separate statewide list of seven official links. Providence, local rules, and § 34-18-20 are excluded. The pilot must pass hosted source checks before going public.

## Rhode Island pilot direction, November 18, 2026

- Start with residential rentals in Rhode Island. Ask users to pick the state; Rhode Island is the only supported state in the pilot. Clearly label official references as statewide and selected. Keep them separate from the lease findings and score.
- Providence and other municipal rules are future work. Plan later U.S. states individually and treat the Dominican Republic as a distinct market requiring discovery and review before launch.
- Stay on the current plans with no new spend. The owner confirmed authority to sign for Blueline; the Formspree agreement still needs the owner's review and acceptance when it arrives.

## Decisions recorded from the November 18, 2026 decision board

- **Now — pilot entry.** Ask for the rental property’s state before upload. Accept Rhode Island, with no invitation requirement. [Ticket 38](.scratch/lease-review/issues/38-ri-pilot-state-selection.md)
- **Now — accuracy.** Plan the first human benchmark for renters. This does not confirm the five-template set or its use terms. [Ticket 17](.scratch/lease-review/issues/17-human-labelled-real-lease-holdout.md)
- **Next — traceability.** Add both [PDF page citations](.scratch/lease-review/issues/39-pdf-page-citations.md) and [saved attachment matches](.scratch/lease-review/issues/40-persist-attachment-matches.md).
- **Next — printable reports.** Then add browser [Print / Save as PDF](.scratch/lease-review/issues/41-print-save-review-as-pdf.md).
- **Parked — self-service deletion.** Keep verified manual deletion for the pilot. Revisit if support turnaround or request volume becomes a problem.
- **Later — market expansion.** Prove the Rhode Island pilot first. Run [Dominican Republic discovery](.scratch/lease-review/issues/42-dominican-republic-discovery.md) in parallel using public sources and synthetic examples. There is no approval to launch a new market.

These decisions approve planning and filing only. They do not authorize deployment, signing agreements, paid work, using real lease data, confirming holdout use terms, or launching a new market.

## Operating updates, November 18, 2026

- **Rhode Island source maintenance:** The owner should not have to check sources manually every week. Upgrade the existing bot for early warning, evidence and clear resolution; keep changed references held. Proposed target v0.5.0. [Ticket 43](.scratch/lease-review/issues/43-rhode-island-source-monitoring.md)
- **Dominican Republic:** Discovery in parallel; v0.6.0 is a tentative private-pilot target, subject to the launch gates and separate approval. [Discovery plan](docs/product/dominican-republic-discovery.md)
- **Accuracy — superseding owner decision:** The five sample leases are approved for renter evaluation. The owner chose to skip independent human reviewers and move forward. Close the human-review requirement as waived, not passed. Do not claim human validation or invent reviewer records. Existing offline checks and AI-assisted development results stand separately. No new spend or live model run is authorized by this waiver. [Ticket 17](.scratch/lease-review/issues/17-human-labelled-real-lease-holdout.md)

## Still open

- [Operating checklist](HUMAN-STEPS.md): vendor evidence and site closeout. Contact, signup, recovery and the synthetic deletion rehearsal have passed.
- [Backlog](BACKLOG.md): the live selectable-text PDF check is still unrecorded.
- [Counsel packet](docs/legal/counsel-packet.md): optional free legal review. New dependencies, plan upgrades, and paid filings need separate approval.
