# 43. Let the Rhode Island source bot handle routine monitoring

Status: ready-for-agent
Stage: Now · Rhode Island pilot operations
Target: v0.5.0 pilot hardening, with priority before the December 16, 2026 UTC review deadline
Decision: keep the owner out of routine weekly checks. This ticket does not deploy any workflow changes.

The weekly GitHub Action already compares official sources and files a failure issue. It does not warn before expiry or resolve an open alert when sources recover. Reference pages already withhold changed or expired sources. Improve the existing free workflow rather than add another service or a second schedule.

## Acceptance criteria

- The scheduled action warns at least 14 days before a source-review deadline, or reports immediately if it starts within that window. It shows the expiry, official source link and workflow run.
- Reuse an open alert for the same source or shared failure. Distinguish a fetch outage from changed official text, an approaching expiry, a missing annual index, and an effective-date change. Include the last verified date and which references the site will withhold.
- Resolve a transient outage alert when the original reviewed source returns and there is no remaining change, expiry warning or shared failure. A recovered fetch must not approve an amendment or silently extend a review date.
- Before the current review expires, the bot prepares a renewal candidate for a maintainer when the allowable official content matches the reviewed sources and all shared checks pass. It records the source comparison and annual index status. Changed text or uncertain applicability goes to a maintainer with a diff and effective dates; it stays hidden until reviewed. The owner does not have to run the check.
- Verify warning windows, deduplication, recovery, changed source, year rollover and expired review behavior with fixtures before activating it. Reuse the existing public GitHub workflow and budget. Do not auto-publish legal text or renew the production baseline without approval.

See the [existing workflow](../../../.github/workflows/rhode-island-source-check.yml) and [source process](../../../docs/legal/rhode-island-pilot.md).
