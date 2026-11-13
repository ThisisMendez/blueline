# Version control and releases

Blueline is in beta. Version 0.1.0 shipped from `main` at commit `66bd8d7` through [PR #8](https://github.com/ThisisMendez/blueline/pull/8). Version 0.2.0 shipped at `32db23c`. Version 0.3.0 adds interactive sample reports, a simpler phone menu, more landlord recommendations, and support for signup codes. GitHub releases record the deployed commits and activation status.

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

The [production site](https://blueline-khaki-eta.vercel.app/) and [GitHub releases](https://github.com/ThisisMendez/blueline/releases) show what users can access and when each version shipped.
