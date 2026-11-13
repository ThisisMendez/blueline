"use client";

import { useId, useState } from "react";

import type { ReviewCitation, RiskFlag } from "@/features/analysis/types";

import { discussionDraft } from "./shortlist";

const BUTTON =
  "min-h-11 border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-3 py-2 text-sm font-semibold hover:bg-[var(--color-paper-deep)] disabled:opacity-60";

export type DraftAccess = (onReady: () => void) => void;
export type DraftWording = ReadonlyMap<string, Pick<RiskFlag, "counterOffer" | "residualRisk">>;

export function DraftEditor({ label, initial }: { readonly label: string; readonly initial: string }) {
  const id = useId();
  const [draft, setDraft] = useState(initial);
  const [status, setStatus] = useState("");

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draft);
      setStatus("Draft copied.");
    } catch {
      setStatus("Select the text and copy it.");
    }
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold">{label}</label>
      <textarea
        id={id}
        className="w-full border-2 border-[var(--color-navy)] p-2 text-sm"
        rows={6}
        value={draft}
        onChange={(event) => { setDraft(event.target.value); setStatus(""); }}
      />
      <button type="button" className={BUTTON} disabled={!draft.trim()} onClick={copyDraft}>Copy draft</button>
      <p role="status" className="text-sm">{status}</p>
    </div>
  );
}

export function SuggestionQuotes({
  citations,
  documentTitles,
}: {
  readonly citations: readonly ReviewCitation[];
  readonly documentTitles: ReadonlyMap<string, string>;
}) {
  return (
    <ul className="space-y-2">
      {citations.map((citation) => (
        <li key={`${citation.sourceDocumentId}:${citation.sourceStart}:${citation.sourceEnd}`}>
          <blockquote className="border-l-2 border-[var(--color-navy)] pl-3 text-sm [overflow-wrap:anywhere]">
            {citation.sourceSentence}
          </blockquote>
          <p className="pl-3 text-xs">{documentTitles.get(citation.sourceDocumentId) ?? citation.sourceDocumentId}</p>
        </li>
      ))}
    </ul>
  );
}

export function ReviewSuggestions({
  flags,
  documentTitles,
  requestDraft,
  wording,
  skippedCount = 0,
}: {
  readonly flags: readonly RiskFlag[];
  readonly documentTitles: ReadonlyMap<string, string>;
  readonly requestDraft?: DraftAccess;
  readonly wording?: DraftWording;
  readonly skippedCount?: number;
}) {
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [draftFlags, setDraftFlags] = useState<readonly RiskFlag[]>([]);
  const [draftVersion, setDraftVersion] = useState(0);
  const allSelected = selected.size === flags.length;
  const withAccess = requestDraft ?? ((onReady: () => void) => onReady());

  function toggleFlag(flagId: string) {
    const next = new Set(selected);
    if (next.has(flagId)) next.delete(flagId);
    else next.add(flagId);
    setSelected(next);
  }

  function prepareDraft() {
    const choices = flags.filter((flag) => selected.has(flag.id));
    withAccess(() => {
      setDraftFlags(choices);
      setDraftVersion((version) => version + 1);
    });
  }

  return (
    <section aria-labelledby={`${id}-title`} className="space-y-2 border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-4">
      <h2 id={`${id}-title`} className="text-lg font-bold">What to discuss with your landlord</h2>
      <p className="text-sm">Pick the issues you want to raise in one email.</p>
      <button type="button" className={BUTTON} aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(!expanded)}>
        {expanded ? "Hide suggestions" : "Show suggestions"}
      </button>
      <div id={id} hidden={!expanded} className="space-y-4">
        {expanded || selected.size > 0 || draftFlags.length > 0 ? (
          <>
            {skippedCount > 0 ? <p className="text-sm">This list skips terms that have no suggested edit.</p> : null}
            <button type="button" className={BUTTON} onClick={() => setSelected(allSelected ? new Set() : new Set(flags.map(({ id }) => id)))}>
              {allSelected ? "Clear selection" : "Select all"}
            </button>
            <ol className="grid gap-4">
              {flags.map((flag) => (
                <li key={flag.id} className="min-w-0 space-y-3 border-t border-[var(--color-navy)]/30 pt-3">
                  <h3 className="text-base font-bold">{flag.title ?? "Term to discuss"}</h3>
                  <p className="text-sm [overflow-wrap:anywhere]">{flag.consequence}</p>
                  <SuggestionQuotes citations={[flag, ...(flag.relatedCitations ?? [])]} documentTitles={documentTitles} />
                  <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
                    <input type="checkbox" checked={selected.has(flag.id)} onChange={() => toggleFlag(flag.id)} />
                    Include {flag.title ?? "this term"}
                  </label>
                </li>
              ))}
            </ol>
            <button type="button" className={BUTTON} disabled={selected.size === 0} onClick={prepareDraft}>
              {draftFlags.length ? "Update email draft" : "Create email draft"}
            </button>
            {draftFlags.length > 0 && draftFlags.every((flag) => wording?.get(flag.id)?.counterOffer ?? flag.counterOffer) ? (
              <DraftEditor
                key={draftVersion}
                label="Email draft you can edit"
                initial={discussionDraft(draftFlags.map((flag) => ({ ...flag, ...wording?.get(flag.id) })))}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
