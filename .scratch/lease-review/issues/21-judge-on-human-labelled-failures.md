# 21: Test the judge on human-labelled failures

**What to build:** A failure-enriched batch of flags from development material, relabelled by a person with the six-part guide and locked. Then a programmatic judge with a fixed configuration, run several times on the same flags, reporting how many human FAILs it catches, how many PASS controls it wrongly fails, and how repeatable it is (decision 5). Judge run 1 couldn't show any of this: the owner failed none of its ten flags.

**Blocked by:** 16

**Status:** tooling built; awaiting the owner's confirmation of the overall rule and human relabelling

- [x] Batch of 18 gold-set flags (12 likely to fail, 6 controls) from the four baseline runs, leaving out the ten flags labelled before. Development-lease outputs left out: they exist only for the calibration documents L01 and L08
- [x] Selection reasons recorded privately (gitignored, hashed in the batch); the reviewer sees no reason, match or verdict
- [x] Rubric v2 (`evals/judge/rubric-v2.md`) on the six-part guide, with a proposed overall PASS/FAIL rule and a rule for scope in a non-lease batch; v1 kept
- [x] Labelling page generalised: `npm run label -- --batch evals/judge/batch-2` records six verdicts, overall PASS/FAIL and rationale; read only once locked
- [x] `lock-verdicts.ts` locks complete verdicts with hashes, once
- [x] `run-judge.ts`: repeats (default 3), model from `JUDGE_OPENROUTER_MODEL` or else `OPENROUTER_MODEL`, never hardcoded. It refuses unless verdicts are locked and unchanged and no flag is from the holdout. Human verdicts are hidden from the judge. Rate limits are retried and counted separately. Not run
- [x] Metrics (human FAILs caught, PASS controls failed, repeatability), labelled "failure-enriched batch", unit-tested with synthetic verdicts
- [ ] Owner confirms the overall rule and the scope treatment in rubric v2
- [ ] A designated person relabels the batch; verdicts locked
- [ ] Judge run, ideally with an independent judge model; results reviewed by the owner
- [ ] The tests in `evals/**` run under `npm test` (needs `vitest.config.ts` to include them; lead)

Judge accuracy and repeatability: **not measured**. No human verdicts exist for the batch.
