import type { GeneralReview, RiskFlag } from "@/features/analysis/types";
import type { ExtractedDocument } from "@/features/packet/types";
import { QuestionPanel } from "@/features/questions/QuestionPanel";
import { RedLinesPanel } from "@/features/red-lines/RedLinesPanel";

import { CoverageChecklistSection } from "./CoverageChecklistSection";
import { RiskFlagList } from "./RiskFlagList";

export interface ReviewResultProps {
  readonly review: GeneralReview;
  readonly documents: readonly ExtractedDocument[];
  readonly reviewId?: string | null;
}

function SeverityCounts({ flags }: { readonly flags: readonly RiskFlag[] }) {
  const counts = { high: 0, medium: 0, low: 0 };
  for (const flag of flags) counts[flag.severity] += 1;

  return (
    <ul
      aria-label="Flags by severity"
      className="mt-5 grid grid-cols-3 divide-x divide-[var(--color-navy)]/25 border-y border-[var(--color-navy)]/25"
    >
      <li className="py-3 pr-3 font-[family-name:var(--font-data)] text-sm font-semibold text-[var(--color-navy)]">
        <span className="block text-2xl font-bold">{counts.high}</span> High
      </li>
      <li className="px-3 py-3 font-[family-name:var(--font-data)] text-sm font-semibold text-[var(--color-navy)]">
        <span className="block text-2xl font-bold">{counts.medium}</span> Medium
      </li>
      <li className="px-3 py-3 font-[family-name:var(--font-data)] text-sm font-semibold text-[var(--color-navy)]">
        <span className="block text-2xl font-bold">{counts.low}</span> Low
      </li>
    </ul>
  );
}

export function ReviewResult({ review, documents, reviewId }: ReviewResultProps) {
  const documentTitles = new Map(documents.map((document) => [document.id, document.title]));

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <section
        aria-labelledby="review-summary-heading"
        className="border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-5 sm:p-8"
      >
        <h2
          id="review-summary-heading"
          className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-navy-ink)] sm:text-3xl"
        >
          Lease review
        </h2>
        {!review.clean ? <SeverityCounts flags={review.riskFlags} /> : null}
        {review.droppedFlagCount > 0 ? (
          <p className="mt-4 text-sm leading-relaxed text-[var(--color-navy-ink)]">
            {review.droppedFlagCount === 1
              ? "We left out one flag because its quote did not match your lease text."
              : `We left out ${review.droppedFlagCount} flags because their quotes did not match your lease text.`}
          </p>
        ) : null}
        <h3 className="mt-5 font-[family-name:var(--font-display)] text-sm font-bold text-[var(--color-navy)]">
          What this agreement says
        </h3>
        <p className="mt-2 max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
          {review.summary}
        </p>
      </section>

      {review.clean ? (
        <section
          aria-labelledby="clean-review-heading"
          className="border-2 border-[var(--color-navy)] bg-[var(--color-paper)] p-5 sm:p-8"
        >
          <h2
            id="clean-review-heading"
            className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)]"
          >
            {review.cleanStatement}
          </h2>
          <p className="mt-3 max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
            Read the full agreement before you sign. We haven&apos;t checked it against local law either.
          </p>
        </section>
      ) : (
        <section aria-labelledby="risk-flags-heading" className="flex flex-col gap-4">
          <div>
            <h2
              id="risk-flags-heading"
              className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-3xl"
            >
              Terms to look at
            </h2>
            <p className="mt-2 max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
              Start with the biggest risks. We haven&apos;t checked them against local law.
            </p>
          </div>
          <RiskFlagList flags={review.riskFlags} documentTitles={documentTitles} />
        </section>
      )}

      <CoverageChecklistSection coverage={review.coverage} documents={documents} />
      <QuestionPanel documents={documents} />
      {reviewId ? <RedLinesPanel key={reviewId} reviewId={reviewId} documents={documents} /> : null}
    </div>
  );
}
