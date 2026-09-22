import type { GeneralReview } from "@/features/analysis/types";
import type { ExtractedDocument } from "@/features/packet/types";

import { CoverageChecklistSection } from "./CoverageChecklistSection";
import { RiskFlagCard } from "./RiskFlagCard";

export interface ReviewResultProps {
  readonly review: GeneralReview;
  readonly documents: readonly ExtractedDocument[];
}

/**
 * A finished general review: the neutral summary, then the ranked flags or
 * the clean-review statement, then the published coverage checklist in a
 * section of its own.
 *
 * The checklist sits apart from the flags because its items are a different
 * kind of result: a topic the agreement does not cover is not a warning
 * about the agreement, and a review with two not-found items can still be a
 * clean review.
 *
 * Nothing here says a lease is safe to sign, and nothing rules on whether a
 * term would hold up. A clean review reports what was not found in the text
 * reviewed, which is a different claim and the only one the product can make.
 */
export function ReviewResult({ review, documents }: ReviewResultProps) {
  const titleById = new Map(documents.map((document) => [document.id, document.title]));

  return (
    <div className="flex flex-col gap-10">
      <section
        aria-labelledby="review-summary-heading"
        className="border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-6 sm:p-8"
      >
        <h2
          id="review-summary-heading"
          className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]"
        >
          What this agreement says
        </h2>
        <p className="mt-4 max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
          {review.summary}
        </p>
      </section>

      {review.clean ? (
        <section
          aria-labelledby="clean-review-heading"
          className="border-2 border-[var(--color-navy)] bg-[var(--color-paper)] p-6 sm:p-8"
        >
          <h2
            id="clean-review-heading"
            className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)]"
          >
            {review.cleanStatement}
          </h2>
          <p className="mt-4 max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
            Nothing in the text you gave us carried a material downside we could
            quote a sentence for. That is what we found in the text you gave
            us. It is not a verdict on the agreement: read it yourself before
            you sign, and check that everything it refers to is in front of
            you.
          </p>
        </section>
      ) : (
        <section aria-labelledby="risk-flags-heading" className="flex flex-col gap-6">
          <div>
            <h2
              id="risk-flags-heading"
              className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-3xl"
            >
              {review.riskFlags.length === 1
                ? "One term to look at, with the sentence it came from"
                : `${review.riskFlags.length} terms to look at, each with the sentence it came from`}
            </h2>
            <p className="mt-3 max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
              Heaviest consequence first. Every sentence below is cut from the
              text you gave us, so you can find it in your own copy and judge
              it yourself.
            </p>
          </div>

          <ol className="flex list-none flex-col gap-6 p-0">
            {review.riskFlags.map((flag, index) => (
              <li key={flag.id}>
                <RiskFlagCard
                  flag={flag}
                  position={index + 1}
                  documentTitle={titleById.get(flag.sourceDocumentId) ?? flag.sourceDocumentId}
                />
              </li>
            ))}
          </ol>
        </section>
      )}

      {review.droppedFlagCount > 0 ? (
        <p className="border-2 border-dashed border-[var(--color-navy)] px-5 py-4 font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]">
          {review.droppedFlagCount === 1
            ? "One more warning came back quoting a sentence that is not in your text, so it is not shown here."
            : `${review.droppedFlagCount} more warnings came back quoting sentences that are not in your text, so they are not shown here.`}
        </p>
      ) : null}

      <CoverageChecklistSection coverage={review.coverage} documents={documents} />
    </div>
  );
}
