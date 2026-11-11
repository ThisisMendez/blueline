# 14: Legal-boundary guardrails in behaviour, not just copy

**What to build:** Blueline's generated text never states a legal conclusion (ADR 0014), and Q&A handles questions that turn on local law by answering what the lease says and marking that the law wasn't checked.

**Blocked by:** 01, 05, 13

**Status:** built; checked live on the gold set and the public leases

- [x] Analysis prompt: never say what a law requires or allows, never name a statute or a jurisdiction's rule, never predict a court, never tell the signer to sign or not; "local law may affect this" is the one allowed mention
- [x] Deterministic check (`src/features/analysis/legal-claims.ts`) on the summary and every flag's consequence, triggering condition, counter-offer and risk that remains. A phrase the quoted lease sentence itself contains never counts
- [x] On a hit: one repair call that rewrites from the verified lease sentence, then a recheck. If it still states a legal conclusion, or the repair call fails, that text is replaced by a fixed notice. The flag, its quoted sentence and its severity always stay; a review never fails because of this
- [x] `legalClaims` (repaired, withheld) travels with each review and is printed by `npm run eval` and `npm run eval:leases`
- [x] Q&A returns `needsLocalLaw`; the model sets it, and a deterministic check on the question text sets it too. The panel shows a fixed note above the quoted sentences. Q&A still returns no prose
- [x] Unit tests: 11 legal-conclusion phrasings caught, 6 ordinary sentences left alone, the lease-quote exemption, repair, withhold, failed repair, withheld counter-offer; Q&A route and UI tests for the note
- [x] Live: legal-question set on the Maine model lease (`npx tsx evals/legal-questions.ts`), two runs: note on 10/10 legal questions, 0/3 ordinary; no prose; 5 to 6 of the 10 legal questions answered from the lease
- [x] Live: no gold-set recall regression (23/26 on 2026-11-11T19:11, within the 22–24 range); 0 legal-conclusion texts repaired or withheld on the five public leases

**Found and fixed on the way:** the first Q&A wording made the model refuse legal questions it could partly answer (2/10 answered before the change, 0/10 after). The instruction now says to answer the part the agreement covers. Before Phase 3, the same lease answered 0 of 3 ordinary questions; after, 3 of 3.

**Limits:** the patterns catch common phrasings, not every rephrasing; the prompt carries the rest. The live budget for evals and smoke is now 7 calls (the repair call is the seventh, used only on a hit).
