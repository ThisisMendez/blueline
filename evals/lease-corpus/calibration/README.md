# Calibration batch for lease reviewers

Before anyone labels the holdout, two reviewers label a small batch of development leases on their own, and an adjudicator settles where they differ. The point is to find out where `evals/reviewer-guide.md` is unclear while the stakes are low. Nothing in this folder is a label, and no label may come from a model (ADR 0012).

The batch is in `batch.json`:

- **L08** (Maine AG model lease), the whole document.
- **L01** (Philadelphia Fair Lease), characters 0 to 2225 only: the first 49 lines of the extracted text. The extraction scrambles the form's columns, so this part also tests labelling text that reads out of order.

Both are development documents. No holdout document is in the batch, and `evals/holdout/holdout.test.ts` fails if one is added.

## Roles

| Role | Who | Sees |
|---|---|---|
| Reviewer 1, reviewer 2 | Two people, each with a pseudonymous id (`R1`, `R2`, …) | The lease text, the reviewer guide, their own worksheet and review file |
| Adjudicator | A third person who didn't review the batch | Both reviews, the text, the guide |
| Owner | Recruits the three, keeps real names and consent records outside the repository | Everything, after adjudication |

Real names never go in the repository; the mapping from id to person stays in private storage.

## Instructions for each reviewer

1. **Don't look at what Blueline says about these leases.** Don't open `evals/lease-corpus/runs/`, `evals/holdout/runs/`, `evals/judge/`, any gold-set run, or the app with these leases pasted in, until the adjudicator says the batch is closed. If you see Blueline output for one of these documents by accident, say so; your review of that document is set aside.
2. **Don't talk to the other reviewer about the batch** until both reviews are in.
3. Read `evals/reviewer-guide.md` (v2) in full. Then make your worksheets:

   ```sh
   npx tsx evals/lease-corpus/extract.ts        # once, if evals/lease-corpus/text/ is empty
   npx tsx evals/lease-corpus/calibration/worksheet.ts --reviewer R1
   ```

   This writes `evals/lease-corpus/private/worksheets/R1/<id>.md` (every line and sentence with its character offsets) and an empty `evals/lease-corpus/private/reviews/R1/<id>.json`. Both are gitignored because they quote the lease. If the script says your text doesn't match the recorded hash, stop and tell the adjudicator: you'd be labelling different bytes.
4. Read the whole document (or the whole range, for L01) before recording anything.
5. In your review file, add one item per sentence that matters, using the template below. Record risks, and also clearly ordinary, harmless-but-unusual and borderline sentences you considered. For L01, label only sentences that start inside the range.
6. Copy each `quotedSentence` from `evals/lease-corpus/text/<id>.txt` exactly, character for character. If the same words appear twice, quote a longer span so it's unique.
7. When you're done, set `completedOn` to the date and `completedBeforeSeeingModelOutput` to `true` only if it's true. Tell the adjudicator.

### Label-entry template

This is the `annotationItemSchema` in `evals/lease-corpus/annotation.ts`, the same item the annotation records use. Angle brackets are placeholders to replace, never values to keep.

```json
{
  "itemId": "<R1-01, R1-02, …>",
  "quotedSentence": "<copied exactly from text/<id>.txt>",
  "expectedRiskCategory": "<deposit | early-exit | dispute-rights | auto-renewal | rent-change | other | none>",
  "consequence": "<what the clause does to the tenant, in the clause's own figures>",
  "triggeringCondition": "<the event that sets it off>",
  "materiality": "<material | ordinary | harmless-oddity | borderline>",
  "expectedSeverity": "<high | medium | low, or null when not material>",
  "reviewerDecision": "<flag | do-not-flag>",
  "rationale": "<one sentence>"
}
```

## Adjudication procedure

1. Wait until both reviewers say they've finished. Check each review file: reviewer id set, `completedBeforeSeeingModelOutput: true`, a date.
2. Line the two reviews up by quoted span. Two items are about the same sentence when their quotes overlap in the text.
3. For each sentence either reviewer recorded, compare `reviewerDecision`, `materiality`, `expectedSeverity` and `expectedRiskCategory`:
   - **Same decision, materiality and severity:** take it as agreed (`disagreement: false`). Tidy the wording of consequence and rationale if you like; don't change the verdicts.
   - **Anything differs, or only one reviewer recorded it:** decide using the guide, write the agreed item with `disagreement: true`, and add a line to `adjudication.notes` saying what differed and why you chose as you did.
   - **The guide doesn't settle it:** record your decision anyway, mark it `disagreement: true`, and add the question to the list for the owner (step 6). Don't change the guide yourself.
4. Write the record to `evals/lease-corpus/private/labels/<id>.json`: a copy of `annotations/<id>.json` with the two reviews in `reviews` (reviewer 1 first) and your items in `adjudication.resolvedItems`, `adjudicatorId` set and `status: "resolved"`.
5. Check it: `npx tsx evals/lease-corpus/validate.ts`. It checks quotes are exact and unique, the reviewers differ, both reviewed before seeing output, and adjudication wasn't resolved early.
6. Send the owner:
   - the agreement count per document (items agreed / items recorded by either reviewer)
   - each place the guide was unclear, with the sentence id from the worksheet, not the quote

   The owner decides whether the guide changes before holdout labelling starts.

Whether adjudicated development labels are later copied into the committed `annotations/` records is the owner's call: they quote third-party lease text and the repository is public.

## After calibration: the holdout

The holdout (`evals/holdout/`) is labelled the same way, by reviewers who haven't seen Blueline output for those documents, with everything kept in `evals/holdout/private/`:

```sh
npx tsx evals/lease-corpus/calibration/worksheet.ts --reviewer R1 --corpus evals/holdout --documents H02-nycha-pact-lease,H04-hud-ha-sample-lease,H05-puget-sound-sample-lease,H06-binghamton-sample-lease,H09-penn-state-altoona-sample-lease
```

Adjudicated holdout records go to `evals/holdout/private/labels/<id>.json`, then `npx tsx evals/holdout/freeze.ts` freezes them. See `evals/holdout/README.md`.
