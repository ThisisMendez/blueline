"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import type {
  AnalysisFailure,
  AnalysisOutcome,
  AnalysisRejection,
  GeneralReview,
} from "@/features/analysis/types";
import type {
  CompleteAgreement,
  IncompleteAgreement,
} from "@/features/packet/completeness";
import { extractPdfText, type PdfExtraction } from "@/features/packet/extract/pdf";
import {
  MAXIMUM_PACKET_DOCUMENTS,
  type ExtractedDocument,
} from "@/features/packet/types";

import { BlockedPacket } from "./BlockedPacket";
import { DocumentSlot, type FileState } from "./DocumentSlot";
import { ReferenceLedger, type ReferenceChoices } from "./ReferenceLedger";
import { ReviewResult } from "./ReviewResult";

const FAILURE_MESSAGE: Record<AnalysisFailure, string> = {
  "model-not-configured":
    "The reading service isn't set up on this deployment, so the review can't run.",
  "model-timeout": "The reading took too long and stopped. Try it again.",
  "model-rate-limited": "Too many reviews are running at once. Give it a minute and try again.",
  "model-unavailable": "The reading service didn't answer. Try it again in a moment.",
  "model-unreadable": "The answer came back garbled, so there was nothing worth showing you.",
  "model-verification-failed": "We couldn't verify the answer against your document. The review could not be completed. Try again.",
};

const REJECTION_MESSAGE: Record<AnalysisRejection, string> = {
  "malformed-request": "That didn't send properly. Try again.",
  "empty-text": "There's nothing in the box yet. Paste your lease and send it again.",
  "not-signed-in": "Your sign-in has run out. Sign in again, then send the text once more.",
};

/**
 * What the signer is told when a file cannot be reviewed.
 *
 * Each one names what went wrong and what to do next. None of them is an
 * empty review: a file we cannot read has to be impossible to mistake for a
 * lease with nothing wrong in it.
 */
const NO_SELECTABLE_TEXT_MESSAGE =
  "There is no text to select in this PDF, so it is probably a scan or a photo of the pages. " +
  "Every flag we show quotes a sentence out of your document, and there is no sentence in here " +
  "to quote. Ask whoever sent it for the file the lease was typed in, or paste the text above.";

const UNREADABLE_MESSAGE: Record<"not-a-pdf" | "password-protected", string> = {
  "not-a-pdf":
    "This file didn't open as a PDF. If it's a Word document or a photo, paste the text above instead.",
  "password-protected":
    "This PDF is locked with a password, so we can't read anything out of it. Save an unlocked copy and open that one instead.",
};

/**
 * Where the screen is.
 *
 * `working` and `blocked` are the two waits, and they are different kinds of
 * thing: one is us reading, one is us asking. Keeping them as separate
 * members of this union is what stops the screen from showing a spinner at
 * somebody whose next move is to go and find a document.
 */
type Phase =
  | { readonly kind: "idle" }
  | { readonly kind: "working" }
  | {
      readonly kind: "blocked";
      readonly completeness: IncompleteAgreement;
      readonly documents: readonly ExtractedDocument[];
    }
  | {
      readonly kind: "reviewed";
      readonly review: GeneralReview;
      readonly completeness: CompleteAgreement;
      readonly documents: readonly ExtractedDocument[];
      readonly reviewId: string | null;
    }
  | { readonly kind: "problem"; readonly message: string };

interface Slot {
  readonly key: string;
  readonly title: string;
  readonly text: string;
  readonly file: FileState;
}

function emptySlot(key: string): Slot {
  return { key, title: "", text: "", file: { kind: "none" } };
}

function rejectionFor(extraction: PdfExtraction): string {
  return extraction.kind === "unreadable"
    ? UNREADABLE_MESSAGE[extraction.reason]
    : NO_SELECTABLE_TEXT_MESSAGE;
}

export interface DocumentIntakeProps {
  /** True when a finished review is kept in the signer's library. */
  readonly persists: boolean;
}

