# Independent lease evaluation

The independent corpus and its adjudications have not been supplied. Ticket 09 remains pending. `tests/evaluation.test.ts` uses synthetic inputs to verify the scorer and runner; its invented reviewer identifiers are test data and provide no independent evidence.

Run `npx tsx evals/cli.ts` to produce a prerequisite report under `evals/runs/`. It exits 2 while evidence is missing. Reports are ignored by Git; attach a reviewed, sanitized report deliberately when release evidence is available.

## Prepare the corpus

An evaluator outside prompt implementation must collect the release cases and control access. Keep development cases separate from a locked release set. The prompt-editing agent must not have permission to read the release set. This CLI does not establish operating-system isolation: run it under a separate restricted account or service, and give the implementation agent only sanitized reports. Do not place private leases or raw outputs in this repository.

Two independent reviewers must mark serious terms and their exact source sentences before seeing any model output. Resolve disagreements before running a case. Record pseudonymous reviewer IDs, keep actual identities and consent evidence in private storage, and freeze the adjudication with the corpus revision. Include serious terms, clean agreements, harmless unusual wording and incomplete packets.

`corpusSchema` in `score.ts` is the executable intake schema. A corpus has `id`, `partition` (`development` or `release`), `locked`, and `cases`. Each case contains:

- `id` and `category`: `serious`, `clean`, `harmless-oddity` or `incomplete`.
- `documents`: objects containing `id`, `title` and exact extracted `text`. The first ID must be `pasted-lease`; subsequent documents use `supplied-2`, `supplied-3`, and so on, matching the real product route.
- `adjudication`: `reviewerIds`, `completedBeforeModelOutput`, `disagreementsResolved`, `seriousTerms`, `harmlessTerms` and `missingDocuments`. Leave it `null` until adjudication exists.
- Each serious term has `id`, `documentId`, `sentence`, `severity: "high"` and `area` (`deposit`, `early-exit`, `dispute-rights` or `other`). The corpus must cover deposit, early-exit and dispute-rights serious terms before it can pass. Each harmless term has the same citation fields without severity or area. Missing documents are exact names that the reviewers expect the completeness result to identify.

Every labeled sentence must appear verbatim in its identified source document. The scorer rejects malformed labels, duplicate case IDs, duplicate document IDs and duplicate outcomes. Adjudication metadata records human attestations; it cannot establish independence by itself.

## Run and review

Load `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` into the restricted runner's environment. The CLI uses the product OpenRouter client and its configured Fireworks-only routing, required parameters, structured response schemas and low reasoning effort. It neither chooses a model nor changes provider settings.

```sh
npx tsx evals/cli.ts --corpus /restricted/release-corpus.json --live --revision COMMIT_OR_BUILD_ID --private-output /restricted/runs
```

The private output directory must already exist outside this checkout. The runner calls the real anonymous analysis route three times per case, covering completeness, general review and coverage. It never persists a lease. Each captured outcome is preserved in a new private file with owner-only permissions. The sanitized report includes IDs, counts, outcome hashes and reasons; source text stays in the private evidence.

The runner does not automate the remaining signer interactions. Reviewers must separately exercise grounded questions, unanswered questions, the personal-red-line rerun, proposed edits and residual risk through the same product build. Keep those observations in private evidence and review every run's material claims, conditions and checklist behavior. An exact citation does not establish that the model interpreted it correctly.

After this review, add `humanReview` to each reviewed outcome record using `recordsSchema` in `score.ts`: two `reviewerIds`, the unchanged `outcomeDigest` from the report, `checks` booleans for `materialClaims`, `conditionalWording`, `coverage`, `groundedAnswers`, `preferenceRerun` and `counterOffers`, plus `unsupportedClaimFlagIds` and `plausibleFalseAlarmFlagIds`. Set a check true only after the corresponding evidence has been reviewed. Preserve `provenance` from the live run. Human evidence is bound to the exact captured JSON response; changing that response invalidates its hash.

```sh
npx tsx evals/cli.ts --corpus /restricted/release-corpus.json --outcomes /restricted/reviewed-outcomes.json
```

Use `--baseline /restricted/previous-report.json` to include run-level comparisons for the same fixed corpus ID. Preserve the baseline and all three outcomes. New cases require a separately versioned corpus and adjudication; do not retune expected answers to hide a failure.

## Decision rules

The scorer checks each delivered risk flag against its named document and recorded offsets with exact string equality. It performs no whitespace, punctuation or semantic normalization. Product normalization can recover a model quote, but the delivered flag must contain the exact source slice. A wrong-document quote fails even when it appears elsewhere in the packet.

Each missed high-severity label is listed by case and run. Under-ranked serious terms are also visible. Citation failures, dropped flags that failed verification, unsupported material claims, clean leases receiving flags, incomplete packets receiving reviews and failed human checks block expansion. Plausible warnings independently judged harmless have their own count; unsupported claims cannot also count as plausible false alarms.

Missing or disputed adjudication, missing case categories, missing runs, provider errors, absent real-model provenance or incomplete human review leave the decision pending. A blocking finding takes precedence over pending evidence. Only a locked release corpus with all required evidence can pass. Exit codes are 0 for passed, 1 for blocked and 2 for pending or invalid input.

The CLI cannot certify reviewer independence, consent, access controls or the truth of submitted attestations. The release owner must inspect those records. No independent pass is claimed by this implementation.
