# 16: Evaluation coverage and the public lease corpus

**What to build:** Measurements for the Option B behaviour that nothing measured, a reviewer rubric that judges six things separately, and a public residential lease corpus ready for two independent reviewers. Component-level, end-to-end, human-reviewed and launch-readiness evidence stay separate (`evals/lease-corpus/README.md`).

**Blocked by:** 11, 13, 14, 15

**Status:** built; corpus awaiting reviewers and owner decisions

- [x] Severity agreement against the gold set's bands, printed by `npm run eval` (critical and high = high, moderate = medium), with counts graded lower and higher
- [x] Legal-conclusion texts repaired and withheld, printed by `npm run eval` and `npm run eval:leases`
- [x] Scope: `npm run eval:gated` stops all nine non-lease gold-set documents; unit tests for out-of-scope and unclear packets
- [x] `npm run eval:legal`: ten jurisdiction questions and three ordinary ones through the real Q&A route
- [x] `npm run eval:leases`: every available public lease through the full route; reports false scope blocks
- [x] Reviewer guide v2 (`evals/reviewer-guide.md`): exact quotation, scope, consequence, materiality, severity and missing-information handling judged separately, each with clearly right, clearly wrong and borderline invented examples
- [x] Corpus intake: ten sources checked; five available (three PDF, one Word, one web page) and five unavailable, each documented with a proposed replacement that is not used without approval
- [x] Sources, extracted text and outputs kept local and gitignored (the repository is public); SHA-256 of each recorded
- [x] One annotation record per document: jurisdiction, housing context, program restrictions, template status, completeness, usage-rights notes, proposed split, exposure to prompt work, two empty review slots and an adjudication slot. No labels pre-filled
- [x] `npx tsx evals/lease-corpus/validate.ts` and `tests/lease-corpus.test.ts`: quotes exact and unique, two different reviewers, labelled before seeing output, adjudication not resolved early
- [ ] Reviewers recruited, labels entered, disagreements adjudicated
- [ ] Owner decisions: replacements for L02, L04, L05, L06, L09; whether L10's partial excerpt stays; holdout locked by someone outside prompt work; usage terms confirmed

**Severity agreement so far:** 73–79% on the five runs before ticket 15 and 64–72% on the four after. The added misses are mostly month-to-month renewals graded low by the owner's ticket 12 rule. Unilateral modification is graded medium against the gold set's high in every run, before and after.
