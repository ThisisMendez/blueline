# 11: Gold-set regression eval

**What to build:** A repeatable live check, `npm run eval:gold`, that runs every document in the instructor's gold set (copied from ankitvirmani/redline into `evals/gold-set/`) through the analysis route exactly as `npm run smoke -- --live` does, and reports recall on in-scope planted clauses, groundedness of every returned flag, and flags on clean documents. It answers "did a prompt or model change make things worse?", and it does that more cheaply than a full independent review.

**This does not satisfy ticket 09.** A model wrote the gold set, its documents are not leases, and nobody adjudicated it independently. Its numbers are an upper bound, never independent trust evidence under ADR 0012, and never copy a reader sees.

**Blocked by:** 01, 03 (needs real flags and completeness gating). Running it live needs a working `OPENROUTER_API_KEY`.

**Status:** built; recall is measured in `--ungated` mode only, because 7 of 9 gold-set documents are blocked by completeness gating in the normal run

- [x] Gold set copied byte for byte (`diff -r` against the clone is clean); manifest-relative paths resolve
- [x] `npm run eval:gold` uses the smoke script's client, timeout, call budget, route wiring and request body; no app code, prompt or model setting changed
- [x] The gold set's seven clause types are mapped onto PRD.md's red lines in `evals/gold-set/README.md`; unmapped types are out of scope and never counted as misses (2026-11-10: auto-renewal and unilateral modification moved in scope under the "any other term" row; 26 of 40 clauses now count)
- [x] A planted clause counts as found when a verbatim flag overlaps it; whether the flag named the right type is reported as not measurable, because Blueline's flags carry no type
- [x] Failed and blocked documents are left out of every denominator and listed with the reason
- [x] Recall is split by curly quote, non-breaking space, fi/fl ligature, em dash and double space
- [x] Every rate prints as count/count and a percentage; each run saves `.txt` and `.json` under `evals/gold-set/runs/`, named for its start time, with every flag
- [x] `tests/gold-set-eval.test.ts` checks, with no network, that every gold-set sentence appears exactly once in its document
- [x] A live run produces a recall number, in `--ungated` mode (the gated run can't: 7 of 9 documents refer to material the gold set doesn't include, so ticket 03's gate stops them before review)

Evidence: `npm run typecheck` clean; `npm test` 26 files, 234 tests pass. Live run `evals/gold-set/runs/2026-11-03T16-45-37.153Z.txt`: 9 of 9 documents left out, 401 "API key expired" from OpenRouter, so every rate reads 0/0. Second run `evals/gold-set/runs/2026-11-03T17-00-55.202Z.txt`, with a renewed key: 2 documents reviewed, 7 blocked as incomplete; recall 0/0; groundedness 2/2; clean documents with no flags 1/2 (2 flags on swim-lesson-registration). Ungated run `evals/gold-set/runs/2026-11-03T17-04-20.480Z-ungated.txt`: 9 reviewed; recall 11/14 (78.6%); groundedness 52/54 (96.3%); clean documents with no flags 2/3 (66.7%).

Run after the mapping change, `evals/gold-set/runs/2026-11-10T18-39-51.849Z-ungated.txt`: 9 reviewed; recall 17/26 (65.4%), with auto-renewal at 2/6; groundedness 53/53 (100.0%); clean documents with no flags 1/3 (33.3%).
