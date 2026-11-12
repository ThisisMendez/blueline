# 22: Recover malformed model replies before they reach the signer

**What to build:** Every structured model call on the review path validates its reply against the expected schema before anything uses it. A reply in the wrong shape is retried once, with the validation problems attached; only a second bad reply ends in the existing `model-unreadable` failure. Counts of first-pass failures and recoveries are available to evals.

**Why (decision 6):** Documents ended model-unreadable on a reply the model could have fixed: gold set 1/36 over four runs (a coverage-checklist reply with `""` instead of `null` for not-found citations), public leases 1/15 over three runs.

**Blocked by:** none

**Status:** built; checked live

- [x] Strict structured output confirmed: every request sends `response_format: json_schema` with `strict: true`, pinned to Fireworks with `require_parameters: true` and no fallbacks. OpenRouter lists Fireworks as supporting `response_format` and `structured_outputs` for the configured model (checked 2026-11-11). Documented in `openrouter.ts`.
- [x] One helper, `completeStructured` (`src/features/analysis/model/structured.ts`), used by completeness, analysis, coverage checklist, consistency and Q&A. A client `unreadable` error (not JSON, empty, cut off) counts as a malformed reply and gets the same one retry; timeouts, rate limits and provider errors pass straight through.
- [x] Separate from the citation-verification retries: a citation retry is itself a structured call with its own shape retry.
- [x] The retry request carries `retryAfterInvalidReply: true`, so a call budget can tell it apart.
- [x] An empty string where the contract allows `null` is read as `null` (`model/fields.ts`), which removes the baseline checklist failure without a retry. A non-empty field still has to be real text.
- [x] Counts: `observeReplyValidation` / `recordReplyValidation` give first-pass failures, recoveries and failures still invalid after retry, by schema. Nothing in the product subscribes. `npm run eval:leases` prints them per document, per run and overall.
- [x] Tests: valid first reply, invalid then valid retry, invalid twice, for the helper and for the analysis, checklist, consistency, completeness and Q&A paths, plus the analysis route end to end (`structured.test.ts`, `reply-validation.test.ts`).

**Needs the lead or the rubric workstream (files this ticket doesn't own):**

- `evals/live-route.ts`: shape retries get their own allowance (2 per document) and the time budget rises from 120 s to 150 s, so a recovered reply can't push a document over the 7-call budget.
- `src/features/analysis/legal-claims.ts`: send the repair call through `completeStructured` with `modelLegalRepairSchema` (already in `model/legal-repair-schema.ts`) and delete `isRepairReply`. A repair that still fails keeps its current handling: texts withheld, flags kept.
- `evals/gold-set/cli.ts`: print the reply-validation counts per document and per run.

**Live results** (2026-11-11/12, budget change applied locally):

| Run | Documents | First-pass invalid | Recovered by retry | Ended model-unreadable |
|---|---|---|---|---|
| baseline gold (4 runs) | 36 | not counted | n/a | 1/36 |
| baseline leases (3 runs) | 15 | not counted | n/a | 1/15 |
| gold `npm run eval`, run 1 | 9 | 0 | 0 | 0/9 |
| gold `npm run eval`, run 2 | 9 | 0 | 0 | 0/9 |
| leases set A (x3) | 15 | 0 | 0 | 0/15 |
| leases set B (x3, provider degraded) | 15 | 5 (all "no content") | 0 | 1/15 |
| leases set C (x3) | 15 | 0 | 0 | 0/15 |
| leases set D (x3, final code) | 15 | 0 | 0 | 0/15 |

Gold counts came from a scratch wrapper that observes `observeReplyValidation` around the unchanged gold CLI (recall 26/26 and 23/26). In set B the provider returned empty content and timed out repeatedly. None of the five empty first replies was recovered. Four retries never finished because the eval's 150 s per-document budget ran out first, so the document ended as a budget failure, not as unreadable. One retry came back empty again (L08, the one terminal unreadable). Three more runs in that set were plain timeouts. Empty replies under provider trouble are what this retry recovers least well. The strict schema and the empty-string rule have removed the shape failure the baseline saw.
