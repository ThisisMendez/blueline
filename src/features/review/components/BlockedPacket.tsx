"use client";

import { useEffect, useRef } from "react";

import type { IncompleteAgreement } from "@/features/packet/completeness";
import type { ExtractedDocument } from "@/features/packet/types";

import { ReferenceLedger, type ReferenceChoices } from "./ReferenceLedger";

export interface BlockedPacketProps {
  readonly completeness: IncompleteAgreement;
  readonly documents: readonly ExtractedDocument[];
  readonly choices: ReferenceChoices;
  readonly onChoose: (referenceId: string, documentId: string | null) => void;
  readonly onRecheck: () => void;
  /** Back to the intake with the role and documents kept, to add what's missing. */
  readonly onAddDocument: () => void;
  readonly busy: boolean;
}

/**
 * The packet is short a document the agreement names, so there is no review.
 *
 * The type this takes has no summary and no flags on it, so there is nothing
 * partial here to hide: the pipeline was never run. What the signer gets is
 * the name of each document the agreement asks for, the sentence that asks
 * for it, a way to go back and add it without rebuilding the packet, and a
 * way to say a document they already sent is the one meant.
 *
 * The treatment is deliberately its own. The dashed navy border belongs to a
 * not-found checklist item, and signal red belongs to risk and severity —
 * a document that has not arrived yet is neither of those things.
 */
export function BlockedPacket({
  completeness,
  documents,
  choices,
  onChoose,
  onRecheck,
  onAddDocument,
  busy,
}: BlockedPacketProps) {
  const heading = useRef<HTMLHeadingElement>(null);

  // The answer replaced the progress the signer was watching, so send them to it.
  useEffect(() => {
    heading.current?.focus();
  }, []);

  const count = completeness.missing.length;

  return (
    <section
      aria-labelledby="blocked-packet-heading"
      className="border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)]"
    >
      <p className="bg-[var(--color-navy)] px-6 py-3 font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-paper)] sm:px-8">
        Waiting on your documents
      </p>

      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <div>
          <h2
            id="blocked-packet-heading"
            ref={heading}
            tabIndex={-1}
            className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-3xl"
          >
            {count === 1
              ? "Your lease points at a document that isn't here"
              : `Your lease points at ${count} documents that aren't here`}
          </h2>
          <p className="mt-4 max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
            A fee list or addendum can hold costs the lease doesn&apos;t
            state, so we wait until we have the whole agreement. Add each
            document listed below. If you already added one, pick it from the
            list instead.
          </p>
        </div>

        <ReferenceLedger
          completeness={completeness}
          documents={documents}
          choices={choices}
          onChoose={onChoose}
          busy={busy}
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onAddDocument}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center bg-[var(--color-navy)] px-6 py-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-paper)] transition-colors hover:bg-[var(--color-navy-ink)] disabled:opacity-60"
          >
            Add the missing document
          </button>
          <button
            type="button"
            onClick={onRecheck}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-5 py-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-navy)] transition-colors hover:bg-[var(--color-paper-deep)] disabled:opacity-60"
          >
            Check the packet again
          </button>
        </div>
      </div>
    </section>
  );
}
