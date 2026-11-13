"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type ReactNode } from "react";

import type { ReviewRole } from "@/features/analysis/types";
import { readPdfFile, type PdfProblem } from "@/features/packet/extract/file";
import { MAXIMUM_PACKET_DOCUMENTS } from "@/features/packet/types";

import { PDF_PROBLEM_MESSAGE } from "../session/messages";
import { useReviewSession } from "../session/ReviewSessionProvider";
import { leaseOf, supportingOf, type SessionDocument } from "../session/store";
import { generateReviewTitle, readableFileName } from "../title";

import { DocumentRow, FilePicker, FileProblem } from "./DocumentSlot";

const ROLES: readonly (readonly [ReviewRole, string])[] = [
  ["renter", "I’m a renter"],
  ["landlord", "I’m a landlord"],
];

/** A file being read, or one that couldn't be used. Read files live in the session. */
interface PendingFile {
  readonly key: string;
  readonly target: "lease" | "supporting";
  readonly fileName: string;
  readonly problem: PdfProblem | null;
}

let nextKey = 0;
function newKey(prefix: string): string {
  nextKey += 1;
  return `${prefix}-${nextKey}`;
}

function pages(count: number): string {
  return count === 1 ? "1 page" : `${count} pages`;
}

export interface DocumentIntakeProps {
  /** True when a finished review is kept in the signer's library. */
  readonly persists: boolean;
  /** What happens to the documents on send, shown beside the button that sends them. */
  readonly notice?: ReactNode;
}

/**
 * The packet: which side the signer is on, the lease, and the documents it
 * refers to.
 *
 * Every PDF is opened in the signer's browser and reduced to text before
 * anything leaves the page. Choosing files only prepares the packet; "Read
 * my lease" is the one action that sends it, and it moves the signer to the
 * processing page.
 */
