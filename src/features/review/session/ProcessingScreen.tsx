"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { SCORE_VERSION, UNAVAILABLE_EXPLANATIONS, scoreFromOutcome } from "@/features/score";

import { BlockedPacket } from "../components/BlockedPacket";
import { ScorePanel } from "../components/report/ScorePanel";
import { StoppedPacket } from "../components/StoppedPacket";

import { useReviewSession } from "./ReviewSessionProvider";
import { StartAgain } from "./StartAgain";
import { leaseOf, supportingOf, type ReviewSessionState } from "./store";

const PRIMARY =
  "inline-flex min-h-11 items-center justify-center bg-[var(--color-navy)] px-6 py-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-paper)] transition-colors hover:bg-[var(--color-navy-ink)] disabled:opacity-60";
const SECONDARY =
  "inline-flex min-h-11 items-center justify-center border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-5 py-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-navy)] transition-colors hover:bg-[var(--color-paper-deep)] disabled:opacity-60";

/** Where a finished review is read: its saved page when it was kept, this tab otherwise. */
export function reportPathFor(state: ReviewSessionState): string | null {
  const outcome = state.outcome;
  if (state.status !== "reviewed" || outcome?.status !== "reviewed") return null;
  return outcome.persisted && outcome.reviewId ? `/review/${outcome.reviewId}` : "/review/report";
}

function pages(count: number): string {
  return count === 1 ? "1 page" : `${count} pages`;
}

/**
 * The wait between "Read my lease" and the report.
 *
 * Only what this tab can actually see is shown as a step. The PDFs were read
 * here before sending, so that step is done. Checking the packet, reading the
 * lease and matching each quote all happen on the server inside one request,
 * so they are described together as one step rather than ticked off on a
 * timer.
 *
 * Nothing on this page starts a review. Arriving here by refresh, back or a
 * typed URL can't send the documents again.
 */
export function ProcessingScreen() {
  const router = useRouter();
  const { state, actions } = useReviewSession();
  const heading = useRef<HTMLHeadingElement>(null);
  const destination = reportPathFor(state);

  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);

  useEffect(() => {
    if (state.status === "failed") heading.current?.focus();
  }, [state.status]);

  function backToIntake() {
    actions.returnToIntake();
    router.push("/review");
  }

  const lease = leaseOf(state);

  if (state.status === "idle" || !lease || !state.role) {
    return <StartAgain />;
  }

  if (state.status === "blocked" && state.outcome?.status === "blocked") {
    return (
      <div className="flex flex-col gap-5">
        <BlockedPacket
          key={state.outcome.completeness.missing.map((reference) => reference.id).join("|")}
          completeness={state.outcome.completeness}
          documents={state.outcome.documents}
          choices={state.resolutions}
          onChoose={actions.choose}
          onRecheck={() => void actions.start()}
          onAddDocument={backToIntake}
          busy={false}
        />
        <ScorePanel score={scoreFromOutcome(state.outcome)} />
      </div>
    );
  }

  if (
    state.status === "out-of-scope" &&
    (state.outcome?.status === "out-of-scope" || state.outcome?.status === "unverified")
  ) {
    return (
      <div className="flex flex-col gap-5">
        <StoppedPacket
          completeness={state.outcome.completeness}
          actions={
            <>
              {state.outcome.status === "unverified" ? (
                <button type="button" className={PRIMARY} onClick={() => void actions.start()}>
                  Try again
                </button>
              ) : null}
              <button type="button" className={SECONDARY} onClick={backToIntake}>
                Change documents
              </button>
            </>
          }
        />
        <ScorePanel score={scoreFromOutcome(state.outcome)} />
      </div>
    );
  }

  if (state.status === "failed") {
    return (
      <section aria-labelledby="processing-heading" className="flex flex-col gap-5">
        <h1
          id="processing-heading"
          ref={heading}
          tabIndex={-1}
          className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-3xl"
        >
          We couldn&apos;t finish this review
        </h1>
        <p role="alert" className="max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
          {state.error}
        </p>
        <p className="max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
          Your side and your documents are still here.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={PRIMARY} onClick={() => void actions.retry()}>
            Try again
          </button>
          <button type="button" className={SECONDARY} onClick={backToIntake}>
            Change documents
          </button>
        </div>
        <ScorePanel
          score={{
            available: false,
            version: SCORE_VERSION,
            reason: "review-failed",
            explanation: UNAVAILABLE_EXPLANATIONS["review-failed"],
          }}
        />
      </section>
    );
  }

  const supporting = supportingOf(state);
  const read = [lease, ...supporting];
  const done = state.status === "reviewed";

  return (
    <section aria-labelledby="processing-heading" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]">
          {state.title ?? lease.title}
        </p>
        <h1
          id="processing-heading"
          className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-3xl"
        >
          Reading your agreement
        </h1>
        <p className="max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
          You don&apos;t have to do anything while we read your agreement. Keep this tab open.
        </p>
      </div>

      <ol aria-label="Progress" className="flex list-none flex-col gap-0 border-2 border-[var(--color-navy)] p-0">
        <li className="flex flex-col gap-1 border-b-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-5 py-4">
          <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]">
            Done
          </p>
          <p className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-navy-ink)]">
            Read {read.length === 1 ? "1 PDF" : `${read.length} PDFs`} in your browser
          </p>
          <p className="font-[family-name:var(--font-data)] text-xs text-[var(--color-navy)] [overflow-wrap:anywhere]">
            {read.map((document) => `${document.fileName} (${pages(document.pageCount)})`).join(", ")}
          </p>
        </li>
        <li
          aria-current={done ? undefined : "step"}
          className="flex flex-col gap-1 border-b-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] px-5 py-4"
        >
          <p role="status" className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]">
            {done ? "Done" : "Working"}
          </p>
          <p className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-navy-ink)]">
            Checking the packet and reading the lease
          </p>
          <p className="max-w-[var(--measure)] font-[family-name:var(--font-body)] text-sm leading-relaxed text-[var(--color-navy-ink)]">
            First we check that every document the lease mentions is here.
            Then we look for terms that could cost you as {state.role === "renter" ? "a renter" : "a landlord"} and
            check each quote against your text.
          </p>
        </li>
        <li aria-current={done ? "step" : undefined} className="flex flex-col gap-1 bg-[var(--color-paper)] px-5 py-4">
          <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]">
            {done ? "Opening" : "Next"}
          </p>
          <p className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-navy-ink)]">
            Your report
          </p>
        </li>
      </ol>
    </section>
  );
}
