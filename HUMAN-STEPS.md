# Blueline Lease operating checklist

Updated November 18, 2026. Production contact and signup are enabled. Both Gmail send-as aliases passed live delivery tests. The production site uses the existing free hosting project. Product stages are in [BACKLOG.md](BACKLOG.md).

## Open vendor privacy follow-up

- [ ] **Formspree — agreement and deletion.** Formspree offered a data processing agreement (DPA) for signature and confirmed the Free plan's 30 days is a dashboard access limit, not deletion. Support suggested using a timestamp to identify a submission. On November 18, Blueline confirmed the owner's signing authority, asked for the secure link and terms that apply to Free (including any international-transfer clauses), and asked whether verified older submissions can be deleted on Free, with what identifiers, confirmation, and backup timeline. Still needed: the agreement for owner review and, if acceptable, signature; an actionable deletion procedure or a decision to change the contact workflow. Keep Free; no deletion requested in this thread.
- [ ] **OpenRouter and Fireworks — route coverage and data handling.** OpenRouter confirmed the published Terms and DPA cover the account's commercial use with no separate signature. It reported account-wide zero data retention enforcement was off. The deployed code pins Fireworks and disables fallbacks; that does not establish the effective retention or training policy. On November 18, Blueline asked support to escalate to its privacy team for the signed Fireworks agreement scope, route-specific retention and training, availability and behavior of request-level controls, and deletion and backup handling. Still needed: the written vendor answers and verification of the production workspace and route using existing metadata where possible. Do not send lease text, credentials, or paid test requests to close this item.
- [ ] **Site review and closeout — after the vendor answers.** Record outcomes in the [vendor register](docs/legal/vendor-dpas.md). Check the live Privacy Policy, Contact form, review upload disclosures, and [deletion procedure](docs/legal/privacy-deletion-procedure.md) against what the vendors actually support, including forwarded support copies. Reconcile conditional language for services that are already active. If a vendor cannot support the needed controls, decide whether to limit or replace the affected flow before promising them. Update anything affected, verify live, and record the result in the [compliance log](docs/legal/compliance-log.md). If no change is needed, record why. Keep both items open through this review and any required changes.

## Other vendor checks

- [ ] **Vercel Hobby.** Confirm whether this beta fits the plan's noncommercial use terms and how the production host handles lease text in transit and operational data. Vercel's published DPA excludes Hobby. If current use or data handling cannot be supported on that plan, decide on a compatible no-spend path or narrow the affected flow before expanding. No upgrade authorized.
- [ ] **Cloudflare.** Its public self-serve terms incorporate the DPA for covered personal data. Check the account terms and scope for the DNS and inbound email forwarding services actually used. Record what applies to both.
- [ ] **Consumer Gmail.** Google confirms it offers no DPA for consumer Gmail. The open item is the operating decision: keep this as a general support inbox with minimal information, retention and verified deletion of support copies, or choose a different workflow if review finds a processor agreement is necessary. Ask people to keep leases and identity details out of ordinary support email. Do not assume a branded From address changes the mailbox's terms.

## Later, optional

- Review the [counsel packet](docs/legal/counsel-packet.md) with a free law clinic if eligible.
- Consider LLC/DBA and trademark filings separately; they may cost money.
