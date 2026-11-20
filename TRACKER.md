# Blueline Lease tracker

Updated November 19, 2026. Start here for decisions, open work and releases. Alexis Mendez owns the product decisions. The delivery agent maintains this tracker with each PR and release. Account details, signed agreements and private data stay outside this public repository.

## Releases

| Release | Purpose | Status and evidence |
| --- | --- | --- |
| [v0.4.3](https://github.com/ThisisMendez/blueline/releases/tag/v0.4.3) | Live beta, email and account flows | Existing production baseline before this release. Contact, confirmation, recovery and synthetic deletion checks are recorded in the [release audit](docs/handoff/beta-release-audit.md). |
| [v0.4.4](https://github.com/ThisisMendez/blueline/releases/tag/v0.4.4) | Safer development, required PR checks, and this tracker | Released. [PR #24](https://github.com/ThisisMendez/blueline/pull/24) supplies the safeguards; PR #25 adds the tracker. The release records the checks and production result. |
| [v0.4.5](https://github.com/ThisisMendez/blueline/releases/tag/v0.4.5) | Signup password confirmation, Show/Hide controls and existing-account guidance | Current patch. [Ticket 44](.scratch/lease-review/issues/44-signup-passwords-and-existing-accounts.md) and the [release record](docs/handoff/v0.4.5-release.md) hold the diagnosis. The published release records deployment completion. |
| v0.5.0 | Rhode Island pilot controls, source-monitoring upgrade and report usability | Planned, not shipped. Do the state gate and monitoring first, page citations and saved attachment matches next, and browser Print / Save as PDF after those. [Backlog](BACKLOG.md) |
| v0.6.0 candidate | Limited Dominican Republic pilot | Discovery only; no launch date or live uploads authorized. Discovery can run alongside the Rhode Island pilot. [Discovery plan](docs/product/dominican-republic-discovery.md) |
| Later, unassigned | Additional U.S. states, fee list, Homes and revised-lease comparison | Select work using pilot demand and the ability to support it on the current plans. Municipal coverage stays separate. |

A target is not a promise to ship. The version in the app package and the published GitHub release identify an actual release. A milestone is complete only when its acceptance checks and production verification are recorded.

## Latest updates

- **November 19:** Investigated the reported missing signup codes. Both addresses already had confirmed accounts; fresh email-link logins succeeded for both. Patch v0.4.5 adds matching-password checks, Show/Hide controls and a direct way out of duplicate signup. No owner's password was changed.
- **November 19:** The owner approved the full release process and production after its gates. PR #24 completed standards/spec review, local checks and the staging Preview and merged. The earlier planning-tag decisions are consolidated here for publication on main.
- **November 19:** OpenRouter supplied a more specific gateway-policy and deletion answer. Fireworks agreement scope and provider deletion are still unanswered. We asked support to link its older closure reminder to the active request. Formspree has not supplied the signing link.
- **November 18:** The independent human accuracy requirement was waived by the owner. That is a waiver, not a passing validation.

## Decisions

“Decided” settles direction. “Waiting” identifies unfinished evidence or execution, not a request to decide the same question again.

| ID | Date | Decision | State / what follows |
| --- | --- | --- | --- |
| D01 | Nov 19 | Use a fresh branch, develop, test locally, preview with staging data, review the PR, then merge to main and verify production. | Decided. Required process for every release. No direct feature pushes to main. |
| D02 | Nov 19 | Adopt the development safeguards in PR #24 and release after the checks and staging review pass. | Approved. Required PR checks and the known-production-database guard are part of v0.4.4. |
| D03 | Nov 18 | Ask for the rental property's state before upload; Rhode Island is the only supported state. No invitations or proof of residence. | Decided. [Ticket 38](.scratch/lease-review/issues/38-ri-pilot-state-selection.md), v0.5.0. |
| D04 | Nov 18–19 | Keep the owner out of routine source checking. Improve the existing bot and withhold changed or expired references until reviewed. | Decided. [Ticket 43](.scratch/lease-review/issues/43-rhode-island-source-monitoring.md), v0.5.0. Current reviewed sources expire December 16 UTC. |
| D05 | Nov 18 | Add both PDF page citations and saved attachment matches, then browser Print / Save as PDF. | Decided. [39](.scratch/lease-review/issues/39-pdf-page-citations.md) + [40](.scratch/lease-review/issues/40-persist-attachment-matches.md) precede [41](.scratch/lease-review/issues/41-print-save-review-as-pdf.md). |
| D06 | Nov 18 | Keep verified manual deletion through support during the pilot. | Decided. Self-service is parked. Revisit if requests become frequent or responses become slow. |
| D07 | Nov 18 | Approve the five samples and waive independent human reviewers. | Closed by owner waiver, not a passing benchmark. Existing AI-assisted and offline checks remain separate. [Ticket 17](.scratch/lease-review/issues/17-human-labelled-real-lease-holdout.md). |
| D08 | Nov 19 | Keep Formspree only if its existing Free plan provides acceptable agreement coverage and a workable verified deletion process. Request and assess the agreement; the owner signs the actual terms when ready. | Direction decided; waiting for agreement and deletion answers. No signature or agreement acceptance has occurred. [Checklist](HUMAN-STEPS.md). |
| D09 | Nov 19 | If a current vendor cannot support the needed handling on its existing plan, narrow or replace the affected workflow within the no-spend limit before making unsupported promises. | Decided. Do not upgrade automatically. Prepare the concrete change after the vendor answers. |
| D10 | Nov 19 | Resolve OpenRouter/Fireworks handling through written answers and verified controls on the current plan. Keep the item open through site changes. | Direction decided; Fireworks agreement/deletion and deployed settings remain open. [Vendor register](docs/legal/vendor-dpas.md). |
| D11 | Nov 19 | Keep consumer Gmail for minimal general support while reviewing the actual data path; do not solicit leases, passwords, codes or identity details there. | Operating direction decided. Mailbox retention, deletion and agreement suitability remain checks. An alias does not change mailbox terms. |
| D12 | Nov 19 | Prove the Rhode Island pilot and explore the Dominican Republic in parallel using official sources and synthetic examples. | Decided. v0.6.0 is only a launch candidate after discovery and separate approval. [Ticket 42](.scratch/lease-review/issues/42-dominican-republic-discovery.md). |
| D13 | Nov 19 | Choose the next U.S. state after Rhode Island demand and source-maintenance capacity are known. Do not select a state based on guesswork now. | Deliberately deferred with a trigger. One state at a time; no new-state implementation queued. |
| D14 | Nov 12–19 | Keep a cited fee list and Homes for one signer in the later backlog. Keep live sharing, emailed reports, move-in records and municipal rules parked. | Decided. Revised-lease comparison follows stable grouping and citations. |

## Open work and closure

| Item | Next action | Close only when |
| --- | --- | --- |
| Formspree | Wait for secure agreement and clear steps for older Free submissions; review both. | Agreement outcome, deletion procedure or replacement workflow, any affected site copy and live verification are recorded. |
| OpenRouter / Fireworks | Confirm provider agreement and deletion/backup handling; verify production routing and privacy settings without lease content. | Vendor evidence, supported controls and site disclosures agree; live changes are verified. |
| Vercel, Cloudflare and Gmail | Verify the current plan/service terms and the data each service handles. Check Vercel Hobby plan fit before further growth. | Coverage or a compatible operational path is recorded; no plan upgrade inferred. |
| Authentication patch | Complete staging and PR gates for ticket 44, merge, then inspect production. | The v0.4.5 release identifies the actual commit, checks and deployed result. |
| Rhode Island source lifecycle | Implement the bot upgrade before the December 16 deadline. | Deadline warning, recovery, changed-source handling and deployment are verified. |
| Production PDF exercise | Exercise the live file path with synthetic material under the approved controls and budget. | Result is recorded; offline fixtures alone do not close it. |
| Dominican discovery | Determine demand, local scope, Spanish quality, privacy path and continuing support. | A documented go/no-go recommendation exists. A positive recommendation still needs launch approval. |

## How to keep this current

- Add a dated decision row when direction changes. Name the decision it supersedes rather than leaving both active.
- Each build ticket gets a stage, release target when known, acceptance criteria and a completion evidence link.
- Update release status after staging and production checks. Keep the actual URLs and commit in the GitHub release record.
- Keep vendor items open until the answer is reflected in the operating workflow and site, even when an email has arrived.
- A waiver, deferral, failed check or unknown result is recorded as such. None is a passing validation.
