# Lane D — docs and release preparation

Worktree created from `origin/main` at `468615c`, branch `release/v0.4.1-lane-d`. No homepage UI, production settings, browser session, credentials or dependencies were changed. `npm ci` installed the existing lockfile only.

## Draft updates

- Trimmed [HUMAN-STEPS.md](../../HUMAN-STEPS.md) to the remaining owner actions: configure and test Supabase SMTP/signup, configure Gmail send-as, provide a secure existing admin-key handoff for the synthetic deletion rehearsal, and record confirmed vendor agreement evidence. Rhode Island source review and protected-preview verification are complete; production activation and live check belong to the coordinator.
- Updated the access matrix, compliance log, vendor agreement register and v0.4.1 audit section with completed/pending evidence and gate rollback steps. The v0.4.0 recovery paragraph now points to a retained baseline DNS table in the audit so trimming HUMAN-STEPS does not remove rollback evidence.
- Added Lane B's source register and documented its automated review, eleven fingerprints, 30-day expiry, hosted check and preview proof. Explicitly state no human reviewed the sources, and exclude Providence and § 34-18-20.
- Replaced the two stale former product-name references in ADR 0014 and ADR 0015 with the current product name.

## Verification

| Check | Result |
| --- | --- |
| `npm test` | Pass: 653 tests in 60 files. |
| `npm run lint` | Pass. |
| `npm run build` | Pass. |
| `npm run typecheck` | Pass after the production build generated the clean worktree's Next.js route types. A first clean-worktree run before build reported missing generated `PageProps`/`LayoutProps`; rerun passed. |
| Local `npm run legal:check-ri` | Could not fetch the Rhode Island host for all eleven sources. The authoritative hosted run passed all eleven, and the protected preview verified seven links, dates, scope and disclaimer copy. Production activation and route check remain coordinator-owned. |

No live vendor DPA acceptance, SMTP signup test, authenticated account smoke or production privacy deletion rehearsal is claimed here. The Supabase deletion rehearsal was not attempted because no admin credential was available; no production data was read or changed by Lane D.
