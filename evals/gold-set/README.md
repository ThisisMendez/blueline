# Gold-set regression eval (ticket 11)

`npm run eval` runs the nine documents in `corpus/manifest.json` through Blueline's analysis route, scores the flags against the planted clauses, and saves the run to `runs/` as a `.txt` and a `.json` named for its start time. It runs ungated (decision 11). `npm run eval:gated` runs the same documents through the completeness check first, the way a signer is served.

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
| `auto-renewal` | Automatic renewal or extension (named in PRD.md since ticket 12; before that, counted under "any other term") | Yes |
| `unilateral-modification` | Any other term with a plausible, material downside: a power to rewrite the terms, fees included, is a consequential rent change | Yes |
| `non-compete` | Not named | No, out of scope |
| `limitation-of-liability` | Not named | No, out of scope |
| `indemnification` | Not named | No, out of scope |

Blueline's "deposit forfeiture" red line has no gold-set type, so the gold set doesn't measure it.

That leaves 26 of the 40 planted clauses in scope: 5 arbitration, 9 fee, 6 auto-renewal and 6 unilateral modification clauses.

Out of scope, and why:

- `non-compete` comes from employment agreements, which PRD.md's "What we are not building" leaves out of the first version.
- `limitation-of-liability` and `indemnification` appear in leases, but PRD.md's research section calls the evidence for them thin. Revisit them once ticket 09's lease corpus shows whether they matter.

A run still reports out-of-scope clauses that got flagged anyway, but only for information. They are never counted as misses.

The mapping changed on 2026-11-10. Before that, only arbitration and fees were in scope (14 clauses), and auto-renewal and unilateral modification were reported as out of scope. Both now count because the "any other term" row names a consequential rent change, which is what both clauses do. Keeping auto-renewal out also hid the product's weakest type, at 1/6 found in the first ungated run. Runs before this date use the old denominator, so their recall can't be compared directly with later runs.

## Decisions made without asking

The brief said to record these here instead of stopping.

1. **`npm run eval` is this gold set.** At first this eval was `npm run eval:gold`, because `npm run eval` belonged to ticket 09's independent-evidence harness (`evals/cli.ts`). On 2026-11-10 the owner moved `npm run eval` to the gold set, because ticket 09 can't run until real leases are independently labelled, and there are no test users yet to supply them. The main command should be one that gives numbers after a prompt or model change. Ticket 09's harness is now `npm run eval:independent`. It is still the only route to the evidence ADR 0012 requires, and ticket 09 stays open.
2. **Folder.** The brief said `eval/`, but this eval lives in `evals/gold-set/`. CLAUDE.md asks for a recorded architectural reason before adding a top-level directory, and `evals/` already holds the evaluation code.
3. **Run records.** These go in `evals/gold-set/runs/`, not a top-level `eval-runs/`, for the same reason. Ticket 09's `evals/runs/` is gitignored because it may hold private leases. These runs hold only public synthetic text, so they are committed.
4. **Same pipeline as smoke.** The runner copies `scripts/smoke.ts --live`:
   - the same `OpenRouterModelClient` with a 30 s timeout
   - the same counting wrapper and per-document budget (7 calls, 120 s; 6 until ticket 14 added the legal-claim repair call)
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

11. **`--ungated` mode** (`npm run eval`; `npm run eval:gated` is the run without it). This mode was added after the first working run, when 7 of 9 documents were blocked. Each document skips the completeness check and goes straight to `runGeneralReview`, the review stage the route calls once a packet is complete. The model client, the budget and the packet shape (one `pasted-lease` document) stay the same. A signer is never served this way, so the report header says UNGATED and the file name ends in `-ungated`. The ungated run is the only way this gold set yields a recall number without editing it, so since 2026-11-10 it is the default: `npm run eval`. Its numbers measure the review stage, not what a signer sees. The gated run (`npm run eval:gated`) remains the check on gating and on clean documents as a signer is served.

## What each mode measures (since ticket 13)

These are separate measurements. Don't read one as another.

