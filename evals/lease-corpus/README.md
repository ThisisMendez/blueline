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
| L02 | NYCHA PACT Residential Lease | **no** (404) | | | replacement needs approval |
| L03 | HUD-90105-A Model Lease for Subsidized Programs | yes (PDF) | federal form | incomplete: 3 required attachments | development |
| L04 | HUD Housing Authority Sample Lease | **no** (404) | | | replacement needs approval |
| L05 | UMass Sample Lease | **no** (403, no archive copy) | | | replacement needs approval |
| L06 | Binghamton University Sample Lease | **no** (404) | | | replacement needs approval |
| L07 | CU Boulder Graduate & Family Housing Lease 2026-27 | yes (PDF) | university template | incomplete: resident handbook | holdout candidate |
| L08 | Maine AG Model Residential Lease (lease only) | yes (Word, derived text) | state model template | complete | development |
| L09 | Penn State Altoona Sample Lease | **no** (403) | | | replacement needs approval |
| L10 | Ohio University Ecohouse Sample Lease | yes (web page, derived text) | partial excerpt | partial; application and code of conduct not supplied | holdout candidate |

Every available document is a **template or sample, not an executed lease**. Internet Archive copies exist for L02, L04, L06 and L09 at the same URLs. They are proposed replacements and were not used: the owner decides. L05 needs a manual download or a different source.

**Usage rights.** No document carries a licence statement. HUD-90105-A is a U.S. federal form. The rest are published by a state agency, a city initiative or universities for public reading. All are treated as internal-evaluation-only, kept locally and not redistributed. Their reuse terms have **not** been confirmed by anyone qualified to confirm them.

## What each measurement is, and isn't

| Measurement | Command | What it shows | What it doesn't |
|---|---|---|---|
| Component-level clause detection | `npm run eval` | The review stage on the synthetic gold set | Anything about leases, or what a signer sees |
| End-to-end scope enforcement | `npm run eval:gated` | Every gold-set (non-lease) document is stopped | Lease quality |
| End-to-end on real leases | `npm run eval:leases` | Scope false blocks, completeness blocks, and what the review returns on real lease text | Whether the flags are right (unlabelled) |
| Legal-question handling | `npm run eval:legal` | Q&A notes local-law questions, answers what the lease says, and returns no prose | Whether the quoted sentences are the best answer |
| Human-reviewed accuracy | not built yet | Needs adjudicated labels from this corpus | |
| Launch readiness | ticket 09 | Needs a locked, independently labelled set | |

## How the labels get made

1. **Two independent reviewers** label each document using `evals/reviewer-guide.md` (v2). Each fills their own `reviews` slot in `annotations/<id>.json`, with a pseudonymous `reviewerId`; real identities and consent stay in private storage.
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

- **Development (L01, L03, L08):** each was used while changing the product. L03 led to the conditional-attachment rule and L08 to the Q&A legal-question fix, so they can't be held out.
- **Holdout candidates (L07, L10):** only their scope and completeness results have been seen; no change was based on them. An unseen replacement for any unavailable source would also be a holdout candidate.
- A holdout set is **locked** by someone outside prompt work, who sets `proposedSplit` to `holdout-locked` and keeps the labels away from whoever edits prompts. After that, nobody tunes the product against those documents.
