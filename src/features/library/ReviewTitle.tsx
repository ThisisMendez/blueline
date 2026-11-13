"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";

import { MAXIMUM_REVIEW_TITLE_LENGTH, normaliseTypedTitle } from "@/features/review/title";

import type { RenameFailure, RenameOutcome } from "./rename-route";

const ERROR_COPY: Record<RenameFailure, string> = {
  "sign-in-required": "Sign in again to rename this review.",
  "accounts-unavailable": "Renaming isn't available because accounts aren't set up here.",
  "not-found": "This review has expired or isn't available.",
  "invalid-title": `Use 1 to ${MAXIMUM_REVIEW_TITLE_LENGTH} characters.`,
  "invalid-request": "That didn't send properly. Reload the page and try again.",
  "storage-unavailable": "The new name wasn't saved. Try again.",
};

const SMALL_BUTTON =
  "min-h-11 font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-wide text-[var(--color-navy)] underline decoration-2 underline-offset-4 hover:text-[var(--color-red-ink)] disabled:opacity-60";

/** A library line's title, linking to the review, with a way to rename it. */
export function ReviewTitle({ reviewId, title: initial }: { readonly reviewId: string; readonly title: string }) {
  const [title, setTitle] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();
  const renameButton = useRef<HTMLButtonElement>(null);

  function open() {
    setDraft(title);
    setError(null);
    setEditing(true);
  }

  function close() {
    setEditing(false);
    setError(null);
    // Put focus back where the signer started.
    requestAnimationFrame(() => renameButton.current?.focus());
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const next = normaliseTypedTitle(draft);
    if (!next) {
      setError(ERROR_COPY["invalid-title"]);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/library/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, title: next }),
      });
      const outcome = (await response.json()) as RenameOutcome;
      if (outcome.status === "renamed") {
        setTitle(outcome.title);
        close();
      } else {
        setError(ERROR_COPY[outcome.reason]);
      }
    } catch {
      setError(ERROR_COPY["storage-unavailable"]);
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <form onSubmit={save} className="flex flex-col gap-2">
        <label
          htmlFor={inputId}
          className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]"
        >
          New name for {title}
        </label>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <input
            id={inputId}
            type="text"
            value={draft}
            autoFocus
            maxLength={MAXIMUM_REVIEW_TITLE_LENGTH}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") close();
            }}
            className="min-h-11 w-full max-w-md border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-3 py-2 font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)]"
          />
          <button
            type="submit"
            disabled={busy}
            className="min-h-11 border-2 border-[var(--color-navy)] bg-[var(--color-navy)] px-4 py-2 font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-wide text-[var(--color-paper)] hover:bg-[var(--color-navy-ink)] disabled:opacity-60"
          >
            {busy ? "Saving" : "Save name"}
          </button>
          <button type="button" onClick={close} disabled={busy} className={SMALL_BUTTON}>
            Cancel
          </button>
        </div>
        {error ? (
          <p id={errorId} role="alert" className="font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]">
            {error}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-4">
      <Link
        href={`/review/${reviewId}`}
        className="font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)] underline decoration-2 underline-offset-4 hover:text-[var(--color-red-ink)] [overflow-wrap:anywhere]"
      >
        {title}
      </Link>
      <button ref={renameButton} type="button" onClick={open} aria-label={`Rename ${title}`} className={SMALL_BUTTON}>
        Rename
      </button>
    </div>
  );
}