- **`npm run eval` (ungated): component-level clause detection.** The review stage on its own. The gold set's documents aren't leases, so a signer would never get these reviews.
- **`npm run eval:gated`: end-to-end scope enforcement on the gold set.** Every gold-set document should now be stopped as out of scope. A review here is a scope failure.
- **End-to-end residential lease performance** needs real leases: the public lease corpus in `evals/lease-corpus/`.
- **Human-reviewed accuracy and launch readiness** need the independently labelled, locked lease set (ticket 09). Nothing in this folder measures them.

## Six-decision change reporting (2026-11-11)

Two additions to the report. The original 26-risk benchmark and its denominators are unchanged.

**Unilateral cases (decision 2).** Each run lists the six `unilateral-modification` cases with the gold label and the product's grade, then prints `Six unilateral cases High: n/6`. A missed case counts as not High. The gold set grades all six `critical`. Blueline has no Critical tier (severity is high, medium or low), so the best a product grade can do is High, and the report shows that gap: `gold critical graded High`. **Exact-band agreement** compares the product's grade with the gold set's own label (high = high, medium = moderate), so High on a critical clause is not exact. It prints next to the existing mapped agreement, which treats critical and high as the same band. The six cases are a visible gap, not a defect in the product.

**Proposed label corrections (decision 4).** `label-corrections.json` lists the sentences in the three benign documents (clean-document, library-volunteer-agreement, swim-lesson-registration) that conflict with the owner's materiality standard in `PRD.md`: a term that forfeits money for a period or service the signer won't get, or property. Each entry records the document, the exact sentence (checked verbatim and unique by `tests/gold-set-eval.test.ts`), the original label, the corrected label, the standard and the reason. It is a proposal applying the owner's standard and is pending owner confirmation. The original labels in `corpus/` and `fixtures/` are not edited.

The run's revised view splits flags on the benign documents into valid Low forfeiture flags (overlapping a corrected sentence) and false flags (everything else), and gives a clean-document count that tolerates valid forfeiture flags. The original clean-document count prints unchanged beside it.

Frozen before any candidate run: `label-corrections.json` SHA-256 `707215fdab15f00596a353ae6403b7cf45c262fdf0fbd849094692ff383d4a72`. A test fails if the file changes without this line changing, and each run prints the hash it used.

## Runs

| Started | Model | Result |
|---|---|---|
| 2026-11-03T16:45:37Z | `z-ai/glm-5.3-flash` | No numbers. All 9 calls returned 401 "API key expired", so all 9 documents were left out. Renew `OPENROUTER_API_KEY` in `.env.local` and run again. |
| 2026-11-03T17:00:55Z | `z-ai/glm-5.3-flash` | 7 of 9 documents were blocked as incomplete, because each refers to a schedule, handbook or exhibit the gold set doesn't include. That left recall at 0/0 (nothing to measure). Groundedness was 2/2 (100.0%). Clean documents: 1 of 2 came back with no flags (50.0%). The 2 flags were both on `swim-lesson-registration`: a medium on its no-refund-after-the-third-lesson rule and a low on its make-up lessons. The third clean document was blocked. |
| 2026-11-03T17:04:20Z (ungated) | `z-ai/glm-5.3-flash` | 9 of 9 reviewed. Recall 11/14 (78.6%): arbitration 5/5, fees 6/9. Missed: adhesion P-02 (the double-space sentence), adhesion P-03, saas P-02. Groundedness 52/54 (96.3%). Clean documents with no flags 2/3 (66.7%), with 3 flags on `swim-lesson-registration`. Out-of-scope clauses flagged anyway: 20/26. Flags on planted documents that matched no planted clause: 18. Flags on unusual-but-harmless sentences: 3. |
| 2026-11-10T18:39:51Z (ungated, new mapping) | `z-ai/glm-5.3-flash` | 9 of 9 reviewed. Recall 17/26 (65.4%): arbitration 5/5, unilateral modification 5/6, fees 5/9, auto-renewal 2/6. Missed: adhesion P-01, P-03, P-07; saas P-01, P-03; storage P-01, P-02; phone P-01, P-04. Groundedness 53/53 (100.0%). Clean documents with no flags 1/3 (33.3%), with 4 flags: 2 low on `clean-document`, a medium and a low on `swim-lesson-registration`. Fee recall fell from 6/9 to 5/9 and different fee clauses were missed this time, so expect a clause or two of variation between runs. |
