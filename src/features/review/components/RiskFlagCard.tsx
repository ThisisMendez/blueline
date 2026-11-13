"use client";

import { useId, useState } from "react";
import type { RiskFlag, Severity } from "@/features/analysis/types";

const SEVERITY_LABEL: Record<Severity, string> = {
  high: "Severity: High",
  medium: "Severity: Medium",
  low: "Severity: Low",
};

function SeverityBadge({ severity }: { severity: Severity }) {
  const colors = severity === "high"
    ? "border-[var(--color-red-ink)] bg-[var(--color-red-ink)] text-[var(--color-paper)]"
    : "border-[var(--color-navy)] text-[var(--color-navy)]";

  return (
    <span className={`border-2 px-2 py-1 font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide ${colors}`}>
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

function quoteHeading(sentence: string) {
  const words = sentence.split(/\s+/);
  const opening = words.slice(0, 6).join(" ");
  return words.length > 6 ? `${opening}…` : opening;
}

export interface RiskFlagCardProps {
  readonly flag: RiskFlag;
  readonly titleById: ReadonlyMap<string, string>;
}

export function RiskFlagCard({ flag, titleById }: RiskFlagCardProps) {
  const cardId = useId();
  const headingId = `${cardId}-heading`;
  const explanationId = `${cardId}-explanation`;
  const editId = `${cardId}-proposed-edit`;
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const documentTitle = titleById.get(flag.sourceDocumentId) ?? flag.sourceDocumentId;

  return (
    <article
      aria-labelledby={headingId}
      className="border-2 border-[var(--color-navy)] bg-[var(--color-paper)]"
    >
      <div className="p-5 sm:p-7">
        <header className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <SeverityBadge severity={flag.severity} />
          <h3
            id={headingId}
            className="min-w-0 [overflow-wrap:anywhere] font-[family-name:var(--font-display)] text-xl font-bold leading-tight text-[var(--color-navy-ink)]"
          >
            {quoteHeading(flag.sourceSentence)}
          </h3>
        </header>
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="min-w-0 border-l-2 border-[var(--color-red-ink)] bg-[var(--color-paper-deep)] px-4 py-3">
            <blockquote className="[overflow-wrap:anywhere] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
              <mark className="cited-mark">{flag.sourceSentence}</mark>
            </blockquote>
            <p className="mt-2 [overflow-wrap:anywhere] font-[family-name:var(--font-data)] text-xs leading-relaxed text-[var(--color-navy)]">
              {documentTitle}, characters {flag.sourceStart} to {flag.sourceEnd}
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <div>
              <h4 className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--color-navy)]">
                Why it matters
              </h4>
              <p className="mt-1 [overflow-wrap:anywhere] font-[family-name:var(--font-body)] text-base leading-relaxed">
                {flag.consequence}
              </p>
            </div>
            <button
              type="button"
              aria-expanded={explanationOpen}
              aria-controls={explanationId}
              onClick={() => { setExplanationOpen(!explanationOpen); setEditOpen(false); }}
              className="min-h-11 self-start border-2 border-[var(--color-navy)] px-3 py-2 font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-navy)] hover:bg-[var(--color-paper-deep)]"
            >
              {explanationOpen ? "Hide explanation" : "Read explanation"}
            </button>
            <div id={explanationId} hidden={!explanationOpen}>
              {explanationOpen ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <h4 className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--color-navy)]">
                      When it matters
                    </h4>
                    <p className="mt-1 [overflow-wrap:anywhere] font-[family-name:var(--font-body)] text-base leading-relaxed">
                      {flag.triggeringCondition}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-expanded={editOpen}
                    aria-controls={editId}
                    onClick={() => setEditOpen(!editOpen)}
                    className="min-h-11 self-start bg-[var(--color-navy)] px-3 py-2 font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-paper)] hover:bg-[var(--color-navy-ink)]"
                  >
                    {editOpen ? "Hide proposed edit" : "See proposed edit"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div id={editId} hidden={!editOpen}>
        {editOpen ? (
          <section aria-labelledby={`${editId}-heading`} className="m-5 border-2 border-[var(--color-navy)] bg-[var(--color-paper)] p-5 shadow-[0_24px_46px_-22px_rgba(18,59,93,0.5),0_8px_18px_-12px_rgba(18,59,93,0.32)] sm:m-7">
            <h4 id={`${editId}-heading`} className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-navy-ink)]">
              Proposed edit
            </h4>
            <p className="mt-2 font-[family-name:var(--font-body)] text-sm leading-relaxed">
              Use it to start the conversation. Your landlord doesn&apos;t have to accept it, and it isn&apos;t legal advice.
            </p>
            <p className="mt-2 [overflow-wrap:anywhere] font-[family-name:var(--font-body)] text-base leading-relaxed">
              {flag.counterOffer}
            </p>
            <h5 className="mt-4 font-[family-name:var(--font-display)] text-sm font-bold text-[var(--color-navy)]">
              Risk that remains
            </h5>
            <p className="mt-1 [overflow-wrap:anywhere] font-[family-name:var(--font-body)] text-base leading-relaxed">
              {flag.residualRisk}
            </p>
          </section>
        ) : null}
      </div>
    </article>
  );
}
