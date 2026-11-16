# Parked questions

## LeaseGuard-equivalent features: decided 2026-11-12

Recorded from the owner's answers. Details are in `research/competitors/leaseguard-ai/05-implementation-blueprint.md`.

- **G1, Health Score A–F.** **Build it.** A deterministic risk grade from verified flags, labelled "Low risk" to "High risk", never "safe to sign" or "good/bad lease". Record in a new ADR when built.
- **G2, state legal references.** **A checked list, sequenced last.** A separate section showing statute titles and official links from a list checked by hand. No AI-written law. A narrow Layer 2 ADR supersedes the relevant part of ADR 0014.
- **G3, junk fees.** **A fee list** with each fee's cited sentence and no judgments. A fee becomes a flag only under existing flag rules.
- **G4, multi-property dashboard.** **Homes for a single signer** in the library. No property-manager portfolio tooling. Landlords are still supported as a review role (updated 2026-11-13, [ADR 0015](docs/adr/0015-renter-first-with-landlord-reviews.md)).
- **G5, co-tenant sharing.** **Defer live sharing.** Co-signers get the printable report (feature 8) for now.
- **G6, Deposit Shield.** **Deferred.**

## v0.4.0 launch decisions, November 16, 2026

- The product and company name is Blueline Lease. Alexis Mendez operates the beta as an individual in Rhode Island. The first homepage and Terms mention uses ™, and the footer carries the 2026 copyright notice. Public support is `support@bluelinelease.com`. The direct address `alexismendez@bluelinelease.com` is reserved for owner correspondence.
- `https://bluelinelease.com` becomes canonical after DNS and TLS pass. The `www` and legacy production host redirect to the apex with HTTP 301. Keep existing Supabase and GitHub identifiers.
- Cloudflare Email Routing handles inbound aliases and catch-all. Resend Free is the selected SMTP provider for branded auth and Gmail send-as. Formspree sends to the verified support address. Keep features off until their delivery checks pass.
- Keep the configured GLM 5.3 Flash production model and the existing spending cap. The two-judge baseline is internal regression evidence only. Use the higher severity for a still-unsettled disagreement unless the text fails the guide. Record the reasons in the [development evaluation](docs/handoff/v0.4.0-development-evaluation.md).
- Terms and Privacy v1 are self-drafted and have not been reviewed by counsel. The free beta is 18+, with express account signup acceptance and no arbitration or class waiver. Support handles verified privacy requests. See the [legal index](docs/legal/README.md).
- Rhode Island's pilot is a separate statewide list of seven official links. Providence, local rules, and § 34-18-20 are excluded. The pilot must pass hosted source checks before going public.

## Still open

- **Launch follow-ups.** [Human steps](HUMAN-STEPS.md) covers SMTP, verified Contact, provider terms, and the pilot. [Counsel packet](docs/legal/counsel-packet.md) lists legal questions for a possible free review.
- **Self-service deletion.** The owner chose manual deletion through Contact first. Decide separately whether to ticket an in-app option for deleting a review or account.
- **Manual checks after the 2026-11-13 release:** a real selectable-text PDF upload (pdfjs-dist 6), and a real password-reset email, on production.
- **Optional dependencies.** None are planned. `@react-pdf/renderer`, `diff` or an email provider would need approval.
