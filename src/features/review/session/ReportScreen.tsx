"use client";

import { useRouter } from "next/navigation";

import { RetentionControls } from "@/features/library/RetentionControls";

import { ReferenceLedger } from "../components/ReferenceLedger";
import { ReviewResult } from "../components/ReviewResult";
import { DEFAULT_REVIEW_TITLE } from "../title";

import { useReviewSession } from "./ReviewSessionProvider";
import { StartAgain } from "./StartAgain";

const SECONDARY =
  "inline-flex min-h-11 items-center justify-center border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-5 py-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-navy)] transition-colors hover:bg-[var(--color-paper-deep)] disabled:opacity-60";

/**
 * The report for the review this tab just ran, read from the in-memory
 * session. A refresh empties the session, and then this page says so and
 * offers a fresh start rather than running the review again.
 */
export function ReportScreen() {
  const router = useRouter();
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
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]">
          Your report{role ? ` · Reviewed as ${role === "renter" ? "a renter" : "a landlord"}` : ""}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-3xl [overflow-wrap:anywhere]">
          {state.title ?? DEFAULT_REVIEW_TITLE}
        </h1>
      </div>

      {outcome.persistenceFailed ? (
        <p role="alert" className="max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)]">
          This review wasn&apos;t saved to your library. You can read it in
          this tab, but you&apos;ll need to run it again to save it.
        </p>
      ) : null}

      {outcome.completeness.matches.length > 0 ? (
        <section aria-labelledby="reference-ledger-heading" className="flex flex-col gap-5">
          <div>
            <h2
              id="reference-ledger-heading"
              className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)]"
            >
              What your lease points at
            </h2>
            <p className="mt-3 max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
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

      <ReviewResult review={outcome.review} documents={outcome.documents} reviewId={outcome.reviewId} />

      {outcome.reviewId && outcome.retention ? (
        <RetentionControls reviewId={outcome.reviewId} retention={outcome.retention} />
      ) : null}

      <div>
        <button type="button" onClick={reviewAnother} className={SECONDARY}>
          Review another lease
        </button>
      </div>
    </div>
  );
}
