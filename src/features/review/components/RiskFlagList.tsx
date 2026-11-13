"use client";

import { useState } from "react";
import type { RiskFlag, Severity } from "@/features/analysis/types";

import { RiskFlagCard } from "./RiskFlagCard";

type FlagFilter = "all" | Severity | "fees";

const FILTERS: readonly { value: FlagFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "fees", label: "Mentions fees or charges" },
];

function matchesFilter(flag: RiskFlag, filter: FlagFilter) {
  if (filter === "all") return true;
  if (filter === "fees") return /\b(?:fees?|charges?)\b/i.test(flag.sourceSentence);
  return flag.severity === filter;
}

export function RiskFlagList({
  flags,
  documentTitles,
}: {
  readonly flags: readonly RiskFlag[];
  readonly documentTitles: ReadonlyMap<string, string>;
}) {
  const [filter, setFilter] = useState<FlagFilter>("all");
  const visibleCount = flags.filter((flag) => matchesFilter(flag, filter)).length;

  return (
    <>
      <div role="group" aria-label="Filter flags" className="flex flex-wrap gap-2">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className="min-h-11 border-2 border-[var(--color-navy)] px-3 py-2 font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-navy)] hover:bg-[var(--color-paper-deep)] aria-pressed:bg-[var(--color-navy)] aria-pressed:text-[var(--color-paper)]"
          >
            {label}
          </button>
        ))}
      </div>
      <p
        role="status"
        className={visibleCount === 0 ? "text-sm text-[var(--color-navy-ink)]" : "visually-hidden"}
      >
        {visibleCount === 0 ? "No flags match this filter." : `Showing ${visibleCount} of ${flags.length} flags.`}
      </p>
      <ol
        role="list"
        hidden={visibleCount === 0}
        className="grid list-none gap-4 p-0 sm:gap-5"
      >
        {flags.map((flag) => (
          <li key={flag.id} hidden={!matchesFilter(flag, filter)}>
            <RiskFlagCard flag={flag} titleById={documentTitles} />
          </li>
        ))}
      </ol>
    </>
  );
}
