# Rubric judge (decision 5, ticket 21)

Does the rubric judge catch flags a person would fail? Run 1 couldn't answer that, because the owner failed none of the ten flags it judged (`run-1-review.md`). This folder sets up a fair test: a batch built to contain flags likely to fail, plus controls, relabelled by a person with the six-part guide, locked, and only then judged several times by a programmatic judge.

**Judge accuracy and repeatability are not measured yet.** The human verdicts don't exist.

## Files

| File | What it is |
|---|---|
| `rubric.md` | Rubric v1. Kept for history; run 1 used it |
| `run-1.json`, `all-flags-run-1.json`, `run-1-review.md` | Judge run 1 and the owner's review of it |
| `rubric-v2.md` | Rubric v2, following the six-part reviewer guide, with a proposed overall PASS/FAIL rule |
| `select-batch.ts` | Builds the failure-enriched batch |
| `batch-2/batch.json` | The batch: 18 flags, what the reviewer and the judge see |
| `private/batch-2-selection.json` | Why each flag was picked. Gitignored, and kept from the reviewer until their verdicts are locked |
| `verdicts.ts`, `lock-verdicts.ts` | The verdict format, and the script that locks human verdicts |
| `run-judge.ts`, `metrics.ts` | The judge runner and its metrics |
| `judge.test.ts` | Tests on synthetic data |

## The batch

`npx tsx evals/judge/select-batch.ts` drew 18 flags from the four baseline gold-set runs (`evals/gold-set/runs/2026-11-11T19-22-55` to `19-41-25`, ungated). It left out the ten flags the owner labelled in `evals/labels/`.

- **12 likely to fail.** Flags on a clean document, on an unusual-but-harmless sentence, on an ordinary payment that matches no planted clause, or matching no planted clause at all. They were taken in that order, up to a cap per kind, and spread across documents.
- **6 controls (a third).** Flags that match a planted, in-scope clause the gold set grades critical or high.

"Likely to fail" is how flags were picked, not a verdict. The reviewer decides every verdict. The batch is shuffled with a fixed seed, so the reviewer can't tell controls from the rest by position. Each flag's reason is recorded only in the private selection file, and `batch.json` carries that file's hash.

**Development material only.** Development-lease outputs exist only for L01 and L08, which are the calibration documents. Reviewers must never see model output for a document they label, so those outputs were left out. No holdout document is or may be in a judge batch: the runner refuses, and `evals/holdout/holdout.test.ts` checks.

The gold-set documents aren't leases, so every flag in this batch is out of scope under the guide. Rubric v2 asks for the scope verdict as usual, but judges the overall verdict as if the document were a lease. This is proposed, for the owner to confirm before relabelling.

## Relabelling (a person, not a model)

1. The owner confirms the overall rule in `rubric-v2.md` (also in `evals/reviewer-guide.md`).
2. The reviewer opens the page and records, for each flag, the six verdicts, the overall PASS/FAIL and a one-sentence rationale:

   ```sh
   npm run label -- --batch evals/judge/batch-2
   ```

   The page shows the guide and the overall rule, saves to `batch-2/verdicts.json`, and never suggests a verdict. Until their verdicts are locked, the reviewer doesn't open `private/`, the gold-set runs or the gold-set sidecars.
3. Lock the verdicts:

   ```sh
   npx tsx evals/judge/lock-verdicts.ts evals/judge/batch-2
   ```

   It refuses until every flag is complete, and refuses to lock twice. It writes `batch-2/verdicts.lock.json` with the hashes of the batch and the verdicts. After that the page is read only and the server refuses saves.

## Running the judge (after the lock)

```sh
npx tsx evals/judge/run-judge.ts evals/judge/batch-2 --repeats 3
```

It refuses unless the human verdicts are locked and unchanged, the private selection file matches the batch's hash, no flag is from a holdout document, and a model is configured. It hasn't been run.

- **Model:** `JUDGE_OPENROUTER_MODEL`, or `OPENROUTER_MODEL` when that's unset. No model id is written in code. When the judge is the same model that wrote the flags, the report says so: a model judging its own output is a weaker test than an independent judge.
- **Fixed configuration:** the call goes through the product's OpenRouter client, so it uses temperature 0, low reasoning effort and the product's pinned provider. A judge model that provider doesn't serve will fail; that's a limit of reusing the client.
- **One flag per request.** Each request holds the rubric, the guide and that flag's document title, severity, quote, consequence and paragraph. The judge never sees the human verdicts or why a flag was picked. The runner reads the human verdicts only after the last judge call.
- **Rate limits.** Calls run one at a time and are retried on `rate-limited`. A flag that never gets a readable verdict is counted as missing, not as a judge error.

## What it reports

Every figure is labelled **failure-enriched batch**. The batch was built to hold likely failures, so the rates describe this batch, not flags in general. Accuracy and repeatability are reported separately.

| Figure | Definition |
|---|---|
| Human FAILs caught | Flags the human FAILed that the judge also FAILed / all human FAILs. Reported for each repeat and by majority across repeats |
| PASS controls failed | Controls the human PASSed that the judge FAILed / all PASS controls. A control the human FAILs counts as a human FAIL and is listed |
| Repeatability | Flags with the same readable verdict on every repeat / flags rerun |

Results go to `batch-2/judge-runs/<time>.json`. Gold-set text is synthetic and public, so these files can be committed.
