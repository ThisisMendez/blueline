# Parked questions

## LeaseGuard-equivalent features: decided 2026-11-12

Recorded from the owner's answers. Details are in `research/competitors/leaseguard-ai/05-implementation-blueprint.md`.

- **G1, Health Score A–F.** **Build it.** A deterministic risk grade from verified flags, labelled "Low risk" to "High risk", never "safe to sign" or "good/bad lease". Record in a new ADR when built.
- **G2, state legal references.** **A checked list, sequenced last.** A separate section showing statute titles and official links from a list checked by hand. No AI-written law. A narrow Layer 2 ADR supersedes the relevant part of ADR 0014.
- **G3, junk fees.** **A fee list** with each fee's cited sentence and no judgments. A fee becomes a flag only under existing flag rules.
- **G4, multi-property dashboard.** **Homes for a single signer** in the library. No landlord features.
- **G5, co-tenant sharing.** **Defer live sharing.** Co-signers get the printable report (feature 8) for now.
- **G6, Deposit Shield.** **Deferred.**

## Still open

- **Uncommitted changes on `fix-critical-findings`:** the sign-in open-redirect fix, and the dependency upgrades with the `pdf.ts` change. Commit them as two commits, and test a real PDF upload before committing the upgrades?
- **Optional dependencies.** None are planned. `@react-pdf/renderer`, `diff` or an email provider would need approval.