/**
 * The packet: the lease, the documents it refers to, and one send.
 *
 * Every document is opened in the signer's browser and reduced to text
 * before anything leaves the page. The request carries text and the names
 * the signer gave it, and nothing else; there is no field for a file, so
 * there is no path an original could take.
 *
 * The send does two things in order, and the screen shows which answer came
 * back. If the agreement names a document nobody supplied, the answer is a
 * blocked packet with no review in it at all. Only a complete agreement
 * reaches the review pipeline.
 */
export function DocumentIntake({ persists }: DocumentIntakeProps) {
  const [slots, setSlots] = useState<readonly Slot[]>([emptySlot("lease")]);
  const [nextKey, setNextKey] = useState(2);
  const [choices, setChoices] = useState<ReferenceChoices>({});
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  const working = phase.kind === "working";
  const reading = slots.some((slot) => slot.file.kind === "reading");

  function updateSlot(index: number, change: Partial<Slot>) {
    setSlots((current) =>
      current.map((slot, at) => (at === index ? { ...slot, ...change } : slot)),
    );
  }

  function addDocument() {
    setSlots((current) => [...current, emptySlot(`document-${nextKey}`)]);
    setNextKey((key) => key + 1);
    // The packet changed, so answers about the old one no longer describe it.
    setChoices({});
  }

  function removeDocument(index: number) {
    setSlots((current) => current.filter((_, at) => at !== index));
    setChoices({});
  }

  async function readFile(index: number, chosen: File) {
    setPhase({ kind: "idle" });
    updateSlot(index, { file: { kind: "reading", fileName: chosen.name } });

    let extraction: PdfExtraction;
    try {
      extraction = await extractPdfText(await chosen.arrayBuffer());
    } catch {
      extraction = { kind: "unreadable", reason: "not-a-pdf" };
    }

    if (extraction.kind !== "text") {
      updateSlot(index, {
        file: {
          kind: "rejected",
          fileName: chosen.name,
          message: rejectionFor(extraction),
        },
      });
      return;
    }

    updateSlot(index, {
      text: extraction.text,
      title: chosen.name,
      file: {
        kind: "read",
        fileName: chosen.name,
        pageCount: extraction.pageCount,
      },
    });
  }

  const send = useCallback(
    async (packet: readonly Slot[], answers: ReferenceChoices) => {
      const [lease, ...rest] = packet;
      const leaseTitle = lease.title.trim();
      const referenced = rest
        .filter((slot) => slot.text.trim().length > 0)
        .map((slot, index) => ({
          text: slot.text,
          title: slot.title.trim() || `Document ${index + 2}`,
        }));
      const resolutions = Object.entries(answers).map(([referenceId, documentId]) => ({
        referenceId,
        documentId,
      }));

      setPhase({ kind: "working" });

      let outcome: AnalysisOutcome;
      try {
        const response = await fetch("/api/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Text, and the names the signer gave it. The bytes are long gone.
          body: JSON.stringify({
            text: lease.text,
            ...(leaseTitle ? { title: leaseTitle } : {}),
            ...(referenced.length > 0 ? { referenced } : {}),
            ...(resolutions.length > 0 ? { resolutions } : {}),
          }),
        });
        outcome = (await response.json()) as AnalysisOutcome;
      } catch {
        setPhase({
          kind: "problem",
          message: "The review didn't reach us. Check your connection and send it again.",
        });
        return;
      }

      if (outcome.status === "blocked") {
        setPhase({
          kind: "blocked",
          completeness: outcome.completeness,
          documents: outcome.documents,
        });
        return;
      }

      if (outcome.status === "reviewed") {
        setPhase({
          kind: "reviewed",
          review: outcome.review,
          completeness: outcome.completeness,
          documents: outcome.documents,
          reviewId: outcome.reviewId,
        });
        return;
      }

      setPhase({
        kind: "problem",
        message:
          outcome.status === "rejected"
            ? REJECTION_MESSAGE[outcome.reason]
            : FAILURE_MESSAGE[outcome.reason],
      });
    },
    [],
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (reading) return;
    if (slots[0].text.trim().length === 0) {
      setPhase({ kind: "problem", message: REJECTION_MESSAGE["empty-text"] });
      return;
    }
    await send(slots, choices);
  }

  function choose(referenceId: string, documentId: string | null) {
    setChoices((current) => ({ ...current, [referenceId]: documentId }));
  }

  async function recheck() {
    if (reading) return;
    await send(slots, choices);
  }

  return (
    <div className="flex flex-col gap-10">
      <form onSubmit={submit} className="flex flex-col gap-6">
        {slots.map((slot, index) => (
          <DocumentSlot
            key={slot.key}
            position={index + 1}
            title={slot.title}
            text={slot.text}
            file={slot.file}
            busy={working}
            onTitle={(title) => updateSlot(index, { title })}
            onText={(text) =>
              // Typed-over text is no longer the file's, so the file note goes.
              updateSlot(index, { text, file: { kind: "none" } })
            }
            onFile={(chosen) => readFile(index, chosen)}
            onRemove={index === 0 ? undefined : () => removeDocument(index)}
          />
        ))}

        <div className="flex flex-col gap-3">
          <p className="max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
            If your lease points at a fee schedule, building rules, or an
            addendum, add each one here. We check what the lease asks for
            before we read any of it.
          </p>
          <button
            type="button"
            onClick={addDocument}
            disabled={working || reading || slots.length >= MAXIMUM_PACKET_DOCUMENTS}
            className="self-start border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-5 py-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-navy)] transition-colors hover:bg-[var(--color-paper-deep)] disabled:opacity-70"
          >
            Add another document
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={working || reading}
            className="inline-flex items-center justify-center bg-[var(--color-navy)] px-6 py-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-paper)] transition-colors hover:bg-[var(--color-navy-ink)] disabled:opacity-70"
          >
            {working ? "Reading your lease" : "Read my lease"}
          </button>
          <p className="font-[family-name:var(--font-data)] text-xs uppercase tracking-wide text-[var(--color-navy)]">
            {persists ? "Kept in your library" : "Not saved by Blueline"}
          </p>
        </div>
      </form>

      <div aria-live="polite" className="empty:hidden">
        {working ? (
          <div className="border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-6 py-5">
            <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]">
              Reading your agreement
            </p>
            <p className="mt-3 max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
              First we check what your lease points at, then we read the whole
              agreement and match every quotation to your own text. You
              don&apos;t have to do anything while it runs. It takes a minute
              or so.
            </p>
          </div>
        ) : null}

        {phase.kind === "problem" ? (
          <p className="border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] px-5 py-4 font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)]">
            {phase.message}
          </p>
        ) : null}
      </div>

      {phase.kind === "blocked" ? (
        <BlockedPacket
          key={phase.completeness.missing.map((reference) => reference.id).join("|")}
          completeness={phase.completeness}
          documents={phase.documents}
          choices={choices}
          onChoose={choose}
          onRecheck={recheck}
          busy={working}
        />
      ) : null}

      {phase.kind === "reviewed" ? (
        <div className="flex flex-col gap-10">
          {phase.completeness.matches.length > 0 ? (
            <section
              aria-labelledby="reference-ledger-heading"
              className="flex flex-col gap-6"
            >
              <div>
                <h2
                  id="reference-ledger-heading"
                  className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)]"
                >
                  What your lease points at
                </h2>
                <p className="mt-3 max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
                  We matched these by reading titles and opening lines, which
                  is a guess. If we got one wrong, change it and check the
                  packet again.
                </p>
              </div>
              <ReferenceLedger
                completeness={phase.completeness}
                documents={phase.documents}
                choices={choices}
                onChoose={choose}
                busy={working}
              />
              <button
                type="button"
                onClick={recheck}
                disabled={working}
                className="self-start border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-5 py-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-navy)] transition-colors hover:bg-[var(--color-paper-deep)] disabled:opacity-70"
              >
                Check the packet again
              </button>
            </section>
          ) : null}

          <ReviewResult review={phase.review} documents={phase.documents} reviewId={phase.reviewId} />

          {phase.reviewId ? (
            <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]">
              <Link
                href={`/review/${phase.reviewId}`}
                className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wide text-[var(--color-navy)] underline decoration-2 underline-offset-4 hover:text-[var(--color-red-ink)]"
              >
                Open this review on its own page
              </Link>
              . It is in your library, and the link keeps working after you
              close the tab.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
