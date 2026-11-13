"use client";

import { useId, useState } from "react";

import { DraftEditor, SuggestionQuotes, type DraftAccess, type DraftWording } from "./ReviewSuggestions";
import type { LandlordRecommendation } from "./landlord-recommendations";

const BUTTON =
  "min-h-11 border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-3 py-2 text-sm font-semibold hover:bg-[var(--color-paper-deep)]";

const LABELS = {
  flag: "Flagged term",
  missing: "Not found in the text reviewed",
  confirm: "Check before sharing",
} as const;

export function LandlordRecommendations({
  recommendations,
  documentTitles,
  requestDraft,
  wording,
  draftingUnavailable,
}: {
  readonly recommendations: readonly LandlordRecommendation[];
  readonly documentTitles: ReadonlyMap<string, string>;
  readonly requestDraft?: DraftAccess;
  readonly wording?: DraftWording;
  readonly draftingUnavailable: boolean;
}) {
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const [openDrafts, setOpenDrafts] = useState<ReadonlySet<string>>(new Set());

  function openDraft(key: string) {
    const show = () => setOpenDrafts((current) => new Set(current).add(key));
    if (requestDraft) requestDraft(show);
    else show();
  }

  return (
    <section aria-labelledby={`${id}-title`} className="space-y-2 border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-4">
      <h2 id={`${id}-title`} className="text-lg font-bold">What to clarify in your lease</h2>
      <p className="text-sm">Review these suggestions before sharing the lease. Fill in any details in brackets.</p>
      <button type="button" className={BUTTON} aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(!expanded)}>
        {expanded ? "Hide suggestions" : "Show suggestions"}
      </button>
      <ol id={id} hidden={!expanded} className="gap-4 [&:not([hidden])]:grid">
        {recommendations.map(({ kind, id: itemId, title, detail, citations, draft }) => {
          const key = `${kind}-${itemId}`;
          const proposed = kind === "flag" ? wording?.get(itemId)?.counterOffer ?? draft : draft;
          return (
            <li key={key} className="min-w-0 space-y-2 border-t border-[var(--color-navy)]/30 pt-3">
              <p className="font-[family-name:var(--font-data)] text-xs font-semibold text-[var(--color-navy)]">{LABELS[kind]}</p>
              <h3 className="text-base font-bold">{title}</h3>
              <p className="text-sm [overflow-wrap:anywhere]">{detail}</p>
              {citations.length > 0 ? <SuggestionQuotes citations={citations} documentTitles={documentTitles} /> : null}
              {draftingUnavailable ? null : openDrafts.has(key) && proposed ? (
                <DraftEditor label="Proposed wording you can edit" initial={proposed} />
              ) : (
                <button type="button" aria-label={`Open proposed wording for ${title}`} className={BUTTON} onClick={() => openDraft(key)}>
                  Open proposed wording
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
