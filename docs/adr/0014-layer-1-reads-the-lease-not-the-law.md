# 0014. Layer 1 reads the lease, not the law

Blueline Redline reports what the supplied lease says and what could follow from it. It does not check terms against the law where the signer lives, decide whether a term is enforceable, or say a lease is safe to sign. Checking a lease against local law ("jurisdiction intelligence", Layer 2) is a possible later capability with its own sources, validation and review, and is not built or offered now.

The boundary is enforced in behaviour as well as copy. The landing page, the review page, the results and each proposed edit say the review is not checked against local law; the prompts forbid legal conclusions; a deterministic check looks for them in generated text; and questions that need local law are answered from the lease with a fixed note that the law was not checked.

Decisions taken with this ADR (owner, 2026-11-11, Option B):

- Packets that are not residential leases are blocked, not reviewed.
- A packet whose completeness can't be verified is never presented as a complete review.
- Ordinary payments don't produce risk flags on their own.
- A generated explanation that states a legal conclusion is repaired from the lease text and rechecked; if repair fails, the output is withheld and the review says so. A possibly serious risk is never dropped silently.
- No analytics now; a five-person comprehension test checks whether people understand the boundary.

The cost is that a signer who wants to know whether a term is allowed where they live gets the lease's wording and a pointer elsewhere, not an answer.
