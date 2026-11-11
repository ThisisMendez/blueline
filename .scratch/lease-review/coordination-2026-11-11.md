# Six-decision change: baselines, ownership, holdout exclusion

Written by the lead before any workstream starts. Baselines come from runs already recorded on `option-b-layer1` at `2a697f9` (same behaviour as the code the workstreams start from), so they are reproducible from committed run files and the local lease-corpus runs.

## Baselines (before any change)

| Decision | Measure | Baseline | Source |
|---|---|---|---|
| 1 | Real-lease recall, false flags, clean-lease false alarms | not measured (no labels) | evals/lease-corpus/annotations/ |
| 2 | Six unilateral-modification cases graded High | 2/6, 1/6, 2/6, 2/6 (adhesion P-04 and internship P-02 High; saas P-05, offer P-01, storage P-06, phone P-04 Medium) | gold runs 2026-11-11T19-22-55, 19-26-35, 19-30-15, 19-41-25 (ungated) |
| 2 | Mapped severity agreement, gold set | 18/25, 16/25, 17/25, 16/24 (64–72%) | same four runs |
| 2 | Exact-band agreement | not reported before; the gold set grades all six cases **critical** and Blueline has no Critical tier | evals/gold-set/score.ts |
| 3 | Public templates with an identical missing list on every repeat | 1/5 (L08 only, reviewed every time) | lease-corpus runs 19-05-19, 19-06-29, 19-20-52 |
| 3 | Duplicate missing entries | 2 in 3 runs (L03 "Unit Inspection Report" twice; L07 handbook twice), both in run 19-20-52 | same |
| 4 | Recall on the original 26-risk benchmark | 25, 25, 25, 24 /26 | four gold runs |
| 4 | Flags on gold-set "clean" documents | 2, 2, 4, 3 | four gold runs |
| 5 | Judge on human FAILs | not measurable (0 human FAILs in the 10 labelled flags) | evals/judge/run-1.json |
| 6 | Documents ending model-unreadable | gold 1/36 (4 runs); public leases 1/15 (3 runs) | gold runs above; lease runs above |

Rate-limited documents are a provider condition, not model-unreadable, and are counted separately.

## Holdout exclusion list (set before tuning)

- **Holdout-only, off limits to the rubric/prompt and completeness workstreams:** the five replacement sources for L02, L04, L05, L06 and L09, and anything fetched for them. Only the evaluation workstream may download, read or run them, and only to lock membership and versions. No model output for them is generated before the adjudicated labels are frozen.
- **Development (may be used for tuning and repeat runs):** L01, L03, L07, L08, L10 and the synthetic gold set. L07 and L10 were holdout candidates; decision 3 requires repeat runs on all five public templates, so both move to development.
- **Calibration batch for reviewers:** drawn from development documents only.

## One editor per shared file

| Files | Editor |
|---|---|
| `src/features/analysis/prompt.ts`, `PRD.md`, `evals/gold-set/score.ts`, `evals/gold-set/cli.ts`, `evals/gold-set/` label overlays, `tests/gold-set-eval.test.ts` | rubric and prompt workstream |
| `src/features/packet/**`, `src/features/analysis/model/**`, `src/features/analysis/{review,coverage,consistency}.ts`, `src/features/questions/route.ts`, `tests/support/fixture-model-client.ts`, `evals/lease-corpus/run.ts` | completeness and response workstream |
| `evals/lease-corpus/**` (except `run.ts`), `evals/holdout/**`, `evals/judge/**`, `evals/reviewer-guide.md` | evaluation workstream |
| `evals/live-route.ts`, `package.json`, `docs/adr/**`, `README.md` | lead |

A workstream that needs a change in a file it doesn't own describes the exact change in its report, and the editor or lead applies it during integration. Tickets: evaluation 17 (holdout) and 21 (judge); rubric 18 (unilateral) and 20 (forfeiture labels); completeness 19 (missing lists) and 22 (malformed replies).
