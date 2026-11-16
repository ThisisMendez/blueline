# Compliance log

This file records non-sensitive dated checks. Track actual customer cases, signed contracts, messages, account identifiers and incident evidence in a private log.

| Date | Check | Evidence or follow-up |
| --- | --- | --- |
| 2026-11-15 | Production review purge scheduled | Dashboard showed the active job and a successful latest run. Use a synthetic case to prove primary and related review rows are removed. |
| 2026-11-16 | Initial policy and consent draft | V1 public text and signup server checks prepared. Confirm final publication date, live routes and account consent metadata using a synthetic account. |
| 2026-11-16 | Provider assessment | Production Supabase primary region and Fireworks route verified. Check Vercel Function Regions, provider retention, email delivery and any DPA signatures separately. |
| 2026-11-16 | Contact delivery | Formspree support recipient verified. Synthetic contact and feedback were delivered with the expected subject and Reply-To. After enabling the contact gate and redeploying, a live synthetic submission was received in the support inbox. No private message contents or mailbox identifiers are retained here. |
| 2026-11-16 | Production route smoke | Homepage, renter and landlord review samples, `/review`, sign-in, Terms and Privacy returned HTTP 200. Unauthenticated `/account` redirected to sign-in. Legacy host redirects preserved path and query. The review samples used offline synthetic fixtures; no paid model call was made. |
| Pending | Signup email | Confirm branded signup and password-reset delivery, Inbox versus Spam, landing host, sign-in and `/account` using synthetic accounts before enabling the production signup gate. |
| Pending | Privacy deletion rehearsal | No hosted rehearsal was attempted: Lane C lacked a Supabase admin credential. Run only with a synthetic account after secure local credential handoff; verify hard deletion of the expected primary rows. |
| Pending | Vendor agreement evidence | Record current-plan applicability and any confirmed acceptance for each vendor in restricted evidence storage. Vercel DPA remains unresolved on Hobby; no unverified acceptance is represented as complete. |
| 2026-11-16 | Rhode Island source review | Codex automated comparison recorded eleven source fingerprints and a 30-day expiry. Seven focused tests passed; hosted `npm run legal:check-ri` passed all eleven sources. The protected release preview served all seven source links and dates with scope and disclaimer copy. The workstation could not reach the state host. Production enablement and live route check remain with the coordinator. No human reviewed the sources. [Hosted source check](https://github.com/ThisisMendez/blueline/actions/runs/43962580939) |
| Pending | Counsel review | See [Counsel packet](counsel-packet.md). |

For each private request or incident store only an identifier, dates, verified scope, actions, outcome, exceptions, and an evidence reference. Do not copy lease text or credentials into the log. Recheck after vendor or policy changes and review the operational log monthly.
