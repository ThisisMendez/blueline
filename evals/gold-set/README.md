# Gold-set regression eval (ticket 11)

`npm run eval:gold` runs the nine documents in `corpus/manifest.json` through Blueline's analysis route, scores the flags against the planted clauses, and saves the run to `runs/` as a `.txt` and a `.json` named for its start time.

A model wrote this gold set, and none of its documents are leases. The numbers are an upper bound and never a promise to a reader. **They are not the independent evidence ticket 09 and ADR 0012 require before expansion.** Do not cite them as that evidence, and do not put them in product copy.

## What is here

- `corpus/` and `fixtures/` are copied byte for byte from `tests/corpus` and `tests/fixtures` in https://github.com/ankitvirmani/redline (commit `c41170d`). Do not edit them. Read `corpus/README.md` before reading a number off a run.
- `corpus.ts` loads the manifest, sidecars and question sets without changing a character.
- `score.ts` holds the clause type mapping and the scoring rules. It is pure, so `tests/gold-set-eval.test.ts` covers it with no network.
- `cli.ts` is the live runner.

## Clause type mapping

Blueline's clause names are the rows of the "My red lines" table in `PRD.md`. The gold set has seven types.

| Gold-set type | Blueline red line | Counted in recall? |
|---|---|---|
| `arbitration-and-class-action-waiver` | Waivers of dispute rights, including forced arbitration | Yes |
| `fee-escalators-and-late-fees` | Early termination, reassignment, or penalty fees (late fees), and the consequential rent change named under "any other term" (escalators) | Yes |
| `auto-renewal` | Not named | No, out of scope |
| `unilateral-modification` | Not named | No, out of scope |
| `non-compete` | Not named | No, out of scope |
| `limitation-of-liability` | Not named | No, out of scope |
| `indemnification` | Not named | No, out of scope |

Blueline's "deposit forfeiture" red line has no gold-set type, so the gold set doesn't measure it.

That leaves 14 of the 40 planted clauses in scope: 5 arbitration and 9 fee clauses. A run still reports out-of-scope clauses that got flagged anyway, but only for information. They are never counted as misses.

## Decisions made without asking

The brief said to record these here instead of stopping.

1. **No second `npm run eval`.** That script already belongs to ticket 09's independent-evidence harness (`evals/cli.ts`). This eval is `npm run eval:gold`, so the two can't be confused. Ticket 09 stays open.
2. **Folder.** The brief said `eval/`, but this eval lives in `evals/gold-set/`. CLAUDE.md asks for a recorded architectural reason before adding a top-level directory, and `evals/` already holds the evaluation code.
3. **Run records.** These go in `evals/gold-set/runs/`, not a top-level `eval-runs/`, for the same reason. Ticket 09's `evals/runs/` is gitignored because it may hold private leases. These runs hold only public synthetic text, so they are committed.
4. **Same pipeline as smoke.** The runner copies `scripts/smoke.ts --live`:
   - the same `OpenRouterModelClient` with a 30 s timeout
   - the same counting wrapper and per-document budget (6 calls, 120 s)
   - anonymous `createAnalysisRoute` wiring with the same fixed clock
   - the same request body (`text` plus the sidecar `title`)

   It reads `.env.local` the way smoke does. No app code, prompt or model setting was changed.
5. **"Named the right type" can't be measured.** `RiskFlag` has no clause type field, and the model schema doesn't ask for one. Guessing a type from the flag's wording would mean the eval grading its own guess, so the report says this can't be measured. Each flag's `clauseType` is `null`, and `matchedPlantedType` records the type of the planted clause it hit.
6. **Found.** A flag finds a planted clause when its quote appears verbatim in the document and its span overlaps the planted sentence's span. A quote that doesn't check out finds nothing.
7. **Groundedness denominator.** The route delivers only flags that passed verification, and it reports the rest as `droppedFlagCount`. "All flags the model returned" is therefore delivered plus dropped. The raw count across every attempt, retries included, is printed alongside.
8. **Failed and blocked documents.** A failed or rejected model call, or one that hits the budget, leaves that document out of every denominator, and the reason is listed.

   A document the product blocks as incomplete is left out too and listed separately. Several gold-set documents point at schedules, exhibits or handbooks they don't include, and PRD.md tells the product to stop rather than review part of a packet. Counting a block as a miss would penalise behaviour the product is supposed to have. Counting it as clean would hide that no review happened.
9. **Clean documents.** These are the three manifest entries marked `benign`. The run reports how many came back with zero flags and the total number of flags on them.
10. **Character split.** In-scope recall is split by whether the planted sentence contains:
    - a curly quote or apostrophe (U+2018/2019/201C/201D)
    - a non-breaking space (U+00A0/202F)
    - an fi or fl ligature (U+FB01/FB02)
    - an em dash
    - two spaces in a row

    Only 5 of the 14 in-scope sentences carry any of these, so read the split as a direction, not a figure.

## Runs

| Started | Model | Result |
|---|---|---|
| 2026-11-03T16:45:37Z | `z-ai/glm-5.3-flash` | No numbers. All 9 calls returned 401 "API key expired", so all 9 documents were left out. Renew `OPENROUTER_API_KEY` in `.env.local` and run again. |
