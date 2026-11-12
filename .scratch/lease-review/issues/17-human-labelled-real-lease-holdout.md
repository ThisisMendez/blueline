# 17: Human-labelled real-lease holdout

**What to build:** A holdout of public residential leases, locked before tuning, labelled by two independent people and an adjudicator, frozen, and scored by a runner that refuses to touch the documents until the labels are frozen (decision 1). The synthetic gold set stays as the regression check. Real-lease performance stays "not measured" until human labels exist.

**Blocked by:** 16

**Status:** tooling built and holdout locked; awaiting owner confirmation, reviewers and labels

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
- [ ] Holdout labelled by two reviewers, adjudicated, frozen
- [ ] First scored holdout run
- [ ] The tests in `evals/**` run under `npm test` (needs `vitest.config.ts` to include them; lead)

Real-lease recall, false flags and clean-lease false alarms: **not measured**. No human labels exist.
