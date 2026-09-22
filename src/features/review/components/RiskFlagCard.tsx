import type { RiskFlag, Severity } from "@/features/analysis/types";

const SEVERITY_LABEL: Record<Severity, string> = {
  high: "Severity: High",
  medium: "Severity: Medium",
  low: "Severity: Low",
};

/**
 * High severity gets the filled alert badge in red ink; medium and low get
 * the outlined navy badge. Red marks the citation and the alert state, and
 * nothing else — a medium flag is not an alert.
 */
function SeverityBadge({ severity }: { severity: Severity }) {
  const alert = severity === "high";
  return (
    <span
      className={
        alert
          ? "inline-block bg-[var(--color-red-ink)] px-2 py-1 font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-paper)]"
          : "inline-block border-2 border-[var(--color-navy)] px-2 py-1 font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-navy)]"
      }
    >
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

export interface RiskFlagCardProps {
  readonly flag: RiskFlag;
  readonly position: number;
  readonly documentTitle: string;
}

/**
 * The risk flag as a specimen card: the sentence out of the signer's own
 * document, marked with `.cited-mark`, sitting against its severity badge and
 * its plain-English gloss, over a citation strip naming where the sentence
 * came from.
 *
 * The landing page's measured leader lines are not reproduced here. In a list
 * of flags the gloss sits beside its clause already, and a page of drawn
 * lines would be decoration rather than identification.
 */
export function RiskFlagCard({ flag, position, documentTitle }: RiskFlagCardProps) {
  const headingId = `flag-${flag.id}-heading`;

  return (
    <article
      aria-labelledby={headingId}
      className="border-2 border-[var(--color-navy)] bg-[var(--color-paper)]"
    >
      <div className="grid gap-x-10 gap-y-6 p-6 sm:p-8 md:grid-cols-[1.6fr_1fr]">
        <div>
          <p
            id={headingId}
            className="font-[family-name:var(--font-data)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-navy)]"
          >
            Risk flag {String(position).padStart(2, "0")}
          </p>
          <p className="mt-4 font-[family-name:var(--font-body)] text-lg leading-relaxed text-[var(--color-navy-ink)]">
            <mark className="cited-mark">{flag.sourceSentence}</mark>
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <SeverityBadge severity={flag.severity} />
            <p className="mt-2 font-[family-name:var(--font-body)] text-sm leading-snug text-[var(--color-navy-ink)]">
              {flag.consequence}
            </p>
          </div>
          <div>
            <span className="inline-block border-2 border-[var(--color-navy)] px-2 py-1 font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-navy)]">
              Matters if
            </span>
            <p className="mt-2 font-[family-name:var(--font-body)] text-sm leading-snug text-[var(--color-navy-ink)]">
              {flag.triggeringCondition}
            </p>
          </div>
        </div>
      </div>

      <p className="border-t-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] px-6 py-4 font-[family-name:var(--font-data)] text-xs uppercase tracking-wide text-[var(--color-navy)] sm:px-8">
        Source: {documentTitle}, characters {flag.sourceStart} to {flag.sourceEnd}
      </p>
    </article>
  );
}
