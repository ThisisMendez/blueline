# 38. Keep the pilot to Rhode Island residential rentals

Status: ready-for-agent
Stage: Now · Rhode Island pilot
Decision: approved for planning November 18, 2026. Begin implementation only when authorized.

The public Resources page already carries selected statewide references. Ask where the rental property is located before file selection. People moving to Rhode Island can take part. The user’s selection is required and checked by the server before analysis; there is no invitation requirement.

## Acceptance criteria

- Users are told this is a Rhode Island residential lease pilot before starting a review. Rhode Island is the only supported state. An out-of-scope option explains the limited pilot before document selection or processing. It does not imply a date for future availability.
- Starting a review without the required state, for another state, or by opening a direct review link cannot send document text for analysis. Test both renter and landlord paths. The user can still reach help, the public Resources page and existing saved reports.
- Label reference material as selected Rhode Island statewide sources. Providence and other municipalities are explicitly outside scope and identified as future coverage. Other U.S. states and the Dominican Republic are separate future stages, not selectable pilot locations.
- Lease flags, drafting tools and the score continue to explain the document, separately from the official sources. The workflow collects no address, proof of residence or IP-based location for this purpose.
- Verify keyboard and mobile navigation, back and refresh behavior, the unsupported state message, and a server-side rejection with synthetic fixtures. Do not add a production model call or new spend to prove the gate.

See the [operating backlog](../../../BACKLOG.md), [source maintenance process](../../../docs/legal/rhode-island-pilot.md) and [Dominican Republic discovery](../../../docs/product/dominican-republic-discovery.md).
