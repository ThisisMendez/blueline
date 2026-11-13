import type { ReactNode } from "react";

import type { GeneralReview, ReviewRole } from "@/features/analysis/types";
import { ReviewSuggestions, type DraftAccess, type DraftWording } from "@/features/negotiation/ReviewSuggestions";
import { discussionShortlist } from "@/features/negotiation/shortlist";
import type { ExtractedDocument } from "@/features/packet/types";
import { RedLinesPanel } from "@/features/red-lines/RedLinesPanel";
import type { LeaseRiskScore } from "@/features/score";

import { CoverageChecklistSection } from "./CoverageChecklistSection";
import { RiskFlagList } from "./RiskFlagList";
import { ScorePanel } from "./report/ScorePanel";
import { firstSentences } from "./report/report-helpers";

export interface ReviewResultProps {
  readonly review: GeneralReview;
  readonly documents: readonly ExtractedDocument[];
  /** The display title: the session's title in-tab, the stored (possibly renamed) title when saved. */
  readonly title: string;
  /** Used when the review itself doesn't record a role. Legacy reviews may have neither. */
  readonly role?: ReviewRole | null;
  /** From `scoreFromOutcome` in-tab or `scoreFromStoredReview` for a saved review. */
  readonly score: LeaseRiskScore;
  readonly reviewId?: string | null;
  /** Shown under the header: retention controls, a save failure. */
  readonly notices?: ReactNode;
  readonly requestDraft?: DraftAccess;
  readonly wording?: DraftWording;
  readonly draftableFlagIds?: readonly string[];
}

export function roleLabel(role: ReviewRole): string {
  return role === "renter" ? "Reviewed as a renter" : "Reviewed as a landlord";
}

const H2 = "font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)]";
const BODY = "max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]";

/**
 * One report for the side the signer picked: header, score, then the flagged
 * terms beside the six checklist topics (stacked on small screens, flags
 * first), then personal red lines for a saved review.
 */
export function ReviewResult({
  review, documents, title, role, score, reviewId, notices, requestDraft, wording, draftableFlagIds,
}: ReviewResultProps) {
  const documentTitles = new Map(documents.map((document) => [document.id, document.title]));
  const side = review.role ?? role ?? undefined;
  const about = firstSentences(review.summary, 2);
  const suggestions = side ? discussionShortlist(review.riskFlags, draftableFlagIds) : [];
  const skippedCount = draftableFlagIds
    ? review.riskFlags.filter(({ id, severity }) => severity !== "low" && !draftableFlagIds.includes(id)).length
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        {side ? (
          <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]">
            {roleLabel(side)}
          </p>
        ) : null}
        <h1 className="[overflow-wrap:anywhere] font-[family-name:var(--font-display)] text-3xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-4xl">
          {title}
        </h1>
      </header>

      {notices}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-8">
        {about ? (
          <section aria-labelledby="about-agreement-heading">
            <h2 id="about-agreement-heading" className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-navy-ink)]">
              About this agreement
            </h2>
            <p className={`mt-1 ${BODY}`}>{about}</p>
          </section>
        ) : (
          <div />
        )}
        <ScorePanel score={score} droppedFlagCount={review.droppedFlagCount} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <section aria-labelledby="risk-flags-heading" className="flex min-w-0 flex-col gap-3">
          <div>
            <h2 id="risk-flags-heading" className={H2}>
              Flagged terms
            </h2>
            {review.clean ? null : (
              <p className={`mt-1 ${BODY}`}>
                Most serious first. We haven&apos;t checked them against local law.
              </p>
            )}
          </div>
          {review.clean ? (
            <div className="border-2 border-[var(--color-navy)] bg-[var(--color-paper)] p-4">
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold leading-tight text-[var(--color-navy-ink)]">
                {review.cleanStatement}
              </h3>
              <p className={`mt-2 ${BODY}`}>
                Read the full agreement before you sign. We haven&apos;t checked it against local law either.
              </p>
            </div>
          ) : (
            <RiskFlagList
              flags={review.riskFlags}
              documentTitles={documentTitles}
              requestDraft={requestDraft}
              wording={wording}
              draftableFlagIds={draftableFlagIds}
            />
          )}
        </section>

        <div className="min-w-0">
          <CoverageChecklistSection coverage={review.coverage} documents={documents} role={side} />
        </div>
      </div>

      {side && suggestions.length > 0 ? (
        <ReviewSuggestions
          key={side}
          role={side}
          flags={suggestions}
          documentTitles={documentTitles}
          requestDraft={requestDraft}
          wording={wording}
          skippedCount={skippedCount}
        />
      ) : null}

      {reviewId ? <RedLinesPanel key={reviewId} reviewId={reviewId} documents={documents} /> : null}
    </div>
  );
}
