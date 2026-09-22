# 07: Per-flag counter-offers

**What to build:** Each risk flag comes with a plausible counter-offer — a proposed edit aimed at a compromise a landlord could realistically accept, not a maximum-demand draft. The signer reads the flag's explanation first; the proposed edit is revealed only after that, and any risk that would remain if the edit were accepted stays visible rather than implying the compromise is full protection.

**Blocked by:** 01 (a counter-offer is drafted against a risk flag that must already have severity and an explanation)

**Status:** implemented and verified offline; live quality concerns require independent review

- [x] Every risk flag has an associated counter-offer
- [x] The counter-offer text is hidden until the signer has opened the flag's explanation
- [x] Each counter-offer states any residual risk that would remain if it were accepted
- [ ] Counter-offers read as plausible compromises, not maximal demands
- [x] Deterministic test: opening a flag's explanation reveals its counter-offer and residual-risk statement; the counter-offer is not visible before that

Evidence: required nonempty schema fields through verification/storage, explicit legacy-rerun error, keyboard full-flow disclosure test across all planted flags. Final typecheck, lint, 212 tests, offline smoke, fixture production build and normal production build pass. Migration0004 not applied remotely.

One bounded live smoke returned 9 flags with 9 verified citations and 0 dropped flags. Drafts were concrete compromises, but one arbitration draft replaces the cited clause without its express jury/class-waiver wording while its residual-risk statement still says those proceedings are barred. This is a draft/residual consistency concern, not a legal conclusion; the plausibility criterion remains unchecked pending independent review. No prompt/model/provider or expected-answer changes were made to tune away this observation. See BUILD-REPORT.md and ticket09.
