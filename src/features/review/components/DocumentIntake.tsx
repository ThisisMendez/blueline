"use client";

import Link from "next/link";
import { useId, useState } from "react";

import type {
  AnalysisFailure,
  AnalysisOutcome,
  AnalysisRejection,
} from "@/features/analysis/types";
import type { ExtractedDocument } from "@/features/packet/types";
import type { GeneralReview } from "@/features/analysis/types";
import { extractPdfText, type PdfExtraction } from "@/features/packet/extract/pdf";

import { ReviewResult } from "./ReviewResult";

const FAILURE_MESSAGE: Record<AnalysisFailure, string> = {
  "model-not-configured":
    "The reading service isn't set up on this deployment, so the review can't run.",
  "model-timeout": "The reading took too long and stopped. Try it again.",
  "model-rate-limited": "Too many reviews are running at once. Give it a minute and try again.",
  "model-unavailable": "The reading service didn't answer. Try it again in a moment.",
  "model-unreadable": "The answer came back garbled, so there was nothing worth showing you.",
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

type Phase =
  | { readonly kind: "idle" }
  | { readonly kind: "working" }
  | {
      readonly kind: "reviewed";
      readonly review: GeneralReview;
      readonly documents: readonly ExtractedDocument[];
      readonly reviewId: string | null;
    }
  | { readonly kind: "problem"; readonly message: string };

/**
 * The file control's own state. A rejected file is its own outcome, sitting
 * with the control that produced it, and never reaches the review area.
 */
type FileState =
  | { readonly kind: "none" }
  | { readonly kind: "reading"; readonly fileName: string }
  | { readonly kind: "read"; readonly fileName: string; readonly pageCount: number }
  | { readonly kind: "rejected"; readonly fileName: string; readonly message: string };

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
 * Paste or choose a PDF, send, read.
 *
 * A chosen PDF is opened here, in the signer's browser, and only the text
 * that comes out of it travels any further — into the box the signer can see
 * and correct, and from there to the analysis route, which accepts nothing
 * but text. The file itself is never uploaded, never posted and never
 * stored; there is no field to put it in.
 */
export function DocumentIntake({ persists }: DocumentIntakeProps) {
  const textareaId = useId();
  const fileId = useId();
  const fileHintId = useId();
  const fileStatusId = useId();

  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<FileState>({ kind: "none" });
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  async function chooseFile(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0];
    // Let the same file be chosen again after a rejection.
    event.target.value = "";
    if (!chosen) return;

    setPhase({ kind: "idle" });
    setFile({ kind: "reading", fileName: chosen.name });

    let extraction: PdfExtraction;
    try {
      extraction = await extractPdfText(await chosen.arrayBuffer());
    } catch {
      extraction = { kind: "unreadable", reason: "not-a-pdf" };
    }

    if (extraction.kind !== "text") {
      setFileName(null);
      setFile({
        kind: "rejected",
        fileName: chosen.name,
        message: rejectionFor(extraction),
      });
      return;
    }

    setText(extraction.text);
    setFileName(chosen.name);
    setFile({
      kind: "read",
      fileName: chosen.name,
      pageCount: extraction.pageCount,
    });
  }

  function editText(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(event.target.value);
    // Once the text has been edited by hand it is no longer the file's.
    setFileName(null);
    setFile({ kind: "none" });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (file.kind === "reading") return;
    if (text.trim().length === 0) {
      setPhase({ kind: "problem", message: REJECTION_MESSAGE["empty-text"] });
      return;
    }

    setPhase({ kind: "working" });

    let outcome: AnalysisOutcome;
    try {
      const response = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Text, and a name for it. The bytes the signer chose are long gone.
        body: JSON.stringify(fileName ? { text, title: fileName } : { text }),
      });
      outcome = (await response.json()) as AnalysisOutcome;
    } catch {
      setPhase({
        kind: "problem",
        message: "The review didn't reach us. Check your connection and send it again.",
      });
      return;
    }

    if (outcome.status === "reviewed") {
      setPhase({
        kind: "reviewed",
        review: outcome.review,
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
  }

  const working = phase.kind === "working";
  const reading = file.kind === "reading";

  return (
    <div className="flex flex-col gap-10">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label
          htmlFor={textareaId}
          className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]"
        >
          Paste your lease
        </label>
        <p className="max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
          All of it, start to finish. Anything you leave out is something we
          cannot read for you.
        </p>
        <textarea
          id={textareaId}
          name="text"
          rows={14}
          value={text}
          onChange={editText}
          spellCheck={false}
          className="w-full border-2 border-[var(--color-navy)] bg-[var(--color-paper)] p-4 font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]"
        />

        <div className="flex items-center gap-4 pt-2">
          <span className="h-0.5 flex-1 bg-[var(--color-navy)]" aria-hidden="true" />
          <span className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]">
            or
          </span>
          <span className="h-0.5 flex-1 bg-[var(--color-navy)]" aria-hidden="true" />
        </div>

        <label
          htmlFor={fileId}
          className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]"
        >
          Open a PDF instead
        </label>
        <p
          id={fileHintId}
          className="max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]"
        >
          It has to be a PDF you can select text in. A scan or a photo of the
          pages is a picture, and a picture has no sentences to quote. The file
          stays on your computer. What we pull out of it lands in the box
          above, and that is the only part that gets sent or kept.
        </p>
        <input
          id={fileId}
          type="file"
          name="pdf"
          accept="application/pdf,.pdf"
          disabled={reading || working}
          aria-describedby={`${fileHintId} ${fileStatusId}`}
          aria-invalid={file.kind === "rejected"}
          onChange={chooseFile}
          className="block w-full max-w-[var(--measure)] cursor-pointer border-2 border-[var(--color-navy)] bg-[var(--color-paper)] p-3 font-[family-name:var(--font-data)] text-xs uppercase tracking-wide text-[var(--color-navy)] file:mr-4 file:cursor-pointer file:border-0 file:bg-[var(--color-navy)] file:px-4 file:py-2 file:font-[family-name:var(--font-display)] file:text-xs file:font-bold file:uppercase file:tracking-wide file:text-[var(--color-paper)] disabled:opacity-70"
        />

        <div id={fileStatusId} aria-live="polite" className="empty:hidden">
          {file.kind === "reading" ? (
            <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)]">
              Reading the text out of {file.fileName}.
            </p>
          ) : null}

          {file.kind === "read" ? (
            <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)]">
              Read {file.pageCount === 1 ? "1 page" : `${file.pageCount} pages`} of{" "}
              {file.fileName}. The text is in the box above. Check it, then
              send it.
            </p>
          ) : null}

          {file.kind === "rejected" ? (
            <div className="max-w-[var(--measure)] border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] px-5 py-4">
              <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]">
                Nothing to read in {file.fileName}
              </p>
              <p className="mt-3 font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
                {file.message}
              </p>
            </div>
          ) : null}
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
            {persists ? "Kept in your library" : "Not kept anywhere"}
          </p>
        </div>
      </form>

      <div aria-live="polite" className="flex flex-col gap-10">
        {working ? (
          <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)]">
            Reading the text and checking every quotation against it. This
            takes a minute or so.
          </p>
        ) : null}

        {phase.kind === "problem" ? (
          <p className="border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] px-5 py-4 font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)]">
            {phase.message}
          </p>
        ) : null}

        {phase.kind === "reviewed" ? (
          <>
            <ReviewResult review={phase.review} documents={phase.documents} />
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
          </>
        ) : null}
      </div>
    </div>
  );
}
