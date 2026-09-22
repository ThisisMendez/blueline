import Link from "next/link";

import type { StoredReviewSummary } from "@/features/library/store";
import { RetentionControls } from "@/features/library/RetentionControls";

export interface LibraryListProps {
  readonly reviews: readonly StoredReviewSummary[];
  readonly unavailable?: boolean;
}

/**
 * Each library item includes its actual stored expiry and an explicit save.
 */
export function LibraryList({ reviews, unavailable = false }: LibraryListProps) {
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
      {unavailable ? <p role="alert" className="mt-4 font-[family-name:var(--font-body)]">Your library could not be loaded. Reload the page to try again.</p> : reviews.length === 0 ? <p className="mt-4 font-[family-name:var(--font-body)]">No reviews in your library. Completed reviews stay here for 30 days, or 90 days from an explicit save.</p> : null}
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
            <RetentionControls reviewId={review.id} retention={review} />
          </li>
        ))}
      </ul>
    </section>
  );
}
