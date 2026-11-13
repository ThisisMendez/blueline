# Intake to report handoff

For the agent that owns report rendering (`ReviewResult.tsx`, `RiskFlagCard.tsx`, `RiskFlagList.tsx`, `CoverageChecklistSection.tsx`, `src/app/(app)/review/[reviewId]/page.tsx`). None of those files were edited by the intake work.

## Routes

| Path | File | What it shows |
| --- | --- | --- |
| `/review` | `src/app/(app)/review/page.tsx` | Role choice (left), PDF controls (right), the send notice, and the signed-in library. |
| `/review/processing` | `src/app/(app)/review/processing/page.tsx` → `ProcessingScreen` | Progress while the one analysis request runs; the blocked, out-of-scope, unverified and failed states; a "Start again" screen when the tab has no session. |
| `/review/report` | `src/app/(app)/review/report/page.tsx` → `ReportScreen` | The report for a review that ran in this tab and was not saved. |
| `/review/[reviewId]` | report agent's | Saved review. The processing page `router.replace`s here when `outcome.persisted && outcome.reviewId`. |

Nothing about a review is put in the URL, `localStorage`, `sessionStorage` or IndexedDB. A refresh on `/review/processing` or `/review/report` shows "This tab doesn't have a review open" with a "Start again" button.

## Session API

`src/features/review/session/`

- `ReviewSessionProvider` (client) is mounted once in `src/app/(app)/layout.tsx` around `children`, so it survives navigation between the three review routes and is lost on refresh. It takes an optional `store` prop for tests.
- `useReviewSession(): { state: ReviewSessionState; actions: ReviewSessionActions }` reads through `useSyncExternalStore`.
- `createReviewSessionStore({ fetch? })` is the framework-free store behind it.

```ts
type ReviewSessionStatus = "idle" | "processing" | "reviewed" | "blocked" | "out-of-scope" | "failed";

interface SessionDocument extends ExtractedDocument {
  kind: "lease" | "supporting";
  fileName: string;   // the chosen file's name; the file itself is never kept
  pageCount: number;
}

interface ReviewSessionState {
  status: ReviewSessionStatus;
  role: ReviewRole | null;
  documents: readonly SessionDocument[]; // lease first
  title: string | null;                  // display title, from src/features/review/title.ts
  resolutions: Readonly<Record<string, string | null>>; // reference id -> server document id
  outcome?: Extract<AnalysisOutcome, { status: "reviewed" | "blocked" | "out-of-scope" | "unverified" }>;
  error?: string;                        // plain-English message when status is "failed"
}

interface ReviewSessionActions {
  chooseRole(role): void;
  setLease(doc): void; addSupporting(doc): void; removeDocument(id): void;
  choose(referenceId, documentId | null): void;
  start(): Promise<void>;   // in-flight guard: a second call returns the running promise
  retry(): Promise<void>;   // only from "failed"; same packet
  returnToIntake(): void;   // status -> idle, keeps role, documents, title
  reset(): void;            // forgets everything; a late answer from an earlier run is ignored
}
```

`status: "out-of-scope"` covers both the `out-of-scope` and `unverified` analysis outcomes. Check `outcome.status` to tell them apart.

Helpers: `leaseOf(state)`, `supportingOf(state)`, `analysisRequestBody(state)`, `reportPathFor(state)` (in `ProcessingScreen.tsx`).

## What `/review/report` passes today

`ReportScreen` renders, in order:

1. Its own header: eyebrow `Your report · Reviewed as a renter|a landlord` (from `outcome.review.role ?? state.role`) and an `h1` with `state.title`.
2. A `role="alert"` paragraph when `outcome.persistenceFailed`.
3. "What your lease points at", with `ReferenceLedger` and "Check the packet again" (only when `outcome.completeness.matches.length > 0`).
4. `<ReviewResult review={outcome.review} documents={outcome.documents} reviewId={outcome.reviewId} />`. These are the props `ReviewResult` takes now. `title` and `role` are not passed because `ReviewResult` doesn't accept them.
5. `RetentionControls` when `outcome.reviewId && outcome.retention` (rare here, because kept reviews go to `/review/[reviewId]`).
6. "Review another lease", which runs `reset()` and goes to `/review`.

If `ReviewResult` gains `title` / `role` props, swap step 1 for them and pass `state.title` and `outcome.review.role ?? state.role`.

## Titles

- `generateReviewTitle({ text, fileName })` in `src/features/review/title.ts`: a lease-type heading from the text, then a readable file name without `.pdf`, then "Residential lease". It never puts an email, phone number, street address or long number into a title.
- The lease document's `title` sent to `/api/analysis` is this generated title, so citations read "Residential Lease Agreement, characters x to y".
- `StoredReview.title` and `StoredReviewSummary.title` are now the display title: the signer's rename, else the title generated on create, else (legacy rows) the lease's document title. The saved page currently shows `stored.documents[0]?.title`; switch it to `stored.title` so renames show there too.

## Open items for the report agent

- The saved review page doesn't show the reference ledger, because completeness isn't stored. Signed-in reviews that are kept land there, so they no longer see "What your lease points at". Decide whether that matters.
- Use `stored.title` as the saved page heading (above).
- Tests that render `SavedReviewPage` after a flow now go through `renderReviewFlow(..., { savedReview })` in `src/features/review/session/testing.tsx`.
