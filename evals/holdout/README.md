# Real-lease holdout (decision 1, ticket 17)

Five public residential leases held out for one purpose: measuring Blueline on real lease language against labels made by people, after the product is tuned. **Real-lease performance is not measured yet.** Nobody has labelled these documents, and no product, judge or model has been run on them.

The gold set stays. It's synthetic and has no leases, so it can't stand in for this, and this can't replace its regression role.

## Rules

- **Off limits to prompt and completeness work.** Only the evaluation workstream may download, read or run these documents, and only to lock membership and versions, prepare reviewer materials, freeze labels and, once labels are frozen, score. Don't copy their text, or anything said about it, into prompts, fixtures, tickets or chat with people tuning the product.
- **No model output before frozen labels.** `run.ts` refuses until adjudicated labels are frozen and their hash matches the committed seal. Nothing else in the repository runs on this folder: `npm run eval:leases` reads `evals/lease-corpus/manifest.json`, and these documents aren't in it.
- **Local only.** `sources/`, `text/`, `private/` and `runs/` are gitignored (`.gitignore` here). The repository is public; these are third-party documents, and the labels quote them.

## The five documents

They replace the unavailable L02, L04, L05, L06 and L09. They get new ids (`H…`) so the old intake records stay as they were, marked unavailable, and so no development list can pick up a holdout document by accident.

| ID | Replaces | Source | Version | Kind | Completeness as supplied (read by us, not the product) |
|---|---|---|---|---|---|
| H02 | L02 | NYCHA PACT lease, nyc.gov | Internet Archive 2025-12-07 | public agency sample lease, subsidised (PACT/Section 8), NYC | incomplete: riders and house rules not supplied |
| H04 | L04 | HUD housing authority sample lease, hud.gov | Internet Archive 2024-10-02 | federal sample public housing lease, Parts I and II | incomplete: listed attachments not supplied |
| H05 | L05 | University of Puget Sound sample off-campus lease | live file, Last-Modified 2021-12-01, identical to Internet Archive 2022-04-23 | university sample lease, private landlord, Washington | unclear: parts are guidance rather than terms |
| H06 | L06 | Binghamton University sample lease, binghamton.edu | Internet Archive 2024-07-18 | university sample lease, private landlord, New York | complete |
| H09 | L09 | Penn State Altoona sample lease (web page) | Internet Archive 2026-02-10 | university sample lease, private landlord, Pennsylvania | incomplete: move-in checklist not supplied; derived text |

All five are unexecuted templates, not signed leases. Hashes, URLs and the exact snapshot timestamps are in `manifest.json`, `lock.json` and `annotations/`.

For the four archived sources, the raw file came from the snapshot's `id_` URL (`http://web.archive.org/web/<timestamp>id_/<url>`), so the archive adds nothing to the bytes.

### Why H05 isn't the UMass lease

UMass Amherst's Off Campus Student Center still links its sample lease, and its two other sample agreements, from a CDN that returns 403 to any client. The Internet Archive has no copy. H05 is a different document of the same kind: a university off-campus student services office's sample lease for a private landlord renting to students. It's the owner's call whether that's an acceptable substitute.

Candidates considered and rejected:

| Candidate | Why not |
|---|---|
| UMass sample lease, short-term lease, month-to-month agreement | 403 from the CDN, no archive copy |
| Virginia Tech DC sample lease | Same CDN, 403 |
| Greater Boston Real Estate Board standard form, hosted on an MIT student page | Its copyright notice forbids copying without the board's consent; also from 2003 |
| University of Pittsburgh sample lease | 404 |
| Kutztown University sample lease | Inline web page in the same template family as H06 and H09; a third member would add little |

### Duplicate check

`npx tsx evals/holdout/check-duplicates.ts` compares each document with the five development leases, the nine gold-set texts and the other holdout documents. It counts a duplicate on identical text, or when 50% or more of one document's eight-word runs appear in the other; 10% or more is reported as related. The thresholds were set before running it.

