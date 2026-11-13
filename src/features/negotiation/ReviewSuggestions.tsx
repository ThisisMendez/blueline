"use client";

import { useId, useState } from "react";

import type { ReviewRole, RiskFlag } from "@/features/analysis/types";

import { discussionDraft } from "./shortlist";

const BUTTON =
  "min-h-11 border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-3 py-2 text-sm font-semibold hover:bg-[var(--color-paper-deep)]";

function Suggestion({
  flag,
  role,
  documentTitles,
}: {
  readonly flag: RiskFlag;
  readonly role: ReviewRole;
  readonly documentTitles: ReadonlyMap<string, string>;
}) {
  const id = useId();
  const [draft, setDraft] = useState(() => role === "renter" ? discussionDraft(flag) : flag.counterOffer);
  const [status, setStatus] = useState("");

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draft);
      setStatus("Draft copied.");
    } catch {
      setStatus("Copy is unavailable. Select and copy the text below.");
    }
  }

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
      {role === "renter" ? (
        <div>
          <p className="text-sm font-semibold">What you could ask for</p>
          <p className="text-sm [overflow-wrap:anywhere]">{flag.counterOffer}</p>
        </div>
      ) : null}
      <div className="space-y-2">
        <label htmlFor={id} className="block text-sm font-semibold">
          {role === "renter" ? "Message you can edit" : "Proposed wording you can edit"}
        </label>
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
    </li>
  );
}

export function ReviewSuggestions({
  role,
  flags,
  documentTitles,
}: {
  readonly role: ReviewRole;
  readonly flags: readonly RiskFlag[];
  readonly documentTitles: ReadonlyMap<string, string>;
}) {
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const [opened, setOpened] = useState(false);
  const title = role === "renter" ? "What to discuss with your landlord" : "What to clarify in your lease";

  return (
    <section aria-labelledby={`${id}-title`} className="space-y-2 border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-4">
      <h2 id={`${id}-title`} className="text-lg font-bold">{title}</h2>
      <p className="text-sm">
        {role === "renter"
          ? "Use these drafts to start a conversation. Your landlord can decline any request."
          : "Review these draft changes before sharing the lease."}
      </p>
      <button type="button" className={BUTTON} aria-expanded={expanded} aria-controls={id} onClick={() => { setOpened(true); setExpanded((value) => !value); }}>
        {expanded ? "Hide suggestions" : "Show suggestions"}
      </button>
      <div id={id} hidden={!expanded}>
        {opened ? (
          <ol className="grid gap-4">
            {flags.map((flag) => (
              <Suggestion key={flag.id} flag={flag} role={role} documentTitles={documentTitles} />
            ))}
          </ol>
        ) : null}
      </div>
    </section>
  );
}
