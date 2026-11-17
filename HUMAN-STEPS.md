# Remaining Blueline Lease launch steps

Updated November 16, 2026. Production contact and signup are enabled. Both Gmail send-as aliases passed live delivery tests. The production site is the existing free-plan project.

## Release checks still pending

1. **Privacy deletion rehearsal.** The hosted rehearsal is pending because Lane C had no Supabase admin credential and made no production write. In Supabase → production `blueline` → **Project Settings → API Keys**, provide the existing server-side key through a private, temporary local credential file outside the repository; share only its path with the operator. Run the [deletion procedure](docs/legal/privacy-deletion-procedure.md) on a synthetic account, remove the private file, and record the synthetic request ID and outcome in the compliance log.
2. **Resolve the remaining vendor agreement gaps.** In Formspree → **Help → Contact support**, request the Free-plan DPA/SCC revision and the deletion process for submissions older than 30 days. In OpenRouter → **Settings → Privacy**, review the current workspace settings. Ask OpenRouter support to confirm the applicable Terms/DPA revision and Fireworks model-provider terms for the deployed route. Save account evidence privately and update the [vendor register](docs/legal/vendor-dpas.md).

## Later, optional

- Review the [counsel packet](docs/legal/counsel-packet.md) with a free law clinic if eligible.
- Consider LLC/DBA and trademark filings separately; they may cost money.
