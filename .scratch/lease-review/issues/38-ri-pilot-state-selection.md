# 38. Keep the pilot to Rhode Island residential rentals

Status: needs-triage
Stage: Now · Rhode Island pilot
Owner direction: approved November 18, 2026. Choose the access mechanism before implementation.

The public Resources page already carries selected statewide references. The review intake does not currently check which state the rental is in. Ask for the state before a user selects a lease file so Blueline can enforce the pilot scope. Recommend asking where the rental home is located, so an incoming renter can use the pilot without living in Rhode Island yet.

## Access choice

- **Recommended: user selects Rhode Island.** A required selection and a server-side eligibility check keep unsupported requests out of the review path. Self-declaration does not prove location but avoids asking for identity or address information.
- **Alternative: user selects Rhode Island and needs an invitation.** Keeps initial volume and feedback easier to manage. Adds approval work and more steps for renters and landlords. Still ask for the rental state.

## Acceptance criteria after the choice

- Users are told this is a Rhode Island residential lease pilot before starting a review. Rhode Island is the only supported state. An out-of-scope option explains the limited pilot before document selection or processing. It does not imply a date for future availability.
- Starting a review without the required state, for another state, or by opening a direct review link cannot send document text for analysis. Test both renter and landlord paths. The user can still reach help, the public Resources page and existing saved reports.
- Label reference material as selected Rhode Island statewide sources. Providence and other municipalities are explicitly outside scope and identified as future coverage. Other U.S. states and the Dominican Republic are separate future stages, not selectable pilot locations.
- Lease flags, drafting tools and the score continue to explain the document, separately from the official sources. The workflow collects no address, proof of residence or IP-based location for this purpose.
- Verify keyboard and mobile navigation, back and refresh behavior, the unsupported state message, and a server-side rejection with synthetic fixtures. Do not add a production model call or new spend to prove the gate.

See the [operating backlog](../../../BACKLOG.md), [source maintenance process](../../../docs/legal/rhode-island-pilot.md) and [Dominican Republic discovery](../../../docs/product/dominican-republic-discovery.md).
