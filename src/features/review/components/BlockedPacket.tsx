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
  readonly busy: boolean;
}

/**
 * The packet is short a document the agreement names, so there is no review.
 *
 * The type this takes has no summary and no flags on it, so there is nothing
 * partial here to hide: the pipeline was never run. What the signer gets is
 * the name of each document the agreement asks for, the sentence that asks
 * for it, and a way to say a document they already sent is the one meant.
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
  busy,
}: BlockedPacketProps) {
  const heading = useRef<HTMLHeadingElement>(null);

  // The answer arrived somewhere below where the signer was working, so send
  // them to it rather than leaving them to find it.
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
            A lease pointing at a fee schedule or an addendum is ordinary,
            and the document it points at can hold a cost this lease never
            states. Reading what you sent would cover part of your agreement
            while sounding like it covered all of it, so we&apos;ve stopped
            here. Send what&apos;s listed below and we&apos;ll read the whole
            thing.
          </p>
        </div>

        <ReferenceLedger
          completeness={completeness}
          documents={documents}
          choices={choices}
          onChoose={onChoose}
          busy={busy}
        />

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={onRecheck}
            disabled={busy}
            className="inline-flex items-center justify-center bg-[var(--color-navy)] px-6 py-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-paper)] transition-colors hover:bg-[var(--color-navy-ink)] disabled:opacity-70"
          >
            Check the packet again
          </button>
          <p className="max-w-[var(--measure)] font-[family-name:var(--font-body)] text-sm leading-relaxed text-[var(--color-navy-ink)]">
            Add a missing document above, or point us at one you already
            sent, then check again.
          </p>
        </div>
      </div>
    </section>
  );
}
