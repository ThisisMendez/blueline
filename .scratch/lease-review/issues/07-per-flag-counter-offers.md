# 07: Per-flag counter-offers

**What to build:** Each risk flag comes with a plausible counter-offer — a proposed edit aimed at a compromise a landlord could realistically accept, not a maximum-demand draft. The signer reads the flag's explanation first; the proposed edit is revealed only after that, and any risk that would remain if the edit were accepted stays visible rather than implying the compromise is full protection.

**Blocked by:** 01 (a counter-offer is drafted against a risk flag that must already have severity and an explanation)

**Status:** implemented and verified offline; live compromise-quality check pending

- [x] Every risk flag has an associated counter-offer
- [x] The counter-offer text is hidden until the signer has opened the flag's explanation
- [x] Each counter-offer states any residual risk that would remain if it were accepted
- [ ] Counter-offers read as plausible compromises, not maximal demands
- [x] Deterministic test: opening a flag's explanation reveals its counter-offer and residual-risk statement; the counter-offer is not visible before that

Evidence: required nonempty schema fields through verification/storage, explicit legacy-rerun error, keyboard full-flow disclosure test across all planted flags. Typecheck, lint, 196 tests, offline smoke and fixture production build pass. Prompt requests plausible compromises and remaining risk; actual live draft quality still requires inspection and independent evaluation. Migration0004 not applied remotely.
