import {
  GRADE_BANDS,
  HOW_WE_SCORE,
  SCORE_UNAVAILABLE_LABEL,
  type LeaseRiskScore,
  type ScoreCounts,
} from "@/features/score";

/**
 * The Lease Risk Score beside the report (ADR 0016).
 *
 * It summarizes the verified flags for the selected side. When the score is
 * withheld, the reason is shown in its place and the verified totals stay
 * visible if the score module returned them.
 */

const LABEL = "font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-navy)]";

function IssueTotals({ counts }: { readonly counts: ScoreCounts }) {
  const rows: readonly [string, number][] = [
    ["High", counts.high],
    ["Medium", counts.medium],
    ["Low", counts.low],
  ];
  return (
    <ul
      aria-label="Verified issues by severity"
      className="grid grid-cols-3 divide-x divide-[var(--color-navy)]/25 border-y border-[var(--color-navy)]/25"
    >
      {rows.map(([label, count]) => (
        <li
          key={label}
          className="px-3 py-2 font-[family-name:var(--font-data)] text-sm font-semibold text-[var(--color-navy)] first:pl-0"
        >
          <span className="block text-xl font-bold text-[var(--color-navy-ink)]">{count}</span> {label}
        </li>
      ))}
    </ul>
  );
}

function HowWeScore() {
  return (
    <details className="border-t border-[var(--color-navy)]/25 pt-2">
      <summary className="min-h-11 cursor-pointer py-2 font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-navy)] underline decoration-2 underline-offset-4 hover:text-[var(--color-red-ink)]">
        {HOW_WE_SCORE.title}
      </summary>
      <div className="pb-1 font-[family-name:var(--font-body)] text-sm leading-relaxed text-[var(--color-navy-ink)]">
        <ul className="list-disc space-y-1 pl-5">
          {HOW_WE_SCORE.points.map((point) => <li key={point}>{point}</li>)}
        </ul>
        <p className="mt-2">The review can miss things. Read the flagged terms and the lease itself.</p>
        <details className="mt-2">
          <summary className="min-h-11 cursor-pointer py-2 font-[family-name:var(--font-display)] font-semibold text-[var(--color-navy)] underline decoration-2 underline-offset-4">
            Grade ranges
          </summary>
          <table aria-label="Grade ranges" className="w-full border-collapse text-left text-sm">
            <thead className="visually-hidden">
              <tr>
                <th scope="col">Grade</th>
                <th scope="col">Score</th>
                <th scope="col">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {GRADE_BANDS.map((band) => (
                <tr key={band.grade} className="border-t border-[var(--color-navy)]/20">
                  <th scope="row" className="py-1 pr-3 font-[family-name:var(--font-data)] font-bold">
                    {band.grade}
                  </th>
                  <td className="py-1 pr-3 font-[family-name:var(--font-data)] whitespace-nowrap">
                    {band.min} to {band.max}
                  </td>
                  <td className="py-1">{band.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </details>
  );
}

export function ScorePanel({
  score,
  droppedFlagCount = 0,
}: {
  readonly score: LeaseRiskScore;
  /** Flags left out because their quote didn't match. Shown as its own notice. */
  readonly droppedFlagCount?: number;
}) {
  return (
    <section
      aria-labelledby="lease-risk-score-heading"
      className="flex flex-col gap-3 border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-4 sm:p-5"
    >
      <h2 id="lease-risk-score-heading" className={LABEL}>
        Lease Risk Score
      </h2>

      {score.available ? (
        <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
          <p className="font-[family-name:var(--font-display)] leading-none text-[var(--color-navy-ink)]">
            <span className="text-5xl font-bold">{score.score}</span>
            <span className="text-lg font-semibold text-[var(--color-navy)]">/100</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center border-2 border-[var(--color-navy)] font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-navy-ink)]">
              <span className="visually-hidden">Grade </span>
              {score.grade}
            </span>
            <span className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-navy-ink)]">
              {score.label}
            </span>
          </p>
        </div>
      ) : (
        <div>
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)]">
            {SCORE_UNAVAILABLE_LABEL}
          </p>
          <p className="mt-1 max-w-[var(--measure)] font-[family-name:var(--font-body)] text-sm leading-relaxed text-[var(--color-navy-ink)]">
            {score.explanation}
          </p>
        </div>
      )}

      {score.counts ? <IssueTotals counts={score.counts} /> : null}

      {droppedFlagCount > 0 ? (
        <p className="font-[family-name:var(--font-body)] text-sm leading-relaxed text-[var(--color-navy-ink)]">
          {droppedFlagCount === 1
            ? "We left out one flag because its quote did not match your lease text."
            : `We left out ${droppedFlagCount} flags because their quotes did not match your lease text.`}
        </p>
      ) : null}

      <HowWeScore />
    </section>
  );
}
