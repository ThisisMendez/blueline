import Link from "next/link";

import type { StoredReviewSummary } from "@/features/library/store";

export interface LibraryListProps {
  readonly reviews: readonly StoredReviewSummary[];
}

/**
 * The signer's own reviews. Ticket 08 adds the expiry date to each line;
 * until it does, this says nothing about how long a review stays, because
 * implying permanence would be a promise the product has not made.
 */
export function LibraryList({ reviews }: LibraryListProps) {
  if (reviews.length === 0) return null;

  return (
    <section
      aria-labelledby="library-heading"
      className="border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-6 sm:p-8"
    >
      <h2
        id="library-heading"
        className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]"
      >
        Your reviews
      </h2>
      <ul className="mt-4 flex list-none flex-col gap-3 p-0">
        {reviews.map((review) => (
          <li key={review.id}>
            <Link
              href={`/review/${review.id}`}
              className="font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)] underline decoration-2 underline-offset-4 hover:text-[var(--color-red-ink)]"
            >
              {review.title}
            </Link>
            <span className="ml-3 font-[family-name:var(--font-data)] text-xs uppercase tracking-wide text-[var(--color-navy)]">
              {review.clean
                ? "No material flags"
                : review.flagCount === 1
                  ? "1 flag"
                  : `${review.flagCount} flags`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
