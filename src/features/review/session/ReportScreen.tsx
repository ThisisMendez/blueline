"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import type { AnalysisOutcome } from "@/features/analysis/types";
import { RetentionControls } from "@/features/library/RetentionControls";
import { scoreFromOutcome } from "@/features/score";
import { FeedbackLink } from "@/features/site/FeedbackLink";

import { ReferenceLedger } from "../components/ReferenceLedger";
import { ReviewResult } from "../components/ReviewResult";
import { DEFAULT_REVIEW_TITLE } from "../title";

import { useReviewSession } from "./ReviewSessionProvider";
import { StartAgain } from "./StartAgain";
import { useReportActions } from "./useReportActions";
import type { ReviewSessionActions, ReviewSessionState } from "./store";

const SECONDARY =
  "inline-flex min-h-11 items-center justify-center border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-5 py-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-navy)] transition-colors hover:bg-[var(--color-paper-deep)] disabled:opacity-60";

/**
 * The report for the review this tab just ran, read from the in-memory
 * session. A refresh empties the session, and then this page says so and
 * offers a fresh start rather than running the review again.
 */
export function ReportScreen() {
  const { state, actions } = useReviewSession();
  const outcome = state.outcome;

  // A re-check from this page has just started and the processing page is
  // on its way in.
  if (state.status === "processing") {
    return (
      <p role="status" className="font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)]">
        Checking the packet again…
      </p>
    );
  }

  if (state.status !== "reviewed" || outcome?.status !== "reviewed") {
    return <StartAgain />;
  }

  return <CompletedReport state={state} actions={actions} outcome={outcome} />;
}

function CompletedReport({ state, actions, outcome }: {
  readonly state: ReviewSessionState;
  readonly actions: ReviewSessionActions;
  readonly outcome: Extract<AnalysisOutcome, { status: "reviewed" }>;
}) {
  const router = useRouter();
  const token = outcome.continuation;
  const { wording, requestDraft, pendingAction, error, busy, run, cancel } = useReportActions(token);
  const signInPrompt = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pendingAction) signInPrompt.current?.focus();
  }, [pendingAction]);

  function recheck() {
    void actions.start();
    router.push("/review/processing");
  }

  function reviewAnother() {
    actions.reset();
    router.push("/review");
  }

  const role = outcome.review.role ?? state.role;

  return (
    <div className="flex flex-col gap-8">
      {pendingAction ? (
        <div
          ref={signInPrompt}
          tabIndex={-1}
          className="space-y-3 border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-4"
        >
          <h2 className="text-lg font-bold">
            {pendingAction === "save" ? "Sign in to save this review" : "Sign in to use drafting tools"}
          </h2>
          <p className="text-sm">Sign in or create an account in a new tab. Keep this report open, then come back here to continue.</p>
          <div className="flex flex-wrap gap-2">
            <a href="/sign-in" target="_blank" rel="noopener noreferrer" className={SECONDARY}>Open sign-in in a new tab</a>
            <button type="button" className={SECONDARY} disabled={busy} onClick={() => void run(pendingAction)}>
              Continue after sign-in
            </button>
            <button type="button" className={SECONDARY} disabled={busy} onClick={cancel}>Keep reading</button>
          </div>
        </div>
      ) : null}
      {error ? <p role="alert" className="text-sm">{error}</p> : null}
      <ReviewResult
        review={outcome.review}
        documents={outcome.documents}
        reviewId={outcome.reviewId}
        title={state.title ?? DEFAULT_REVIEW_TITLE}
        role={role}
        score={scoreFromOutcome(outcome)}
        requestDraft={token ? requestDraft : undefined}
        wording={wording}
        draftableFlagIds={outcome.draftableFlagIds}
        notices={
          <>
            {outcome.continuationUnavailable ? (
              <p className="text-sm">This report is too large to save or draft from this tab. You can still read it below.</p>
            ) : null}
            {outcome.persistenceFailed ? (
              <p role="alert" className="max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)]">
                {token ? "This review wasn't saved to your library. You can try saving it again." :
                  "This review wasn't saved to your library. You can read it here or run it again to save it."}
              </p>
            ) : null}
            {outcome.reviewId && outcome.retention ? (
              <RetentionControls reviewId={outcome.reviewId} retention={outcome.retention} />
            ) : null}
            {token ? (
              <div>
                <button type="button" className={SECONDARY} disabled={busy} onClick={() => void run("save")}>
                  Save this review
                </button>
              </div>
            ) : null}
          </>
        }
      />

      {outcome.completeness.matches.length > 0 ? (
        <section aria-labelledby="reference-ledger-heading" className="flex flex-col gap-3 border-t-2 border-[var(--color-navy)] pt-6">
          <div>
            <h2
              id="reference-ledger-heading"
              className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)]"
            >
              What your lease points at
            </h2>
            <p className="mt-1 max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
              We matched these by their titles and opening lines, which can
              be wrong. If one is, change it and check the packet again.
            </p>
          </div>
          <ReferenceLedger
            completeness={outcome.completeness}
            documents={outcome.documents}
            choices={state.resolutions}
            onChoose={actions.choose}
            busy={false}
          />
          <button type="button" onClick={recheck} className={`self-start ${SECONDARY}`}>
            Check the packet again
          </button>
        </section>
      ) : null}

      <div>
        <button type="button" onClick={reviewAnother} className={SECONDARY}>
          Review another lease
        </button>
      </div>
      <div><FeedbackLink source="report" role={role ?? undefined} /></div>
    </div>
  );
}
