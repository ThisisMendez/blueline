# 17: Human-labelled real-lease holdout

**What to build:** A holdout of public residential leases, locked before tuning, labelled by two independent people and an adjudicator, frozen, and scored by a runner that refuses to touch the documents until the labels are frozen (decision 1). The synthetic gold set stays as the regression check. Real-lease performance stays "not measured" until human labels exist.

**Blocked by:** 16

**Status:** wontfix — independent human benchmark waived by owner
**Stage:** Closed by owner decision, not a passing validation result

The owner chose a renter-only first benchmark on November 18, 2026. This is a planning decision, not approval of the five templates, their use terms, access to real lease data, or any paid run. Keep the AI-assisted development results separate and report the first holdout result as a renter baseline only.

- [x] Five replacements for L02, L04, L05, L06, L09 fetched and checked against the corpus's eligibility rules. Four are Internet Archive copies of the same URLs (raw `id_` bytes). L05 is a different university's sample lease, because UMass's file still returns 403 and has no archive copy. Rejected candidates are recorded (`evals/holdout/README.md`)
- [x] Each recorded in `evals/holdout/manifest.json` and `evals/holdout/annotations/`:
  - source URL, snapshot or version, access date
  - original and extracted-text SHA-256, derived-text flag
  - jurisdiction, housing context, program restrictions, template or executed
  - completeness as supplied (read by us, not the product)
  - usage-rights notes; split holdout
- [x] Kept apart from `evals/lease-corpus/manifest.json`, so `npm run eval:leases` can't run them. Sources, text, labels and runs gitignored
- [x] Duplicate check against every development lease, the gold set and each other: none (highest overlap 8.4%, H06 with H09)
- [x] `evals/holdout/lock.json` written, marked as needing the owner's confirmation; `evals/holdout/holdout.test.ts` fails on a changed text hash or a holdout id, source or text in any development list
- [x] Calibration batch (L08 and part of L01) with reviewer instructions, local worksheets with offsets, label template and adjudication procedure (`evals/lease-corpus/calibration/`)
- [x] Freeze script: refuses until every document is adjudicated and the owner has confirmed the lock; writes a private frozen file and a committed hash; refuses edits (tested on synthetic data)
- [x] Holdout scorer (real-lease recall, false flags among emitted flags, clean-lease false alarms) with false-flag rules fixed before scoring; unit-tested on synthetic data
- [x] Runner that refuses unless frozen labels exist and match the seal. Not run
- [ ] Owner confirms the lock, the L05 substitute and the usage terms
- [ ] Reviewers recruited; calibration labelled and adjudicated; guide questions resolved
- [ ] Two independent people label renter concerns with exact quotes before seeing any Blueline outputs; a third person settles disagreements. Freeze the labels before scoring.
- [ ] After separate authorization and a budget check, run the renter holdout and report the case counts, correctly or incorrectly blocked packets, serious misses, false flags, and exact citation results. State when the set contains too few relevant cases for a measure.
- [x] The tests in `evals/**` are included in `npm test` by `vitest.config.ts`.

Real-lease recall, false flags and clean-lease false alarms: **not measured**. No human labels exist.

## Historical November 18 readiness check (before waiver)

All 33 offline evaluation tests and both deterministic smoke runs passed. The five-template lock is still unconfirmed and there are no frozen labels or seal. Use the [reviewer packet and runbook](../../../docs/handoff/renter-benchmark-runbook.md) to coordinate the human work. These checks do not establish renter accuracy on real leases.

## Superseding owner decision, November 18, 2026

The owner approved use of the five sample leases for renter evaluation and explicitly chose to proceed without recruiting independent volunteers. The original human-review requirement is closed by waiver. No reviewer identities, participation, reviews, adjudication, frozen labels or results have been invented. The unchecked historical steps above were not completed and are no longer active tasks.

Independent renter accuracy remains unmeasured. Future AI-generated labels or assessments must be described as AI-assisted and kept separate from the human benchmark. This waiver does not authorize new spend, a paid inference run or deployment, establish third-party licensing rights, or certify the product's accuracy. No sample content was processed in recording the decision.

The legacy human-only runner and lock remain unchanged; they must continue refusing to manufacture a human result without actual labels. The owner's sample-use approval is recorded here. No renewal of the volunteer request is needed unless the owner reopens independent review.
