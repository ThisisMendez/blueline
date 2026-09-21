# 07: Per-flag counter-offers

**What to build:** Each risk flag comes with a plausible counter-offer — a proposed edit aimed at a compromise a landlord could realistically accept, not a maximum-demand draft. The signer reads the flag's explanation first; the proposed edit is revealed only after that, and any risk that would remain if the edit were accepted stays visible rather than implying the compromise is full protection.

**Blocked by:** 01 (a counter-offer is drafted against a risk flag that must already have severity and an explanation)

**Status:** ready-for-agent

- [ ] Every risk flag has an associated counter-offer
- [ ] The counter-offer text is hidden until the signer has opened the flag's explanation
- [ ] Each counter-offer states any residual risk that would remain if it were accepted
- [ ] Counter-offers read as plausible compromises, not maximal demands
- [ ] Deterministic test: opening a flag's explanation reveals its counter-offer and residual-risk statement; the counter-offer is not visible before that