No duplicates. The highest overlap is H06 with H09, at 8.4% and 7.3%: both university sample leases share some stock sentences, below the "related" line. Nothing else passes 1.1%. None of the five appears in any tracked file in the repository, and none was used for prompt tuning: all five were fetched after the holdout exclusion list was written.

## The lock

`lock.json` records each document's id, version, original and text SHA-256, the date, and that the evaluation workstream locked it. **The owner hasn't confirmed it.** Until they do, `freeze.ts` refuses. Confirming means setting `ownerConfirmed` to `true` and `ownerConfirmedOn` to the date, in a commit by the owner.

`holdout.test.ts` fails when:

- a locked document's local text no longer matches its hash
- the manifest and the lock list different documents
- a holdout id, source URL or text hash appears in a development list: the lease-corpus manifest and annotations, the gold-set manifest, the calibration batch, or any judge batch

## Labelling, adjudication, freezing

1. Reviewers calibrate first on development documents (`evals/lease-corpus/calibration/README.md`).
2. Two reviewers label each holdout document independently, before seeing any Blueline output for it, using `evals/reviewer-guide.md` and worksheets made with `worksheet.ts --corpus evals/holdout`.
3. An adjudicator resolves every difference and writes `private/labels/<id>.json` (an annotation record with both reviews and the resolved items). `npx tsx evals/lease-corpus/validate.ts --corpus evals/holdout` checks it.
4. `npx tsx evals/holdout/freeze.ts` runs only when every document is adjudicated, every quote checks out, the text matches the lock and the owner has confirmed the lock. It writes `private/frozen-labels.json` (read-only, private) and `frozen-labels.seal.json` (the hash, committed). It refuses to run a second time. Any later edit breaks the hash, and scoring refuses.

The committed records in `annotations/` stay label-free: the test checks that.

## Scoring

`npx tsx evals/holdout/run.ts` runs the product, gated as a signer is served, on the five documents one at a time, then scores the run against the frozen labels. It refuses unless the lock is intact and the frozen labels match the seal. **It hasn't been run.**

It reports, each as count/count and a percentage:

- **Real-lease recall:** adjudicated risks found / adjudicated risks.
- **False flags among emitted flags:** adjudicated false flags / emitted flags.
- **Clean-lease false alarms:** adjudicated clean leases with a false flag / adjudicated clean leases.

Definitions, fixed before any scoring:

- An **adjudicated risk** is a resolved item with `reviewerDecision: "flag"`, whatever its materiality. A borderline item the adjudicator decided to flag counts.
- A flag **finds** a risk when its quote is verbatim in the reviewed text and its span overlaps the risk's sentence in the same document. This is the rule `evals/gold-set/score.ts` uses.
- A **false flag** is an emitted flag that overlaps no adjudicated risk. That covers:
  - a flag on a sentence the adjudicator marked `do-not-flag` (ordinary, harmless oddity, or borderline and not flagged)
  - a flag on a sentence nobody labelled, because reviewers record every risk they see
  - a flag whose quote doesn't check out

  The report breaks false flags down by those three kinds.
- A **clean lease** is an adjudicated document with no risks. A clean lease with any emitted flag is a false alarm.
- Only **reviewed** documents count in the three rates, as in the gold set. A document that's blocked, out of scope, unverified, failed or rate-limited is listed with the number of adjudicated risks it carries, so a block can't hide a miss. Rate-limited documents are retried, then counted separately and never as model-unreadable.

Several holdout documents are incomplete as supplied, so the product may block them. If it does, the recall denominator shrinks, and the report lists each blocked document and the risks it holds.

## Files

| File | What it is |
|---|---|
| `manifest.json` | Sources, versions, extraction method |
| `annotations/*.json` | One intake record per document: metadata and empty review slots |
| `lock.json`, `lock.ts` | The lock and its checks |
| `duplicates.ts`, `check-duplicates.ts` | The duplicate check |
| `freeze.ts` | Freezes adjudicated labels |
| `score.ts` | The scorer (pure) |
| `run.ts` | The guarded runner |
| `files.ts` | Paths and the development lists |
| `holdout.test.ts` | Lock, freeze, scorer and runner tests (synthetic data except the lock) |
