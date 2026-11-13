"use client";

import { useId, useState } from "react";
import type { ReviewCitation, RiskFlag, Severity } from "@/features/analysis/types";

const SEVERITY_LABEL: Record<Severity, string> = {
  high: "Severity: High",
  medium: "Severity: Medium",
  low: "Severity: Low",
};

const LABEL = "font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-navy)]";
const BODY = "[overflow-wrap:anywhere] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]";

function SeverityBadge({ severity }: { severity: Severity }) {
  const colors = severity === "high"
    ? "border-[var(--color-red-ink)] bg-[var(--color-red-ink)] text-[var(--color-paper)]"
    : "border-[var(--color-navy)] text-[var(--color-navy)]";

  return (
    <span className={`shrink-0 border-2 px-1.5 py-0.5 font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide ${colors}`}>
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

function quoteHeading(sentence: string) {
  const words = sentence.split(/\s+/);
  const opening = words.slice(0, 6).join(" ");
  return words.length > 6 ? `${opening}…` : opening;
}

/**
 * Where a quote sits. Extraction doesn't record where each PDF page starts,
 * so the location is the document. Search the PDF for the quoted words to find it.
 */
function Location({ citation, titleById }: { readonly citation: ReviewCitation; readonly titleById: ReadonlyMap<string, string> }) {
  return (
    <p className="mt-1 [overflow-wrap:anywhere] font-[family-name:var(--font-data)] text-xs leading-relaxed text-[var(--color-navy)]">
      From {titleById.get(citation.sourceDocumentId) ?? citation.sourceDocumentId}
    </p>
  );
}

export interface RiskFlagCardProps {
  readonly flag: RiskFlag;
  readonly titleById: ReadonlyMap<string, string>;
}

/**
 * One verified flag. Consequence and the exact quote come first; the
 * proposed edit stays two steps away, behind the explanation (ADR 0010).
 */
export function RiskFlagCard({ flag, titleById }: RiskFlagCardProps) {
  const cardId = useId();
  const headingId = `${cardId}-heading`;
  const explanationId = `${cardId}-explanation`;
  const editId = `${cardId}-proposed-edit`;
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const related = flag.relatedCitations ?? [];

  return (
    <article
      aria-labelledby={headingId}
      className={`border-2 bg-[var(--color-paper)] p-4 ${flag.severity === "high" ? "border-[var(--color-red-ink)]" : "border-[var(--color-navy)]"}`}
    >
      <header className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <SeverityBadge severity={flag.severity} />
        <h3
          id={headingId}
          className="min-w-0 [overflow-wrap:anywhere] font-[family-name:var(--font-display)] text-lg font-bold leading-snug text-[var(--color-navy-ink)]"
        >
          {flag.title ?? quoteHeading(flag.sourceSentence)}
        </h3>
      </header>

      <h4 className={`mt-3 ${LABEL}`}>Why it matters</h4>
      <p className={`mt-1 ${BODY}`}>{flag.consequence}</p>

      <div className="mt-3 border-l-2 border-[var(--color-red-ink)] bg-[var(--color-paper-deep)] px-3 py-2">
        <h4 className={LABEL}>{related.length > 0 ? "What the lease says, in each place" : "What the lease says"}</h4>
        <blockquote className={`mt-1 ${BODY}`}>
          <mark className="cited-mark">{flag.sourceSentence}</mark>
        </blockquote>
        <Location citation={flag} titleById={titleById} />
        {related.map((citation) => (
          <div
            key={`${citation.sourceDocumentId}-${citation.sourceStart}-${citation.sourceEnd}`}
            className="mt-2 border-t border-[var(--color-navy)]/25 pt-2"
          >
            <blockquote className={BODY}>{citation.sourceSentence}</blockquote>
            <Location citation={citation} titleById={titleById} />
          </div>
        ))}
      </div>

      {flag.nextStep ? (
        <>
          <h4 className={`mt-3 ${LABEL}`}>Next step</h4>
          <p className={`mt-1 ${BODY}`}>{flag.nextStep}</p>
        </>
      ) : null}

      <button
        type="button"
        aria-expanded={explanationOpen}
        aria-controls={explanationId}
        onClick={() => { setExplanationOpen(!explanationOpen); setEditOpen(false); }}
        className="mt-3 min-h-11 border-2 border-[var(--color-navy)] px-3 py-1.5 font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-navy)] hover:bg-[var(--color-paper-deep)]"
      >
        {explanationOpen ? "Hide explanation" : "Read explanation"}
      </button>

      <div id={explanationId} hidden={!explanationOpen}>
        {explanationOpen ? (
          <div className="mt-3 flex flex-col gap-3">
            <div>
              <h4 className={LABEL}>When it matters</h4>
              <p className={`mt-1 ${BODY}`}>{flag.triggeringCondition}</p>
            </div>
            <button
              type="button"
              aria-expanded={editOpen}
              aria-controls={editId}
              onClick={() => setEditOpen(!editOpen)}
              className="min-h-11 self-start bg-[var(--color-navy)] px-3 py-1.5 font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-paper)] hover:bg-[var(--color-navy-ink)]"
            >
              {editOpen ? "Hide proposed edit" : "See proposed edit"}
            </button>
          </div>
        ) : null}
      </div>

      <div id={editId} hidden={!editOpen}>
        {editOpen ? (
          <section
            aria-labelledby={`${editId}-heading`}
            className="mt-3 border-l-4 border-[var(--color-navy)] bg-[var(--color-paper-deep)] px-3 py-2"
          >
            <h4 id={`${editId}-heading`} className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-navy-ink)]">
              Proposed edit
            </h4>
            <p className="mt-1 font-[family-name:var(--font-body)] text-sm leading-relaxed text-[var(--color-navy-ink)]">
              Any change needs the other party&apos;s agreement.
            </p>
            <p className={`mt-2 ${BODY}`}>{flag.counterOffer}</p>
            <h5 className={`mt-3 ${LABEL}`}>Risk that remains</h5>
            <p className={`mt-1 ${BODY}`}>{flag.residualRisk}</p>
          </section>
        ) : null}
      </div>
    </article>
  );
}
