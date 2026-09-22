import Link from "next/link";

/**
 * Shown for a review id that is not in this signer's library — whether it
 * never existed or belongs to someone else. The two read the same on
 * purpose: which one it is would itself be information about another signer.
 */
export default function SavedReviewNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]">
        Nothing here
      </p>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-3xl">
        That review isn&apos;t in your library
      </h1>
      <p className="max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
        Check the link, or start again with the text in front of you.
      </p>
      <p>
        <Link
          href="/review"
          className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wide text-[var(--color-navy)] underline decoration-2 underline-offset-4 hover:text-[var(--color-red-ink)]"
        >
          Review a lease
        </Link>
      </p>
    </div>
  );
}
