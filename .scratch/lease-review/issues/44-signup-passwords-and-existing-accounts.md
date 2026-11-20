# 44. Fix password entry and the existing-account signup dead end

Status: implemented — production completion is recorded in the published v0.4.5 release
Stage: Current patch
Target: v0.4.5
Owner request: November 19, 2026. Account creation appeared to fail for two addresses; no new signup code arrived. Add password confirmation and a way to show each password.

## Diagnosis

Both reported addresses were already confirmed in production. Supabase can conceal duplicate signup behind an obfuscated successful response; it does not guarantee a new signup email for an existing confirmed account. The application then said a code had been sent and offered no direct password-reset path. Do not disclose whether an arbitrary address has an account.

A fresh production sign-in email was delivered to each reported address. Both links opened their account pages successfully, and both diagnostic sessions were signed out. Private addresses, user IDs, codes, links and credentials are excluded from this ticket. These checks prove email-link login worked for both checked accounts, not that every mailbox receives mail.

## Acceptance criteria

- Signup requires Password and Confirm password. Reject a missing or mismatched confirmation on the server before calling Supabase.
- Signup, sign-in and password reset offer separate accessible Show/Hide controls. Start hidden, preserve entered values, support keyboard use, and never submit when toggled. Sign-in keeps one password field; reset keeps two.
- The post-signup and resend screens describe confirmation conditionally and provide Sign in and Reset password links for anyone who may already have an account. Preserve the safe return path. Do not promise another code or expose account existence.
- Keep consent, email verification, resend, rate limits, recovery authorization and existing account data intact. Do not change passwords or email templates as part of this fix.
- Verify the regressions locally, inspect the exact staging Preview, review the PR, merge through required checks, and verify the production forms. No new spend or live inference.

## Evidence

Before the fix, two server confirmation regressions and the duplicate-signup navigation regression failed. Four password-control tests also failed before the UI change. After the fix, the authentication suite passed 29 tests. Lint, route type generation, typecheck, all 671 tests, the production build and both deterministic role smokes passed locally. The release and deployment evidence belong in the [release record](../../../docs/handoff/v0.4.5-release.md) and published release.

At implementation head `33451b8`, staging password controls and the generic resend screen passed; the latter preserved a synthetic review return path on both Sign in and Reset password links. Separate Standards and Spec reviews found no issues. [PR #38](https://github.com/ThisisMendez/blueline/pull/38) records the final head, required checks and release gates.
