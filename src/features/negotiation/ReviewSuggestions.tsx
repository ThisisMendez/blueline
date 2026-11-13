"use client";

import { useId, useState, type ReactNode } from "react";

import type { ReviewRole, RiskFlag } from "@/features/analysis/types";

import { discussionDraft } from "./shortlist";

const BUTTON =
  "min-h-11 border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-3 py-2 text-sm font-semibold hover:bg-[var(--color-paper-deep)] disabled:opacity-60";

export type DraftAccess = (onReady: () => void) => void;
export type DraftWording = ReadonlyMap<string, Pick<RiskFlag, "counterOffer" | "residualRisk">>;

function DraftEditor({ label, initial }: { readonly label: string; readonly initial: string }) {
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

function Suggestion({
  flag,
  documentTitles,
  children,
}: {
  readonly flag: RiskFlag;
  readonly documentTitles: ReadonlyMap<string, string>;
  readonly children: ReactNode;
}) {
  return (
    <li className="min-w-0 space-y-3 border-t border-[var(--color-navy)]/30 pt-3">
      <h3 className="text-base font-bold">{flag.title ?? "Term to discuss"}</h3>
      <p className="text-sm [overflow-wrap:anywhere]">{flag.consequence}</p>
      <ul className="space-y-2">
        {[flag, ...(flag.relatedCitations ?? [])].map((citation) => (
          <li key={`${citation.sourceDocumentId}:${citation.sourceStart}:${citation.sourceEnd}`}>
            <blockquote className="border-l-2 border-[var(--color-red-ink)] pl-3 text-sm [overflow-wrap:anywhere]">
              {citation.sourceSentence}
            </blockquote>
            <p className="pl-3 text-xs">{documentTitles.get(citation.sourceDocumentId) ?? citation.sourceDocumentId}</p>
          </li>
        ))}
      </ul>
      {children}
    </li>
  );
}

export function ReviewSuggestions({
  role,
  flags,
  documentTitles,
  requestDraft,
  wording,
  skippedCount = 0,
}: {
  readonly role: ReviewRole;
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
  const [openLandlord, setOpenLandlord] = useState<ReadonlySet<string>>(new Set());
  const title = role === "renter" ? "What to discuss with your landlord" : "What to clarify in your lease";
  const renter = role === "renter";
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
      <h2 id={`${id}-title`} className="text-lg font-bold">{title}</h2>
      <p className="text-sm">
        {renter ? "Pick the issues you want to raise in one email." : "Choose a term to open suggested wording."}
      </p>
      <button type="button" className={BUTTON} aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(!expanded)}>
        {expanded ? "Hide suggestions" : "Show suggestions"}
      </button>
      <div id={id} hidden={!expanded} className="space-y-4">
        {expanded || selected.size > 0 || draftFlags.length > 0 || openLandlord.size > 0 ? (
          <>
            {skippedCount > 0 ? <p className="text-sm">This list skips terms that have no suggested edit.</p> : null}
            {renter ? (
              <button type="button" className={BUTTON} onClick={() => setSelected(allSelected ? new Set() : new Set(flags.map(({ id }) => id)))}>
                {allSelected ? "Clear selection" : "Select all"}
              </button>
            ) : null}
            <ol className="grid gap-4">
              {flags.map((flag) => {
                const proposed = wording?.get(flag.id)?.counterOffer ?? flag.counterOffer;
                return (
                  <Suggestion key={flag.id} flag={flag} documentTitles={documentTitles}>
                    {renter ? (
                      <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
                        <input type="checkbox" checked={selected.has(flag.id)} onChange={() => toggleFlag(flag.id)} />
                        Include {flag.title ?? "this term"}
                      </label>
                    ) : openLandlord.has(flag.id) && proposed ? (
                      <DraftEditor label="Proposed wording you can edit" initial={proposed} />
                    ) : (
                      <button type="button" className={BUTTON} onClick={() => withAccess(() => setOpenLandlord((current) => new Set(current).add(flag.id)))}>
                        Open proposed wording
                      </button>
                    )}
                  </Suggestion>
                );
              })}
            </ol>
            {renter ? (
              <>
                <button type="button" className={BUTTON} disabled={selected.size === 0} onClick={prepareDraft}>
                  {draftFlags.length ? "Update email draft" : "Create email draft"}
                </button>
                {draftFlags.length && draftFlags.every((flag) => wording?.get(flag.id)?.counterOffer ?? flag.counterOffer) ? (
                  <DraftEditor
                    key={draftVersion}
                    label="Email draft you can edit"
                    initial={discussionDraft(draftFlags.map((flag) => ({ ...flag, ...wording?.get(flag.id) })))}
                  />
                ) : null}
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
