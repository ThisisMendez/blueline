---
name: blueline-eval
description: >-
  Blueline lease-analysis eval: run the recurring real-model quality check
  after a prompt or model change, or before a release. Compare held-out lease
  cases for exact citations, serious misses, false alarms, grounded answers,
  and counter-offers. Use for Blueline analysis regression checks, not for
  skill-trigger evals, choosing an OpenRouter model, general application tests,
  or reviewing one lease.
---

# Blueline analysis eval

Read the current `PRD.md` (especially “What good looks like”), `CONTEXT.md`, and relevant ADRs before scoring. The configured OpenRouter model remains a variable; do not choose or hardcode a model ID.

## Prepare the run

- Identify the prompt or model change and the baseline to compare. Use a fixed development set and a locked release set; add new cases only after review, preserving the fixed comparison scores.
- Keep public or synthetic cases in the repo. Access consented, redacted real leases from private storage. The prompt-editing agent must not inspect locked release cases; run them through a separate restricted runner. A skill instruction alone does not enforce that separation.
- Require two independent reviewers to mark serious terms and source sentences without seeing model output. Resolve disagreements before a serious miss is scored. If the application, runner, corpus, private access, or adjudications are absent, report the missing prerequisite and do not claim a pass.

## Run and score

- Exercise the same complete signer flow used by the product: packet completeness, general review, document-grounded questions, optional red-line rerun, and counter-offer presentation. This skill judges real-model analysis; deterministic parsing, authentication, and expiry behavior belong in application tests.
- Run each case three independent times with the configured real model. Preserve each outcome and report the aggregate; do not let an average hide a single serious miss.
- Mechanically verify that every risk flag quotes an exact sentence in the identified extracted document. Compare severity and serious misses with the adjudicated labels. Count plausible warnings later judged harmless separately from unsupported claims. Check clean results, not-found items, conditional wording, grounded answers, proposed edits, and stated residual risk against the brief.
- Mark the release **blocked** if any run shows a citation mismatch or an independently confirmed serious miss. Mark it **pending** if a release case or required human adjudication is unavailable or disputed. Only mark **passed** after all required cases and reviews complete.

## Leave evidence

- Write a concise Markdown report and structured results under `evals/runs/`, with case IDs, run-level outcomes, baseline comparison, false alarms, gate status, and reasons. Keep private lease text and raw private outputs out of the repo.
- For a failure, show the case ID and observable failure, then propose a focused hand edit for review. Run a new comparison after an authorized edit. Do not change prompts or model configuration or launch an optimizer as part of reporting.
