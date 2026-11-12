# Public residential lease corpus

Ten candidate public lease documents, gathered on 2026-11-11 for evaluating Blueline on real lease language. This is an **intake**, not a gold standard: no document has been labelled, and nothing a model produced counts as a label. Ten documents would be an initial corpus, not launch evidence, even when fully labelled.

## What's committed and what stays local

The repository is public and these are third-party documents, so:

- **Committed:** `manifest.json` (sources, access results), `annotations/*.json` (metadata and empty review slots, no lease text), and the scripts.
- **Local only, gitignored:** `sources/` (the original files), `text/` (extracted text) and `runs/` (product outputs, which quote the leases).

Each annotation record carries the SHA-256 of the original file and of the extracted text, so two people can confirm they're labelling the same bytes. To rebuild locally, download each source into `sources/<id>/` under the file name in `manifest.json`, then run `npx tsx evals/lease-corpus/extract.ts`.

## Status of the ten sources

| ID | Source | Available | Type | Completeness as supplied | Proposed split |
|---|---|---|---|---|---|
| L01 | Philadelphia Fair Lease | yes (PDF) | model template | unclear; extraction may miss form fields | development |
| L02 | NYCHA PACT Residential Lease | **no** (404) | | | replaced in the holdout by H02 (archive copy) |
| L03 | HUD-90105-A Model Lease for Subsidized Programs | yes (PDF) | federal form | incomplete: 3 required attachments | development |
| L04 | HUD Housing Authority Sample Lease | **no** (404) | | | replaced in the holdout by H04 (archive copy) |
| L05 | UMass Sample Lease | **no** (403, no archive copy) | | | replaced in the holdout by H05 (a different university's sample lease) |
| L06 | Binghamton University Sample Lease | **no** (404) | | | replaced in the holdout by H06 (archive copy) |
| L07 | CU Boulder Graduate & Family Housing Lease 2026-27 | yes (PDF) | university template | incomplete: resident handbook | development |
| L08 | Maine AG Model Residential Lease (lease only) | yes (Word, derived text) | state model template | complete | development |
| L09 | Penn State Altoona Sample Lease | **no** (403) | | | replaced in the holdout by H09 (archive copy) |
| L10 | Ohio University Ecohouse Sample Lease | yes (web page, derived text) | partial excerpt | partial; application and code of conduct not supplied | development |

Every available document is a **template or sample, not an executed lease**.

The five unavailable sources were replaced under decision 1 (2026-11-11) and the replacements form the **real-lease holdout** in `evals/holdout/`, with their own manifest, records and lock. They are not in this folder's manifest, so `npm run eval:leases` can't run them. L02, L04, L06 and L09 were replaced by Internet Archive copies of the same URLs; L05 by a different university's sample lease, because UMass's file still returns 403 and has no archive copy. The owner still has to confirm the lock and the L05 substitute.

**Usage rights.** No document carries a licence statement. HUD-90105-A is a U.S. federal form. The rest are published by a state agency, a city initiative or universities for public reading. All are treated as internal-evaluation-only, kept locally and not redistributed. Their reuse terms have **not** been confirmed by anyone qualified to confirm them.

## What each measurement is, and isn't

| Measurement | Command | What it shows | What it doesn't |
|---|---|---|---|
| Component-level clause detection | `npm run eval` | The review stage on the synthetic gold set | Anything about leases, or what a signer sees |
| End-to-end scope enforcement | `npm run eval:gated` | Every gold-set (non-lease) document is stopped | Lease quality |
| End-to-end on real leases | `npm run eval:leases` | Scope false blocks, completeness blocks, and what the review returns on real lease text | Whether the flags are right (unlabelled) |
| Legal-question handling | `npm run eval:legal` | Q&A notes local-law questions, answers what the lease says, and returns no prose | Whether the quoted sentences are the best answer |
| Human-reviewed accuracy on real leases | `npx tsx evals/holdout/run.ts` (refuses until labels are frozen) | Recall, false flags and clean-lease false alarms on the holdout, against frozen adjudicated labels | Anything yet: not measured, no labels exist |
| Launch readiness | ticket 09 | Needs a locked, independently labelled set | |

## How the labels get made

1. **Two independent reviewers** label each document using `evals/reviewer-guide.md` (v2), each in their own private review file (`calibration/README.md` has the steps), with a pseudonymous `reviewerId`. Real identities and consent stay in private storage. Neither sees the other's file until both are done.
2. **Before seeing any model output.** Reviewers must not open `runs/` or run the product on a document before finishing it, and they confirm that with `completedBeforeSeeingModelOutput: true`.
3. For each sentence that matters, a reviewer records:
   - the exact quote, copied from `text/<id>.txt`
   - the risk category
   - the consequence and triggering condition
   - materiality
   - expected severity
   - whether Blueline should flag it
   - one sentence of rationale

   Clean, harmless and borderline sentences are recorded too, not only risks.
4. **Adjudication.** A third person compares the two reviews, resolves every disagreement, and writes the agreed items to `adjudication.resolvedItems`, marking which were disagreements.
5. `npx tsx evals/lease-corpus/validate.ts` checks every record:
   - quotes appear exactly once in the text
   - the two reviewers are different
   - both reviews were done before seeing output
   - adjudication isn't marked resolved early

## Development and holdout

- **Development: L01, L03, L07, L08, L10 and the synthetic gold set.** These may be used for tuning and repeat runs.
  - L01, L03 and L08 were each used while changing the product: L03 led to the conditional-attachment rule, and L08 to the Q&A legal-question fix.
  - L07 and L10 were holdout candidates, and moved to development on 2026-11-11 because decision 3 needs repeat runs on all five public templates (`.scratch/lease-review/coordination-2026-11-11.md`).
- **Holdout: H02, H04, H05, H06, H09** in `evals/holdout/`. Locked by the evaluation workstream before tuning; the owner's confirmation is pending. See `evals/holdout/README.md`.
- **Calibration batch:** L08 and part of L01, for reviewers to practise on before the holdout (`calibration/README.md`).

## Local-only files for reviewers

Worksheets, reviewers' own label files and adjudicated records quote the leases, so they live in `evals/lease-corpus/private/` (gitignored by `.gitignore` here). Whether adjudicated development labels are later copied into the committed `annotations/` records is the owner's call, because the repository is public. `validate.ts` checks `private/labels/` as well as `annotations/` when it exists.

`extract.ts --corpus evals/holdout` extracts the holdout from its own manifest into `evals/holdout/text/`.
