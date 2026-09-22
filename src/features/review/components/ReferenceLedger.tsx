"use client";

import type {
  CompletenessCheck,
  DocumentReference,
} from "@/features/packet/completeness";
import type { ExtractedDocument } from "@/features/packet/types";

/** The signer's answers about which supplied document covers which reference. */
export type ReferenceChoices = Readonly<Record<string, string | null>>;

interface LedgerEntry {
  readonly reference: DocumentReference;
  /** The document covering it right now, after the signer's own answers. */
  readonly coveredBy: string | null;
}

/** One list of every reference, missing ones first, each with its answer. */
function ledgerEntries(
  completeness: CompletenessCheck,
  choices: ReferenceChoices,
): LedgerEntry[] {
  const missing = completeness.kind === "incomplete" ? completeness.missing : [];

  const entries: LedgerEntry[] = [
    ...missing.map((reference) => ({ reference, coveredBy: null })),
    ...completeness.matches.map((match) => ({
      reference: match.reference,
      coveredBy: match.documentId,
    })),
  ];

  return entries.map((entry) =>
    Object.hasOwn(choices, entry.reference.id)
      ? { ...entry, coveredBy: choices[entry.reference.id] }
      : entry,
  );
}

export interface ReferenceLedgerProps {
  readonly completeness: CompletenessCheck;
  readonly documents: readonly ExtractedDocument[];
  readonly choices: ReferenceChoices;
  readonly onChoose: (referenceId: string, documentId: string | null) => void;
  readonly busy: boolean;
}

/**
 * Everything the agreement points at, and what is standing in for it.
 *
 * The matching is a guess made by reading titles and opening lines, so every
 * row of it is a control rather than a statement. A signer who already sent
 * the document can say which one it is and carry on; a signer looking at a
 * wrong answer can take it back. Neither costs them another upload.
 */
export function ReferenceLedger({
  completeness,
  documents,
  choices,
  onChoose,
  busy,
}: ReferenceLedgerProps) {
  const entries = ledgerEntries(completeness, choices);
  if (entries.length === 0) return null;

  const titleById = new Map(documents.map((document) => [document.id, document.title]));

  return (
    <ol className="flex list-none flex-col gap-6 p-0">
      {entries.map((entry) => {
        const selectId = `reference-${entry.reference.id}`;
        const citedFrom =
          titleById.get(entry.reference.citingDocumentId) ??
          entry.reference.citingDocumentId;

        return (
          <li
            key={entry.reference.id}
            className="border-2 border-[var(--color-navy)] bg-[var(--color-paper)]"
          >
            <div className="flex flex-col gap-5 p-6 sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="font-[family-name:var(--font-display)] text-lg font-bold leading-tight text-[var(--color-navy-ink)]">
                  {entry.reference.name}
                </h3>
                {entry.coveredBy === null ? (
                  <span className="inline-block border-2 border-[var(--color-navy)] px-2 py-1 font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-navy)]">
                    Still to come
                  </span>
                ) : (
                  <span className="font-[family-name:var(--font-data)] text-xs uppercase tracking-wide text-[var(--color-navy)]">
                    Covered by {titleById.get(entry.coveredBy) ?? entry.coveredBy}
                  </span>
                )}
              </div>

              <blockquote className="border-l-2 border-[var(--color-navy)] pl-4 font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
                {entry.reference.citingSentence}
              </blockquote>

              <div>
                <label
                  htmlFor={selectId}
                  className="block font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]"
                >
                  Which document is this?
                </label>
                <select
                  id={selectId}
                  disabled={busy}
                  value={entry.coveredBy ?? ""}
                  onChange={(event) =>
                    onChoose(entry.reference.id, event.target.value || null)
                  }
                  className="mt-2 w-full max-w-[var(--measure)] border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-3 py-2 font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)] disabled:opacity-70"
                >
                  <option value="">I haven&apos;t sent it yet</option>
                  {documents.map((document) => (
                    <option key={document.id} value={document.id}>
                      {document.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="border-t-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] px-6 py-4 font-[family-name:var(--font-data)] text-xs uppercase tracking-wide text-[var(--color-navy)] sm:px-8">
              Source: {citedFrom}, characters {entry.reference.citingStart} to{" "}
              {entry.reference.citingEnd}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
