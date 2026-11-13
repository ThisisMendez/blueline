# 0015. Renter first, with landlord reviews

Blueline Redline is a contract review app for residential leases. Before each review the user chooses whose side they are on, renter or landlord, and the report highlights the clauses that could harm that side, each with its exact source sentence.

Renters remain the primary audience. The user research, the initial flag priorities (deposit forfeiture, early-exit costs, waivers of dispute rights), the default examples and the order of the role choice all start from the renter. Landlords are supported as a review role, not as a separate product: the same complete packet, the same verified citations and the same contract facts, with severity and next steps assessed for the landlord's own exposure.

A landlord reviewing a residential lease is a lease signer, so this does not count as expansion under ADR 0012. Property-manager portfolios, other contract types and help after a dispute remain outside the first version and still need independent trust evidence first.

This supersedes the "renters only" sentence of ADR 0002 and the "no landlord features" wording recorded for gate G4 on 2026-11-12. G4 still decides the dashboard: homes for one signer, no portfolio tooling. The cost is a second role to evaluate: held-out evals must cover both roles before either is called reliable. [Product requirements](../../PRD.md), [ADR 0002](0002-focus-first-version-on-lease-signers.md), [ADR 0012](0012-require-independent-trust-evidence-before-expansion.md).
