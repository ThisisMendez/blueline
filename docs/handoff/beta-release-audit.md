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

## Version 0.4.0

Release prepared November 16, 2026. Blueline Lease has an HTTPS apex and two permanent page redirects. The site publishes Terms and Privacy v1 and records age and policy versions on new email signups when signup is available. The guest review start displays the policy links. No database migration or npm dependency was added.

- **Model.** Prior production OpenRouter logs show billed GLM 5.3 Flash calls through Fireworks and normal `stop` finish reasons in the visible sample. No cap or billing failures were identified in the inspected Vercel error view. Retention limits leave earlier and unsampled failures unverified. The release regression was skipped because the deployed key could not be matched to the local key and the provider token envelope could exceed the verified local cap. No inference was billed for this run. [Internal evaluation summary](v0.4.0-development-evaluation.md)
- **Domain.** Cloudflare hosts the DNS. Both apex and `www` served valid HTTPS before the setting changed. Vercel production uses `NEXT_PUBLIC_SITE_URL=https://bluelinelease.com`. Supabase uses the same Site URL, keeps both hosted origins in the allowlist, and omits localhost. Google sign-in is off. [Access matrix](v0.4.0-access.md)
- **Email.** Outside synthetic mail reached the support, direct, and catch-all routes. Formspree's support recipient verification message arrived. Formspree submissions and public signup stay unavailable until their switches are activated after testing. Supabase's default sender remains in place. No real user data was changed and hosted deletion rehearsal awaits a synthetic email account.
- **Rhode Island.** The page is held off. Source hiding tests pass, but direct live fetches timed out on this workstation, reviewed fingerprints are pending, and Vercel source reachability is unverified.
- **Preflight.** The combined branch passed 653 tests, lint, type check, and the production build. See the tagged release for post-deploy HTTP and browser checks. [Human steps](../../HUMAN-STEPS.md)