export function DocumentIntake({ persists, notice }: DocumentIntakeProps) {
  const router = useRouter();
  const { state, actions } = useReviewSession();
  const [pending, setPending] = useState<readonly PendingFile[]>([]);
  const leaseHintId = useId();
  const leaseProblemId = useId();

  const lease = leaseOf(state);
  // Returning with a lease already chosen means the user came back to add a document.
  const [returnedWithLease] = useState(() => lease !== null && lease !== undefined);
  const supporting = supportingOf(state);
  const processing = state.status === "processing";
  const reading = pending.some((file) => file.problem === null);
  const leasePending = pending.find((file) => file.target === "lease") ?? null;
  const supportingPending = pending.filter((file) => file.target === "supporting");
  const room = MAXIMUM_PACKET_DOCUMENTS - state.documents.length - supportingPending.length;

  function settle(key: string, problem: PdfProblem | null) {
    setPending((current) =>
      problem === null
        ? current.filter((file) => file.key !== key)
        : current.map((file) => (file.key === key ? { ...file, problem } : file)),
    );
  }

  async function read(file: File, target: "lease" | "supporting", position: number) {
    const key = newKey("file");
    setPending((current) => [
      // A new lease file replaces any earlier lease problem.
      ...current.filter((entry) => target === "supporting" || entry.target !== "lease"),
      { key, target, fileName: file.name, problem: null },
    ]);

    const reading = await readPdfFile(file);
    if (reading.kind === "problem") {
      settle(key, reading.problem);
      return;
    }

    const document: SessionDocument = {
      id: newKey(target === "lease" ? "lease" : "document"),
      kind: target,
      fileName: file.name,
      pageCount: reading.pageCount,
      text: reading.text,
      title:
        target === "lease"
          ? generateReviewTitle({ text: reading.text, fileName: file.name })
          : readableFileName(file.name) ?? `Document ${position}`,
    };
    settle(key, null);
    if (target === "lease") actions.setLease(document);
    else actions.addSupporting(document);
  }

  function chooseLease(files: readonly File[]) {
    void read(files[0], "lease", 1);
  }

  function addSupporting(files: readonly File[]) {
    files.slice(0, Math.max(room, 0)).forEach((file, index) => {
      void read(file, "supporting", state.documents.length + supportingPending.length + index + 1);
    });
  }

  function submit() {
    if (!state.role || !lease || reading || processing) return;
    void actions.start();
    router.push("/review/processing");
  }

  function startOver() {
    setPending([]);
    actions.reset();
  }

  const leaseProblem = leasePending?.problem ?? null;
  const reportHref =
    state.outcome?.status === "reviewed" && state.outcome.reviewId && state.outcome.persisted
      ? `/review/${state.outcome.reviewId}`
      : "/review/report";

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10">
      <section aria-labelledby="review-role-heading" className="flex flex-col gap-4">
        <h2
          id="review-role-heading"
          className="font-[family-name:var(--font-display)] text-xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-2xl"
        >
          Which side of the lease are you on?
        </h2>
        <div className="flex flex-wrap gap-3 md:flex-col md:items-stretch">
          {ROLES.map(([value, label]) => {
            const selected = state.role === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                disabled={processing}
                onClick={() => actions.chooseRole(value)}
                className={`min-h-11 border-2 border-[var(--color-navy)] px-5 py-3 text-left font-[family-name:var(--font-display)] font-bold transition-colors disabled:opacity-60 ${
                  selected
                    ? "bg-[var(--color-navy)] text-[var(--color-paper)]"
                    : "bg-[var(--color-paper)] text-[var(--color-navy)] hover:bg-[var(--color-paper-deep)]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {state.role ? (
          <p className="font-[family-name:var(--font-data)] text-xs uppercase tracking-wide text-[var(--color-navy)]">
            Reviewing as {state.role === "renter" ? "a renter" : "a landlord"}
          </p>
        ) : null}
      </section>

      {state.role ? (
        <section aria-labelledby="packet-heading" className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h2
              id="packet-heading"
              className="font-[family-name:var(--font-display)] text-xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-2xl"
            >
              Your lease
            </h2>
            <p
              id={leaseHintId}
              className="max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]"
            >
              Choose a PDF with text you can select. The file stays on your
              device, and we send only its text.
            </p>
            {lease ? (
              <DocumentRow
                title={lease.title}
                detail={`${lease.fileName} · ${pages(lease.pageCount)}`}
              />
            ) : null}
            <div aria-live="polite" className="flex flex-col gap-3 empty:hidden">
              {leasePending && leaseProblem === null ? (
                <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)]">
                  Reading {leasePending.fileName}…
                </p>
              ) : null}
              {leasePending && leaseProblem ? (
                <FileProblem
                  id={leaseProblemId}
                  fileName={leasePending.fileName}
                  message={PDF_PROBLEM_MESSAGE[leaseProblem]}
                />
              ) : null}
            </div>
            <div>
              <FilePicker
                label={lease ? "Choose a different file" : "Choose file"}
                labelSuffix="for your lease"
                primary={!lease}
                disabled={processing || leasePending?.problem === null}
                invalid={leaseProblem !== null}
                describedBy={leaseProblem ? `${leaseHintId} ${leaseProblemId}` : leaseHintId}
                onFiles={chooseLease}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t-2 border-[var(--color-navy)] pt-5">
            <h3 className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]">
              Documents your lease mentions
            </h3>
            <p className="max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
              Add any fee list, rules, addendum, or other document the lease
              refers to. We check that nothing is missing before we read it.
            </p>
            {supporting.length > 0 || supportingPending.length > 0 ? (
              <ul aria-label="Other documents" className="flex list-none flex-col gap-3 p-0">
                {supporting.map((document) => (
                  <li key={document.id}>
                    <DocumentRow
                      title={document.title}
                      detail={`${document.fileName} · ${pages(document.pageCount)}`}
                      removeLabel={`Remove ${document.title}`}
                      disabled={processing}
                      onRemove={() => actions.removeDocument(document.id)}
                    />
                  </li>
                ))}
                {supportingPending.map((file) => (
                  <li key={file.key} aria-live="polite">
                    {file.problem ? (
                      <FileProblem
                        fileName={file.fileName}
                        message={PDF_PROBLEM_MESSAGE[file.problem]}
                        onDismiss={() => setPending((current) => current.filter((entry) => entry.key !== file.key))}
                      />
                    ) : (
                      <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)]">
                        Reading {file.fileName}…
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
            <div>
              <FilePicker
                label="Add another PDF"
                multiple
                autoFocus={returnedWithLease}
                disabled={processing || room <= 0}
                onFiles={addSupporting}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t-2 border-[var(--color-navy)] pt-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <button
                type="button"
                onClick={submit}
                disabled={!lease || reading || processing}
                className="inline-flex min-h-11 items-center justify-center bg-[var(--color-navy)] px-6 py-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-paper)] transition-colors hover:bg-[var(--color-navy-ink)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Read my lease
              </button>
              <p className="font-[family-name:var(--font-data)] text-xs uppercase tracking-wide text-[var(--color-navy)]">
                {persists ? "Saved to your library" : "Not saved by Blueline"}
              </p>
            </div>
            {notice ? (
              <div className="flex max-w-[var(--measure)] flex-col gap-2 font-[family-name:var(--font-body)] text-sm leading-relaxed text-[var(--color-navy-ink)]">
                {notice}
              </div>
            ) : null}
            {!lease && !leasePending ? (
              <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]">
                Choose your lease to continue.
              </p>
            ) : null}
            {processing ? (
              <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]">
                We&apos;re reading this lease now.{" "}
                <Link href="/review/processing" className="underline decoration-2 underline-offset-4">
                  Check progress
                </Link>
              </p>
            ) : null}
            {state.status === "reviewed" ? (
              <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]">
                Your report on this lease is ready.{" "}
                <Link href={reportHref} className="underline decoration-2 underline-offset-4">
                  Open the report
                </Link>
              </p>
            ) : null}
            {state.documents.length > 0 && !processing ? (
              <button
                type="button"
                onClick={startOver}
                className="self-start min-h-11 font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-wide text-[var(--color-navy)] underline decoration-2 underline-offset-4 hover:text-[var(--color-red-ink)]"
              >
                Clear and start over
              </button>
            ) : null}
          </div>
        </section>
      ) : (
        <p className="hidden self-center font-[family-name:var(--font-body)] text-base text-[var(--color-navy)] md:block">
          Pick a side to add your lease.
        </p>
      )}
    </div>
  );
}
