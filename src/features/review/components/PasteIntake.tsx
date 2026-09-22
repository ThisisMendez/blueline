"use client";

import Link from "next/link";
import { useId, useState } from "react";

import type {
  AnalysisFailure,
  AnalysisOutcome,
  AnalysisRejection,
} from "@/features/analysis/types";
import type { ExtractedDocument } from "@/features/packet/types";
import type { GeneralReview } from "@/features/analysis/types";

import { ReviewResult } from "./ReviewResult";

const FAILURE_MESSAGE: Record<AnalysisFailure, string> = {
  "model-not-configured":
    "The reading service isn't set up on this deployment, so the review can't run.",
  "model-timeout": "The reading took too long and stopped. Try it again.",
  "model-rate-limited": "Too many reviews are running at once. Give it a minute and try again.",
  "model-unavailable": "The reading service didn't answer. Try it again in a moment.",
  "model-unreadable": "The answer came back garbled, so there was nothing worth showing you.",
};

const REJECTION_MESSAGE: Record<AnalysisRejection, string> = {
  "malformed-request": "That didn't send properly. Try again.",
  "empty-text": "There's nothing in the box yet. Paste your lease and send it again.",
  "not-signed-in": "Your sign-in has run out. Sign in again, then send the text once more.",
};

type Phase =
  | { readonly kind: "idle" }
  | { readonly kind: "working" }
  | {
      readonly kind: "reviewed";
      readonly review: GeneralReview;
      readonly documents: readonly ExtractedDocument[];
      readonly reviewId: string | null;
    }
  | { readonly kind: "problem"; readonly message: string };

export interface PasteIntakeProps {
  /** True when a finished review is kept in the signer's library. */
  readonly persists: boolean;
}

/**
 * Paste, send, read. The one intake surface in the product until ticket 02
 * adds selectable-text PDFs beside it.
 *
 * There is no file input here and none in the route behind it. The product
 * does not hold original documents, which is easier to keep true when there
 * is nowhere to put one.
 */
export function PasteIntake({ persists }: PasteIntakeProps) {
  const textareaId = useId();
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (text.trim().length === 0) {
      setPhase({ kind: "problem", message: REJECTION_MESSAGE["empty-text"] });
      return;
    }

    setPhase({ kind: "working" });

    let outcome: AnalysisOutcome;
    try {
      const response = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      outcome = (await response.json()) as AnalysisOutcome;
    } catch {
      setPhase({
        kind: "problem",
        message: "The review didn't reach us. Check your connection and send it again.",
      });
      return;
    }

    if (outcome.status === "reviewed") {
      setPhase({
        kind: "reviewed",
        review: outcome.review,
        documents: outcome.documents,
        reviewId: outcome.reviewId,
      });
      return;
    }

    setPhase({
      kind: "problem",
      message:
        outcome.status === "rejected"
          ? REJECTION_MESSAGE[outcome.reason]
          : FAILURE_MESSAGE[outcome.reason],
    });
  }

  const working = phase.kind === "working";

  return (
    <div className="flex flex-col gap-10">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label
          htmlFor={textareaId}
          className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]"
        >
          Paste your lease
        </label>
        <p className="max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
          All of it, start to finish. Anything you leave out is something we
          cannot read for you.
        </p>
        <textarea
          id={textareaId}
          name="text"
          rows={14}
          value={text}
          onChange={(event) => setText(event.target.value)}
          spellCheck={false}
          className="w-full border-2 border-[var(--color-navy)] bg-[var(--color-paper)] p-4 font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]"
        />
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={working}
            className="inline-flex items-center justify-center bg-[var(--color-navy)] px-6 py-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-paper)] transition-colors hover:bg-[var(--color-navy-ink)] disabled:opacity-70"
          >
            {working ? "Reading your lease" : "Read my lease"}
          </button>
          <p className="font-[family-name:var(--font-data)] text-xs uppercase tracking-wide text-[var(--color-navy)]">
            {persists ? "Kept in your library" : "Not kept anywhere"}
          </p>
        </div>
      </form>

      <div aria-live="polite" className="flex flex-col gap-10">
        {working ? (
          <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)]">
            Reading the text and checking every quotation against it. This
            takes a minute or so.
          </p>
        ) : null}

        {phase.kind === "problem" ? (
          <p className="border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] px-5 py-4 font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)]">
            {phase.message}
          </p>
        ) : null}

        {phase.kind === "reviewed" ? (
          <>
            <ReviewResult review={phase.review} documents={phase.documents} />
            {phase.reviewId ? (
              <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]">
                <Link
                  href={`/review/${phase.reviewId}`}
                  className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wide text-[var(--color-navy)] underline decoration-2 underline-offset-4 hover:text-[var(--color-red-ink)]"
                >
                  Open this review on its own page
                </Link>
                . It is in your library, and the link keeps working after you
                close the tab.
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