To roll back, restore the previous Vercel production deployment, revert the PR, and set the prior `NEXT_PUBLIC_SITE_URL` and Supabase Site URL if leaving the apex. Keep the apex reachable while clients may have cached the 301. Keep both hosted auth redirect origins during the transition. The baseline DNS evidence is preserved in the [v0.4.0 DNS baseline](#v040-dns-baseline) below. Web CNAMEs and inbound mail MX records are separate. To roll back outbound email, turn off the verified signup flag first, then restore Supabase's default mailer. Unset the verified Formspree flag before changing the contact destination. Do not discard existing account or consent records.

## Version 0.4.1

Release checks recorded November 16, 2026.

| Area | Status and evidence |
| --- | --- |
| Contact | **On.** Verified Formspree support recipient. Local synthetic contact and feedback requests returned HTTP 204; both notices were delivered with subject `[Blueline Lease] Website Contact` and Reply-To matching the synthetic submitter. After enabling `FORMSPREE_SUPPORT_VERIFIED=true` and redeploying the same v0.4.0 source, a live synthetic contact submission arrived in the support inbox with the expected subject. No private email or message content is recorded. |
| Signup and My Account | **Public signup off.** Resend verified the North Virginia sending domain. The browser tool requires fresh action-time approval to create each scoped key. Custom Supabase SMTP and branded templates are pending. Test confirmation and reset delivery with a synthetic user before setting `AUTH_EMAIL_DELIVERY_VERIFIED=true`. Then enable and redeploy; remove only the synthetic test user. Public sign-in returned HTTP 200 and unauthenticated `/account` redirected, but authenticated account access is unverified. |
| Inbound routing | **Configured and checked.** Existing Cloudflare forwarding and mailbox labels/filters remain in place. |
| Gmail send-as | **Not configured or tested.** Add a separate domain-scoped Resend Sending Access key and the two Gmail aliases. Keep **Treat as an alias** unchecked, choose same-address replies, and preserve the personal Gmail address as the default From. See [remaining owner steps](../../HUMAN-STEPS.md). |
| Rhode Island resources | **Source review and protected preview passed.** Lane B completed the automated comparison and recorded eleven exact fingerprints for seven section links and four shared checks, reviewed November 16 with expiry December 16 UTC. Seven focused tests passed; hosted `npm run legal:check-ri` passed all eleven sources. Protected preview f6279a2 returned HTTP 200 with all seven exact source links, last-reviewed dates, and required copy. The local source check could not reach the state host. Production activation requires `RHODE_ISLAND_RESOURCES_ENABLED=true`. The [v0.4.1 release record](https://github.com/ThisisMendez/blueline/releases/tag/v0.4.1) records the live check. No human reviewed the sources. Providence and § 34-18-20 remain excluded. |
| Privacy deletion | **Pending.** Computer Use denied native Terminal access during the credential handoff before any key was copied. The local mock runner passed hard deletion, failure cleanup and identity checks. Production execution requires a private handoff of the existing server-side key. [Deletion procedure](../legal/privacy-deletion-procedure.md) |
| Vendor agreements | **Supabase and Resend dashboard coverage confirmed.** Formspree Free coverage, older-submission deletion, and OpenRouter account acceptance evidence and Fireworks terms remain open. Vercel DPA remains unresolved on Hobby. [Vendor register](../legal/vendor-dpas.md) |
| Routes | **Passed with account-flow limitation.** Live homepage, renter and landlord synthetic review samples, `/review`, sign-in, `/terms` and `/privacy` returned HTTP 200. Unauthenticated `/account` returned 307 to `/sign-in?next=/account`; authenticated account access remains unverified until SMTP/signup is tested. Both legacy hosts returned 301 preserving path and query. Synthetic review samples used offline fixtures and did not incur model charges. |
| Checks | **Passed.** 653 tests across 60 files, lint, typecheck, production build, and the renter and landlord pipeline smokes with synthetic fixtures. Live model submissions would use billed inference and were skipped under the no-spend instruction. |

### Recovery for v0.4.1

- For application rollback, restore the prior Vercel production deployment and revert the release merge. Contact was enabled with `FORMSPREE_SUPPORT_VERIFIED=true`; unset that flag before changing the verified recipient or form configuration.
- Signup is gated by `AUTH_EMAIL_DELIVERY_VERIFIED=true`. If an enabled signup flow fails, unset the flag and redeploy before restoring Supabase's default mailer. Preserve account and consent records.
- Rhode Island resources are gated by `RHODE_ISLAND_RESOURCES_ENABLED=true`. If source or page checks fail after enablement, unset the flag and redeploy.
- Resend outbound DNS records are distinct from the web host CNAMEs and Cloudflare inbound MX. Preserve Cloudflare inbound forwarding while rolling back outbound email. Remove only the Resend DKIM TXT at `resend._domainkey` and the two Resend CNAMEs at `rsend` and `send` after checking current DNS dependencies; never replace the apex SPF or `_dmarc` with a second conflicting record.
- Prior domain rollback evidence remains in the DNS table below. Keep the apex reachable during any redirect transition and retain the hosted auth redirect origins.

### v0.4.0 DNS baseline

The following records were documented before outbound email setup. Use as historical baseline only; check current DNS before making changes.

| Type | Name | Value | TTL | Purpose |
| --- | --- | --- | --- | --- |
| CNAME | `@` | `2c999c955c014cdf.vercel-dns-017.com` | Auto | Vercel apex, DNS-only |
| CNAME | `www` | `2c999c955c014cdf.vercel-dns-017.com` | Auto | Vercel secondary host, DNS-only |
| MX | `@` | `route1.mx.cloudflare.net` (67), `route2.mx.cloudflare.net` (58), `route3.mx.cloudflare.net` (45) | Auto | Cloudflare inbound forwarding |
| TXT | `@` | `v=spf1 include:_spf.mx.cloudflare.net ~all` | Auto | Cloudflare root SPF |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:support@bluelinelease.com` | Auto | DMARC monitoring |


## Email setup follow-up

November 16, 2026, after the v0.4.2 deployment.

- Supabase custom SMTP and four branded templates were installed. A synthetic confirmation reached the inbox from `no-reply@bluelinelease.com`, opened the production verification page, and established access to `/account`.
- A synthetic password reset email reached the inbox and opened the production password form through the verified recovery callback. A separate Supabase Auth PKCE test consumed the delivered recovery link, changed the synthetic password, and signed in with the new password. The temporary message and verifier were removed. After both checks passed, `AUTH_EMAIL_DELIVERY_VERIFIED=true` was set for Vercel Production and the v0.4.2 source was redeployed. The live signup route returned HTTP 200 with the create-account form.
- Both Gmail aliases were verified with a separate domain-scoped Sending access key. Synthetic messages from `support@bluelinelease.com` and `alexismendez@bluelinelease.com` reached the inbox with the expected From headers. Gmail replies from the address that received the message.
- A fresh signup from the live form passed with the required age and policy checkbox selected. The branded confirmation reached Gmail Inbox, and the one-time code opened `/account` for the matching synthetic identity. Signing out protected `/account` again. A fresh password sign-in then reopened that same account, and the tester signed out. Both synthetic signup users were permanently deleted in the production Supabase Auth Users dashboard. Refreshed exact-email searches returned zero matches for both.
