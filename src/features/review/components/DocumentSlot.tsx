"use client";

import { useId } from "react";

/**
 * The file control's own state. A rejected file is its own outcome, sitting
 * with the control that produced it, and never reaches the review area.
 */
export type FileState =
  | { readonly kind: "none" }
  | { readonly kind: "reading"; readonly fileName: string }
  | { readonly kind: "read"; readonly fileName: string; readonly pageCount: number }
  | { readonly kind: "rejected"; readonly fileName: string; readonly message: string };

export interface DocumentSlotProps {
  /** Where this document sits in the packet. The lease is 1. */
  readonly position: number;
  readonly title: string;
  readonly text: string;
  readonly file: FileState;
  readonly busy: boolean;
  readonly onTitle: (title: string) => void;
  readonly onText: (text: string) => void;
  readonly onFile: (file: File) => void;
  /** Absent on the lease, which is the one document a packet must have. */
  readonly onRemove?: () => void;
}

/**
 * One document in the packet: a name for it, its text, and the PDF reader
 * that can fill the text in.
 *
 * Every slot works the same way the single lease box worked before, because
 * it is the same box. A PDF chosen here is opened in the signer's browser
 * and only the characters that come out of it go anywhere; there is no field
 * on this form that could carry the file.
 */
export function DocumentSlot({
  position,
  title,
  text,
  file,
  busy,
  onTitle,
  onText,
  onFile,
  onRemove,
}: DocumentSlotProps) {
  const titleId = useId();
  const textareaId = useId();
  const fileId = useId();
  const fileHintId = useId();
  const fileStatusId = useId();
  const headingId = useId();

  const lease = position === 1;
  const titleLabel = lease ? "Name for your lease" : `Name for document ${position}`;
  const textLabel = lease ? "Paste your lease" : `Paste document ${position}`;
  const fileLabel = lease ? "Open a PDF instead" : `Open a PDF for document ${position}`;
  const reading = file.kind === "reading";

  async function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0];
    // Let the same file be chosen again after a rejection.
    event.target.value = "";
    if (chosen) onFile(chosen);
  }

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className="flex flex-col gap-4 border-2 border-[var(--color-navy)] bg-[var(--color-paper)] p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2
          id={headingId}
          className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]"
        >
          {lease ? "Document 1: your lease" : `Document ${position}`}
        </h2>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={busy || reading}
            className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-wide text-[var(--color-navy)] underline decoration-2 underline-offset-4 hover:text-[var(--color-navy-ink)] disabled:opacity-70"
          >
            Remove document {position}
          </button>
        ) : null}
      </div>

      <label
        htmlFor={titleId}
        className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]"
      >
        {titleLabel}
      </label>
      <input
        id={titleId}
        type="text"
        value={title}
        maxLength={200}
        placeholder={lease ? "Lease text you pasted" : "Schedule of fees"}
        onChange={(event) => onTitle(event.target.value)}
        className="w-full max-w-[var(--measure)] border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-3 py-2 font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)]"
      />

      <label
        htmlFor={textareaId}
        className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]"
      >
        {textLabel}
      </label>
      {lease ? (
        <p className="max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
          All of it, start to finish. Anything you leave out is something we
          cannot read for you.
        </p>
      ) : null}
      <textarea
        id={textareaId}
        name={lease ? "text" : `text-${position}`}
        rows={lease ? 14 : 8}
        value={text}
        onChange={(event) => onText(event.target.value)}
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
        {fileLabel}
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
        name={lease ? "pdf" : `pdf-${position}`}
        accept="application/pdf,.pdf"
        disabled={reading || busy}
        aria-describedby={`${fileHintId} ${fileStatusId}`}
        aria-invalid={file.kind === "rejected"}
        onChange={choose}
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
    </div>
  );
}
