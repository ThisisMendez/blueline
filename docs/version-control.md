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
- Run local checks before merging. For a direct production release, merge the tested branch into `main`, watch the Vercel production deployment, and check the public routes before publishing the tag and release. GitHub may build a preview automatically when a branch is pushed.
- If production verification fails, restore the last working Vercel deployment and reconcile `main` with a revert. Keep published tags pointing at their original commits. Version a subsequent fix separately.

[GitHub releases](https://github.com/ThisisMendez/blueline/releases) record when each version shipped.

## Production domain

The [original production address](https://blueline-khaki-eta.vercel.app/) stays active during the move to [bluelinelease.com](https://bluelinelease.com/).

1. Attach `bluelinelease.com` and `www.bluelinelease.com` to the Production deployment. Apply the DNS records Vercel shows for the project. Confirm each host resolves publicly and serves the production site over HTTPS with a valid certificate.
2. Add the apex URL and its `/auth/confirm` and `/auth/callback` URLs to production Supabase Auth URL Configuration. Keep the original auth URLs during the cutover. Check Google and auth email configuration for any callback URLs that need changing.
3. Set `NEXT_PUBLIC_SITE_URL=https://bluelinelease.com` for Vercel Production and redeploy. This switches the canonical metadata, robots and sitemap to the apex and turns on the app’s 301 for page requests from the two old addresses.
4. Check the apex homepage and a deep link on each old host. Confirm the 301 points to the apex with the same path and query. Check both sample reports. Verify contact delivery and account email before enabling the features. Google sign-in is disabled.
5. If verification fails, remove the apex value from the production environment and redeploy or restore the last working production deployment. Browsers can remember a 301, so keep the apex working while fixing any issue.

See [ADR 0018](adr/0018-use-blueline-lease-and-canonical-domain.md) for redirect scope.
