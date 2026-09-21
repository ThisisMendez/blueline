# 04: Published coverage checklist with not-found items

**What to build:** Alongside the general review, Blueline checks the complete agreement against a fixed, published checklist of expected lease protections — deposit deductions and return, early-exit costs, rent changes, repairs, access to the home, and dispute routes. A checklist topic the model cannot locate in the complete agreement surfaces as a distinct not-found item, never as a risk flag and never as a claim that the agreement is unlawful. Not-found items are their own result category, separate from risk flags and from preference matches.

**Blocked by:** 03 (a not-found item only means something once completeness is guaranteed — otherwise "not found" could just mean "not yet supplied")

**Status:** ready-for-agent

- [ ] The checklist topics (deposit deductions/return, early-exit costs, rent changes, repairs, access, dispute routes) are fixed and published, not generated per lease
- [ ] Each checklist topic is checked against the complete agreement
- [ ] An absent topic appears as a not-found item, in a category distinct from risk flags
- [ ] A not-found item never asserts the agreement is unlawful or invalid — only that the topic wasn't located
- [ ] Deterministic test: a packet with all checklist topics present shows no not-found items; a packet missing one or more topics shows them as not-found, not as risk flags
