"use client";

import { useState } from "react";
import { rankFlags, type RiskFlag } from "@/features/analysis/types";

import { RiskFlagCard } from "./RiskFlagCard";
import { FLAG_FILTERS, matchesFlagFilter, type FlagFilter } from "./report/report-helpers";

const EMPTY_MESSAGE: Record<FlagFilter, string> = {
  all: "No flags to show.",
  high: "No high-severity flags.",
  medium: "No medium-severity flags.",
  low: "No low-severity flags.",
  fees: "None of the flagged passages mentions a fee or charge.",
};

/**
 * The verified flags, most serious first, with filter chips. Every card stays
 * mounted and is hidden when filtered out, so an open explanation survives a
 * change of filter.
 */
export function RiskFlagList({
  flags,
  documentTitles,
}: {
  readonly flags: readonly RiskFlag[];
  readonly documentTitles: ReadonlyMap<string, string>;
}) {
  const [filter, setFilter] = useState<FlagFilter>("all");
  const ranked = rankFlags(flags);
  const countFor = (value: FlagFilter) => ranked.filter((flag) => matchesFlagFilter(flag, value)).length;
  const visibleCount = countFor(filter);

  return (
    <>
      <div role="group" aria-label="Filter flags" className="flex flex-wrap gap-1.5">
        {FLAG_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className="inline-flex min-h-11 items-center gap-1.5 border-2 border-[var(--color-navy)] px-2.5 py-1 font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-navy)] hover:bg-[var(--color-paper-deep)] aria-pressed:bg-[var(--color-navy)] aria-pressed:text-[var(--color-paper)]"
          >
            {label}
            <span aria-hidden="true" className="font-[family-name:var(--font-data)] text-xs opacity-80">
              {countFor(value)}
            </span>
          </button>
        ))}
      </div>
      <p
        role="status"
        className={visibleCount === 0 ? "font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]" : "visually-hidden"}
      >
        {visibleCount === 0 ? EMPTY_MESSAGE[filter] : `Showing ${visibleCount} of ${ranked.length} flags.`}
      </p>
      <ol role="list" hidden={visibleCount === 0} className="grid list-none gap-3 p-0">
        {ranked.map((flag) => (
          <li key={flag.id} hidden={!matchesFlagFilter(flag, filter)}>
            <RiskFlagCard flag={flag} titleById={documentTitles} />
          </li>
        ))}
      </ol>
    </>
  );
}
