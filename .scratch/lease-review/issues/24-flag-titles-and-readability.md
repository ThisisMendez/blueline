# 24: Flag titles and a readability guard

**What to build:** Every risk flag gets a short, neutral title that names the lease term ("Deposit deductions at the landlord's discretion"), shown at the top of its card. The flag's explanation fields are checked for reading level. Any that read above about grade 9 are rewritten once in plainer words, without dropping or adding facts.

**Why:** LeaseGuard AI's cards lead with a title, then the clause, then why it matters. That lets a signer scan the list before opening anything. Blueline's cards today start with "Risk flag 01" and the quoted sentence, so the signer has to read the clause to know what the flag is about. Some explanations also drift into dense wording. Source: `research/competitors/leaseguard-ai/05-implementation-blueprint.md`, feature 5.

**Blocked by:** none

**Status:** ready-for-agent

**Scope:**
- **Model contract:** `src/features/analysis/model/schema.ts`, `prompt.ts`
- **Review step:** `review.ts`, plus a new pure readability helper
- **UI:** `RiskFlagCard.tsx`
- **Library:** the store adapters
- **Database:** migration `0007_flag_titles.sql`
- **No change to** `OPENROUTER_MODEL`

- [ ] `title` is a required field in `analysisJsonSchema` and `modelFlagSchema`, at most 8 words. The prompt says to name the term, not judge it: no "illegal", "unfair", "unenforceable" or "predatory".
- [ ] Titles pass `enforceLegalBoundary`. A title that states a legal conclusion is repaired or replaced, the same as the other flag fields. A withheld title falls back to the first words of the cited sentence, and the flag is never dropped.
- [ ] Migration `0007_flag_titles.sql` adds a nullable `review_flags.title`. Reviews saved before the change still load, and their cards fall back to the first words of the cited sentence.
- [ ] A pure `readingGrade(text)` helper (Flesch–Kincaid with a syllable heuristic, no new dependency). A short allowlist of lease terms ("indemnify", "sublease", "arbitration"…) doesn't count against the score.
- [ ] `consequence` and `triggeringCondition` above grade 9 go through one rewrite call. It uses `completeStructured` with its own schema and this instruction: keep every fact, add nothing, and leave quoted lease wording unchanged. The rewrite is then rechecked by `enforceLegalBoundary`. If the result is still above grade 9 or fails, the original text is kept. A flag is never withheld for readability.
- [ ] The rewrite call is counted in the eval call budget (`evals/live-route.ts`) and only runs for fields that fail the check
- [ ] The card shows the title as its heading. "Risk flag NN" moves to a smaller label.
- [ ] Tests:
  - `readingGrade` on known passages
  - schema tests with a missing or too-long title
  - legacy stored reviews without a title
  - the rewrite path (passes, still too hard, call fails)
  - a component test of the heading
- [ ] Eval: run `npm run eval:gated` before and after. Recall must not drop, and titles are added to the judge rubric ("names the term, no verdict").
- [ ] `npm run typecheck`, `npm test` and `npm run build` pass
