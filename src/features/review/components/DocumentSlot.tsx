"use client";

import { useId } from "react";

const BUTTON =
  "inline-flex min-h-11 cursor-pointer items-center justify-center border-2 border-[var(--color-navy)] px-4 py-2 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-[var(--color-red)] peer-disabled:cursor-not-allowed peer-disabled:opacity-60";

export interface FilePickerProps {
  /** What the button says. */
  readonly label: string;
  /** Read by screen readers after the label, so two pickers never share a name. */
  readonly labelSuffix?: string;
  readonly onFiles: (files: readonly File[]) => void;
  readonly disabled?: boolean;
  readonly multiple?: boolean;
  readonly primary?: boolean;
  readonly invalid?: boolean;
  readonly describedBy?: string;
  /** Focus the picker on mount, e.g. when returning to add a missing document. */
  readonly autoFocus?: boolean;
}

/**
 * A PDF picker drawn as a button. The real file input sits under the label,
 * so it keeps the browser's own keyboard and screen reader behaviour, and the
 * label shows the focus ring when the input has focus.
 *
 * The chosen file is handed straight to the caller to be read in this
 * browser. There is no form field here that could send it anywhere.
 */
export function FilePicker({
  label,
  labelSuffix,
  onFiles,
  disabled = false,
  multiple = false,
  primary = false,
  invalid = false,
  describedBy,
  autoFocus = false,
}: FilePickerProps) {
  const id = useId();

  function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    // Lets the same file be chosen again after a problem is fixed.
    event.target.value = "";
    if (files.length > 0) onFiles(files);
  }

  return (
    <span className="inline-flex">
      <input
        id={id}
        type="file"
        accept="application/pdf,.pdf"
        multiple={multiple}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoFocus={autoFocus}
        onChange={choose}
        className="peer sr-only"
      />
      <label
        htmlFor={id}
        className={`${BUTTON} ${
          primary
            ? "bg-[var(--color-navy)] text-[var(--color-paper)] hover:bg-[var(--color-navy-ink)]"
            : "bg-[var(--color-paper)] text-[var(--color-navy)] hover:bg-[var(--color-paper-deep)]"
        }`}
      >
        {label}
        {labelSuffix ? <span className="sr-only"> {labelSuffix}</span> : null}
      </label>
    </span>
  );
}

export interface DocumentRowProps {
  readonly title: string;
  readonly detail: string;
  readonly onRemove?: () => void;
  readonly removeLabel?: string;
  readonly disabled?: boolean;
}

/** One chosen document: what it's called and where it came from. */
export function DocumentRow({ title, detail, onRemove, removeLabel, disabled }: DocumentRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-4 py-3">
      <div className="min-w-0">
        <p className="font-[family-name:var(--font-display)] text-base font-bold leading-snug text-[var(--color-navy-ink)] [overflow-wrap:anywhere]">
          {title}
        </p>
        <p className="font-[family-name:var(--font-data)] text-xs text-[var(--color-navy)] [overflow-wrap:anywhere]">
          {detail}
        </p>
      </div>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={removeLabel}
          className="min-h-11 font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-wide text-[var(--color-navy)] underline decoration-2 underline-offset-4 hover:text-[var(--color-red-ink)] disabled:opacity-60"
        >
          Remove
        </button>
      ) : null}
    </div>
  );
}

export interface FileProblemProps {
  readonly id?: string;
  readonly fileName: string;
  readonly message: string;
  readonly onDismiss?: () => void;
}

/** A file that couldn't join the packet, with the fix. Never shaped like a review. */
export function FileProblem({ id, fileName, message, onDismiss }: FileProblemProps) {
  return (
    <div id={id} className="border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] px-4 py-3">
      <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)] [overflow-wrap:anywhere]">
        Can&apos;t use {fileName}
      </p>
      <p className="mt-2 max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
        {message}
      </p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="mt-2 min-h-11 font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-wide text-[var(--color-navy)] underline decoration-2 underline-offset-4 hover:text-[var(--color-red-ink)]"
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}
