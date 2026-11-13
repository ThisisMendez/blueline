"use client";

import { useRouter } from "next/navigation";

import { useReviewSession } from "./ReviewSessionProvider";

/**
 * What a processing or report page shows when this tab no longer holds the
 * review, after a refresh or in a new tab. Reviews that aren't saved live
 * only in the tab that ran them, so there is nothing to recover here.
 */
export function StartAgain() {
  const router = useRouter();
  const { actions } = useReviewSession();

  function startAgain() {
    actions.reset();
    router.push("/review");
  }

  return (
    <section aria-labelledby="start-again-heading" className="flex max-w-[var(--measure)] flex-col gap-4">
      <h1
        id="start-again-heading"
        className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-3xl"
      >
        This tab doesn&apos;t have a review open
      </h1>
      <p className="font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
        A review that isn&apos;t saved stays only in the tab that ran it, so
        it&apos;s gone after a refresh. Saved reviews are in your library.
      </p>
      <div>
        <button
          type="button"
          onClick={startAgain}
          className="inline-flex min-h-11 items-center justify-center bg-[var(--color-navy)] px-6 py-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-paper)] transition-colors hover:bg-[var(--color-navy-ink)]"
        >
          Start again
        </button>
      </div>
    </section>
  );
}
