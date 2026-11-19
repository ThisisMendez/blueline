# Version control and releases

Blueline Lease is in beta. Version 0.1.0 shipped from `main` at commit `66bd8d7` through [PR #8](https://github.com/ThisisMendez/blueline/pull/8). Version 0.2.0 shipped at `32db23c`. Version 0.3.0 added interactive sample reports and support for signup codes. Version 0.4.0 moves to the owned domain and adds versioned policies and signup agreement. GitHub releases record the deployed commits and activation status.

## Version numbers

Use `major.minor.patch`. During beta, keep the major number at zero. Add one to the minor number for a feature release and reset the patch to zero. Use a patch for fixes to the current release. The first stable release will be 1.0.0 when the owner chooses to end beta.

| Change | Example |
| --- | --- |
| Fix a bug in the current beta | 0.2.0 → 0.2.1 |
| Release another batch of beta features | 0.2.1 → 0.3.0 |
| Move from beta to stable | 0.3.0 → 1.0.0 |

## Branches, commits, and production

- `main` is the source branch for the production Vercel site. A working branch holds changes until they are merged. Use the owner's current working branch when one is designated.
- A commit identifies the exact code. The app version in `package.json` and `package-lock.json` gives the release a readable name. An annotated Git tag such as `v0.2.0` points to the verified production commit. The GitHub release describes what shipped and links to the public site.
- Start each task from current `origin/main` on a fresh feature branch. Run local lint, route type generation, typecheck, tests, build and the renter and landlord offline smokes. Push the feature branch and open a pull request into `main`. Review its changes, passing `Quality checks` result and the exact Preview commit before merging. Obtain the owner's approval before a deployment or production release when that restriction is active. After an approved merge, watch Vercel Production and check the public routes before publishing the tag and release. Update local `main` before starting another task.
- If production verification fails, restore the last working Vercel deployment and reconcile `main` with a revert. Keep published tags pointing at their original commits. Version a subsequent fix separately.

[GitHub releases](https://github.com/ThisisMendez/blueline/releases) record when each version shipped.

## Local and Preview isolation

- Keep production credentials in Vercel Production. Local `.env.local` and Preview use the separate `redline` Supabase project (`dwjhkcgzrlbobdpzpley`). The application rejects the production database in local and Preview builds and before server account connections. Keep local `VERCEL_ENV` unset.
- Set the public Supabase URL and publishable key for all Preview branches. Check branch-specific overrides before reusing an older branch. Use `VERCEL_URL` as the Preview auth origin and allow only this project's Preview callback hosts in staging Supabase. Use `http://localhost:3000` locally. Keep production Auth settings separate.
- Offline tests and browser fixtures require no live model credentials. Keep model and Contact credentials out of ordinary local testing and Preview. Authorize live inference separately with synthetic data and a budget. Fixture builds disable accounts, so staging account and database tests require a normal staging-configured build.
- The owner approved staging Preview verification and production release on November 19, 2026. The temporary setup-branch deployment exception has been removed. Check each Preview deployment’s actual SHA and staging environment bindings before testing it; a passing local check does not replace hosted staging verification.
- `PR checks` runs on pull requests into `main` and on pushes to `main`, with read-only repository permissions and no live service credentials. Its required status is `Quality checks`. The source-monitoring workflow remains separate.

## Production domain

The [original production address](https://blueline-khaki-eta.vercel.app/) stays active during the move to [bluelinelease.com](https://bluelinelease.com/).

1. Attach `bluelinelease.com` and `www.bluelinelease.com` to the Production deployment. Apply the DNS records Vercel shows for the project. Confirm each host resolves publicly and serves the production site over HTTPS with a valid certificate.
2. Add the apex URL and its `/auth/confirm` and `/auth/callback` URLs to production Supabase Auth URL Configuration. Keep the original auth URLs during the cutover. Check Google and auth email configuration for any callback URLs that need changing.
3. Set `NEXT_PUBLIC_SITE_URL=https://bluelinelease.com` for Vercel Production and redeploy. This switches the canonical metadata, robots and sitemap to the apex and turns on the app’s 301 for page requests from the two old addresses.
4. Check the apex homepage and a deep link on each old host. Confirm the 301 points to the apex with the same path and query. Check both sample reports. Verify contact delivery and account email before enabling the features. Google sign-in is disabled.
5. If verification fails, remove the apex value from the production environment and redeploy or restore the last working production deployment. Browsers can remember a 301, so keep the apex working while fixing any issue.

See [ADR 0018](adr/0018-use-blueline-lease-and-canonical-domain.md) for redirect scope.
