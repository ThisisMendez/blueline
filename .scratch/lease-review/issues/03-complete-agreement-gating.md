# 03: Complete-agreement gating

**What to build:** A lease signer can supply the additional documents their lease references — fee schedules, rules, addenda — as part of one packet. Blueline checks completeness before running any review: if the lease references a document that is not present in the packet, review is blocked entirely and the missing document is named, rather than producing a partial summary or partial flag set. The signer can see when the packet is complete and analysis is proceeding, distinct from waiting on missing documents.

**Blocked by:** 01 (needs the review pipeline to gate in front of)

**Status:** done

- [x] Signer can submit multiple documents as one packet (lease plus referenced material)
- [x] Completeness is checked before general review runs
- [x] A referenced document that is missing from the packet blocks review entirely and names what's missing
- [x] The blocking result is not a partial summary and not a partial flag set
- [x] Signer can distinguish "waiting on missing documents" from "waiting on analysis" in the UI
- [x] Deterministic test: a complete packet proceeds to review; a packet missing a referenced document is blocked and names the gap; a packet with multiple referenced documents is accepted
