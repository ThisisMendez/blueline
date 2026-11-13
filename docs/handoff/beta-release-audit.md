# Beta refresh release audit

Baseline on November 13, 2026. GitHub `main` was `8be303a` (PR #7, compact homepage) and the checked-out `feat/homepage-refresh` branch was `4ebdab0`. The worktree was clean. The existing Vercel deployment of the candidate was built successfully and is protected by Vercel login. The production hostname served HTTP 200.

## Reconciliation

| Handoff item | Classification and evidence |
| --- | --- |
| Homepage and navigation | Completed and verified. The preview routes and desktop/mobile QA cover the compact homepage and entry buttons. The homepage itself is already on main. |
| Role choice, multi-PDF intake and file errors | Completed and verified. The role and packet are exercised in browser fixtures and automated tests. Two attachment races were reproduced and fixed in this audit. |
| Processing and duplicate submission protection | Completed and verified in session tests and browser fixtures. The tab holds the packet in memory and a second start reuses the current request. |
| Automatic titles | Completed and verified. Title detection, filename fallback and saved display names have test coverage. Filename cleanup is best effort. Titles can still contain user-provided text. |
| Lease Risk Score and role reports | Implemented and verified against fixture and score tests. The production decision on the specific `lrs-1` grade bands is open. |
| Severity and fee filters | Completed and verified on cited flags. The fee filter does not inventory all charges in a lease. |
| How It Works, Features, Pricing, Contact and Resources | Completed and verified as pages. Sending through Contact requires an approved address and response commitment. |
| Saved-review renaming | Implemented. The app and data adapter tests pass. See the database status below for hosted verification. |
| Terms and Privacy | Completed as preview drafts. Production routes and links are gated. Publication and final text still require approval. |
| Supabase 0007 | The staging migration history records it. Production already has the role and finding columns despite its migration-history list stopping at 0006. Confirm the live RPC and history before any future reconciliation. |
| Supabase 0008 | At discovery production had no `display_title` column and staging did not record 0008. The exact migration and rollback passed on disposable PostgreSQL. We then dry-ran it in hosted staging, applied and recorded it there, and repeated two-user SQL checks for legacy reviews, new reviews, renaming, and ownership. Synthetic records were rolled back. Production is still pending. [Staging migration registry](https://supabase.com/dashboard/project/dwjhkcgzrlbobdpzpley/database/migrations). |
| Preview database, real sign-in and library | Vercel variables were scoped to Production at discovery. The public staging URL and anon key are now set only for the `feat/homepage-refresh` preview. The preview retains Vercel access protection and no model key was added. Signed-in browser verification remains pending. |
| Live model and landlord quality | No qualifying $0 structured-output endpoint in the current zero-data-retention catalog. The configured Fireworks route is paid. Synthetic fixtures establish application behavior. |
| Independent accuracy | The existing five-packet holdout is awaiting two blind reviews, adjudication and an owner-confirmed lock. The runner also needs a paired-role path for that evaluation. |
| AI retention | OpenRouter's public catalog lists the configured Fireworks endpoint as eligible for zero data retention. Production account logging and exact effective routing remain unconfirmed. The request pins the provider but does not send a zero-retention override. Keep retention claims off the site. [OpenRouter retention policy](https://openrouter.ai/docs/guides/features/zdr) · [Fireworks privacy notice](https://fireworks.ai/privacy-policy). |
| PDF page references | Partially implemented. PDF extraction has page text before joining, and citations have text offsets. The review and storage contracts lack the mapping. Implement and test an additive representation before displaying page numbers. |
| References in saved reviews | The stored attachments are now listed by name. The anonymous reference-to-attachment match ledger still needs persisted matches and backward compatibility. |
| Support email and response time | Awaiting the owner's approved public details. Contact remains disabled. |

## Decisions and backlog

- Keep `lrs-1` as implemented. One High is D and two or more High are F, with a floor for each band. The earlier starting proposal capped a single High at C and could put several Medium flags into D. See [ADR 0016](../adr/0016-lease-risk-score.md) and [scoring](../scoring.md).
- Adopt a three-item shortlist of verified High and Medium findings with usable proposed wording. For renters, provide editable messages to copy. For landlords, provide editable proposed clarifications. Keep drafts in the report tab. The original counter-offers remain available on individual findings. The broader draft workflow and separate obligation or contradiction reports are deferred. See [competitor audit and rankings](../../research/competitors/beta-release-opportunities.md).
- Preserve the document-only review boundary from [ADR 0014](../adr/0014-layer-1-reads-the-lease-not-the-law.md). The compact release does not add jurisdiction-aware legal analysis, billing, or new model calls.
- Next evidence needed is a real hosted sign-in and saved-review exercise using two staging accounts, a qualifying live model run for both roles, independent holdout labels, and owner acceptance of the score bands. PDF page numbers and persisted reference matches follow as scoped work. Consider explicit service request limits and an overall model deadline after measuring real hosted use.

## Verification and release status

- Candidate `5ec50b0` passed lint, type checking, the production build, and 607 tests in 53 files. Both role smoke runs passed with synthetic model fixtures. In a production-mode build, all new public pages opened and the Terms and Privacy drafts returned 404.
- Independent QA passed with limitations. Browser checks opened PDFs, verified exact excerpts, edited and copied both roles' drafts, and showed no additional model requests. The saved report tests verified owner access and a different signer's 404. The fixture runs did not exercise hosted sign-in or a live model.
- The independent evaluator recorded zero runs because the held-out labels and owner-confirmed lock are missing. The public catalog query found no endpoints with both $0 pricing and structured output in the zero-data-retention list. No paid calls were made.
- Production remains on `8be303a`. The candidate is available in [PR #8](https://github.com/ThisisMendez/blueline/pull/8) and its [protected Vercel preview](https://blueline-git-feat-homepage-refresh-mendez-c4.vercel.app/). Hold the production merge and migration until the hosted sign-in and library check, provider and live-model evidence, and score decision are resolved.

## Recovery

For a failed application deployment, restore the last verified production deployment from the Vercel production deployment history and revert the merge in GitHub. The tested 0008 migration is additive and the older application can still create and read reviews after it. Keep the title column during an application rollback so users' edits survive. Treat any separate schema rollback as its own reviewed migration and preserve titles first.

## Version 0.2.0

Direct production release through `main`, with local verification. Migration 0008 was applied during the 0.1.0 release. The 0.2.0 changes require no database migration.

Independent local browser checks exercised both roles, including loading, retry, mobile navigation, score details, selected renter drafts, landlord wording, cancelled and successful sign-in, and explicit saving. Contact and feedback were tested against a simulated Formspree endpoint. No paid model calls were made.

Leave `REVIEW_CONTINUATION_SECRET` unset until production signup email and sign-in are verified. Leave `FORMSPREE_FORM_ID` unset until a test message reaches the approved inbox. See [version control and releases](../version-control.md) and [contact setup](../../research/contact-delivery-options.md).

## Version 0.3.0

The production Supabase project has the correct default Site URL. Its additional redirect list contains the local development origin. An earlier delivered confirmation from the project pointed to localhost. Its origin was not established. The production app now excludes localhost from its callback origins. The hosted signup template uses the default confirmation link, and the dashboard requires custom SMTP before editing the template. Verify public delivery and both confirmation methods after configuring a sender and installing the code template.

Formspree requires verification of the destination account email before activation. Complete an inbox test with the fixed notification subject and a synthetic contact submission before setting `FORMSPREE_FORM_ID`.

The updated Terms, Privacy, and [Rhode Island reference pilot](../legal/rhode-island-pilot.md) are drafts for review. The weekly source check is separate from the lease-report score and from release deployment.

The evaluation agent used GPT-6.1 Sol and Claude Opus 5.5 in separate sessions with the same synthetic documents and rubric under existing plan allowances. Both labeled all eight case and role pairs. All 90 quotes in their labels matched the source. The fixture-backed app comparison verified 27 of 27 citations, found all seven settled High concerns with one graded Medium, and blocked the missing addendum for both roles. Six adjudicated items remained uncertain. These results measure the synthetic exercise. The production inference route and real-lease holdout remain unmeasured.
