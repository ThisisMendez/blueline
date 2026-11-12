# Hand labels for ten flags

A page for labelling ten flags from the newest gold-set run by hand. The labels are the owner's. Nothing in this folder labels a flag, suggests a label or comments on one.

## Six-part batches

The same page also labels a judge batch with the six-part reviewer guide:

```sh
npm run label -- --batch evals/judge/batch-2
```

In that mode it records the guide's six verdicts, an overall PASS/FAIL and a rationale for each flag, plus a pseudonymous reviewer id. It shows the reviewer guide and the overall rule instead of the PRD sections, and saves to `<batch>/verdicts.json`. Once `<batch>/verdicts.lock.json` exists (`evals/judge/lock-verdicts.ts`), the page is read only and the server refuses saves. Nothing is pre-selected. `page.test.ts` checks both modes. See `evals/judge/README.md`.

## Open the page again

```sh
npm run label
```

The server prints the address, normally http://127.0.0.1:4317. If that port is taken it uses the next free one. Open the address in Chrome, Safari or Firefox. The page reloads whatever `labels.json` already holds, so you can close it and carry on later.

The server uses only Node's built-in modules and listens on 127.0.0.1, so it can't be reached from another machine. Stop it with Ctrl+C.

## Where the flags came from

`flags.json` holds ten flags from `evals/gold-set/runs/2026-11-10T19-09-14.532Z-ungated.json`, the newest run record: `npm run eval` on 2026-11-10, model `z-ai/glm-5.3-flash`. The run is **ungated**, so its documents skipped the completeness check. In the gated run, six of these documents are blocked before review.

The brief named `eval-runs/` and `eval/labels/`. This project keeps run records in `evals/gold-set/runs/` and evaluation code under `evals/`, and CLAUDE.md asks for a recorded reason before adding a new top-level directory. A second folder called `eval/` next to `evals/` would be easy to mix up, so this lives in `evals/labels/` and the script is `node evals/labels/server.mjs`.

## How the ten were picked

1. **Only flags a reader would be shown.** A flag was kept only if its quoted sentence appears in its document character for character. The run record marks this (`verbatimInDocument`), and the picking script checked it again against the document text. All 52 flags in the run passed.
2. **Flags that matched no planted clause come first,** including any on the three documents that should come back clean. The run record says which planted clause each flag matched, worked out the way the eval does: a verbatim quote whose span overlaps the planted sentence. 19 flags matched no planted clause.
3. **Then flags that matched a planted clause but named a different clause type.** There were none: Blueline's flags carry no clause type (`RiskFlag` in `src/features/analysis/types.ts`), so a flag can't name the wrong one.
4. **Then the most severe band, then the next one down.** Not reached, because group 2 already held more than ten.

The first two groups held 19 flags across 8 documents, more than ten, so ten were taken from as many documents as possible. Documents were taken in alphabetical order, one flag from each per pass, with the most severe flag first and ties broken by position in the document. The first pass took one flag from each of the 8 documents, and the second pass took two more from the first two documents, alphabetically, that still had flags left.

The ten are sorted by document and then by position, and numbered 1 to 10. Each one gives its document, clause type (always empty, see step 3), severity, the quoted sentence copied from the run record, and the paragraph around it copied from the document. The paragraph is the document line holding the sentence, since the gold-set documents keep one paragraph per line. The file doesn't say which group a flag came from or whether it matched a planted clause.

## The rule

PASS if the quoted sentence really is the kind of clause the flag names and really costs the reader something. Otherwise FAIL.

Blueline's flags name no clause type, so the page says "None named" in that field. Read the first half of the rule against the PRD sections shown at the top of the page: "What good looks like" and "My red lines", which the server reads from PRD.md word for word each time the page loads.

## What gets saved

`labels.json` is rewritten every time a label, a note or the closing reflection changes. For each flag it keeps:

- the current label, note and time
- `history`: every earlier label with its note, when it was given and when it was changed

Each history entry counts as one change of mind. The page also keeps a copy in the browser's local storage. If the server stops, the page says so and offers a button that copies the labels to the clipboard. When the server comes back, the browser's copy is saved to `labels.json`.

Once all ten flags have a label and a note, the page shows a line to paste into the chat, such as "7 PASS, 3 FAIL, changed my mind once".
