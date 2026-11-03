# 11: Gold-set regression eval

**What to build:** A repeatable live check, `npm run eval:gold`, that runs every document in the instructor's gold set (copied from ankitvirmani/redline into `evals/gold-set/`) through the analysis route exactly as `npm run smoke -- --live` does, and reports recall on in-scope planted clauses, groundedness of every returned flag, and flags on clean documents. It answers "did a prompt or model change make things worse?", and it does that more cheaply than a full independent review.

**This does not satisfy ticket 09.** A model wrote the gold set, its documents are not leases, and nobody adjudicated it independently. Its numbers are an upper bound, never independent trust evidence under ADR 0012, and never copy a reader sees.

**Blocked by:** 01, 03 (needs real flags and completeness gating). Running it live needs a working `OPENROUTER_API_KEY`.

**Status:** built and verified offline; first live run had no usable numbers because the OpenRouter key had expired

- [x] Gold set copied byte for byte (`diff -r` against the clone is clean); manifest-relative paths resolve
- [x] `npm run eval:gold` uses the smoke script's client, timeout, call budget, route wiring and request body; no app code, prompt or model setting changed
- [x] The gold set's seven clause types are mapped onto PRD.md's red lines in `evals/gold-set/README.md`; unmapped types are out of scope and never counted as misses
- [x] A planted clause counts as found when a verbatim flag overlaps it; whether the flag named the right type is reported as not measurable, because Blueline's flags carry no type
- [x] Failed and blocked documents are left out of every denominator and listed with the reason
- [x] Recall is split by curly quote, non-breaking space, fi/fl ligature, em dash and double space
- [x] Every rate prints as count/count and a percentage; each run saves `.txt` and `.json` under `evals/gold-set/runs/`, named for its start time, with every flag
- [x] `tests/gold-set-eval.test.ts` checks, with no network, that every gold-set sentence appears exactly once in its document
- [ ] A live run with a working key produces recall, groundedness and clean-document numbers

Evidence: `npm run typecheck` clean; `npm test` 26 files, 234 tests pass. Live run `evals/gold-set/runs/2026-11-03T16-45-37.153Z.txt`: 9 of 9 documents left out, 401 "API key expired" from OpenRouter, so every rate reads 0/0.
