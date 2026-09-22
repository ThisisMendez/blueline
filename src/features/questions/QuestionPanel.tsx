"use client";

import { useState, type FormEvent } from "react";
import type { ExtractedDocument } from "@/features/packet/types";
import { NOT_ADDRESSED, type QuestionOutcome } from "./contract";

const FAILURE_COPY: Record<string, string> = {
  "not-configured": "Questions are unavailable because the review service is not configured.",
  "timeout": "The answer took too long. Try again.",
  "rate-limited": "The review service is busy. Try again shortly.",
  "verification-failed": "We could not verify the answer against your documents. Try again.",
  "unreadable": "The answer did not have the expected format. Try again.",
  "unavailable": "The review service could not answer. Try again.",
};

export function QuestionPanel({ documents }: { readonly documents: readonly ExtractedDocument[] }) {
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<QuestionOutcome | null>(null);

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim() || pending) return;
    setPending(true);
    setOutcome(null);
    setSubmitted(question.trim());
    try {
      const response = await fetch("/api/questions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), documents }),
      });
      setOutcome(await response.json() as QuestionOutcome);
    } catch {
      setOutcome({ status: "failed", reason: "unavailable" });
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="questions-heading" className="border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-6 sm:p-8">
      <h2 id="questions-heading" className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-navy-ink)]">Ask about your agreement</h2>
      <p className="mt-3 font-[family-name:var(--font-body)] text-base leading-relaxed">Ask a question and we will find the sentences that answer it across your documents. If the agreement does not address it, we will say so.</p>
      <form onSubmit={ask} className="mt-6 flex flex-col gap-3">
        <label htmlFor="lease-question" className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide">Your question</label>
        <textarea id="lease-question" value={question} onChange={(event) => setQuestion(event.target.value)} required maxLength={2000} rows={3} disabled={pending} className="w-full border-2 border-[var(--color-navy)] bg-[var(--color-paper)] p-3 font-[family-name:var(--font-body)] text-base" />
        <button type="submit" disabled={pending || !question.trim()} className="self-start bg-[var(--color-navy)] px-5 py-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-paper)] hover:bg-[var(--color-navy-ink)] disabled:opacity-70">{pending ? "Finding the answer" : "Ask about this agreement"}</button>
      </form>
      <div aria-live="polite" aria-busy={pending} className="mt-5 font-[family-name:var(--font-body)] text-base leading-relaxed">
        {pending ? <p>Checking the complete agreement for an answer.</p> : null}
        {outcome?.status === "answered" ? (
          <div className="flex flex-col gap-4">
            <p className="font-semibold">For “{submitted}”, the agreement says:</p>
            {outcome.citations.map((citation, index) => (
              <div key={`${citation.sourceDocumentId}-${citation.sourceStart}-${index}`} className="border-2 border-[var(--color-navy)] bg-[var(--color-paper)] p-4">
                <blockquote>{citation.sourceSentence}</blockquote>
                <p className="mt-3 font-[family-name:var(--font-data)] text-xs uppercase tracking-wide">Source: {documents.find((document) => document.id === citation.sourceDocumentId)?.title ?? citation.sourceDocumentId}, characters {citation.sourceStart} to {citation.sourceEnd}</p>
              </div>
            ))}
          </div>
        ) : null}
        {outcome?.status === "not-addressed" ? <p>{NOT_ADDRESSED}</p> : null}
        {outcome?.status === "blocked" ? <p>Add the missing documents before asking: {outcome.missing.join(", ")}.</p> : null}
        {outcome?.status === "failed" ? <p role="alert">{FAILURE_COPY[outcome.reason] ?? FAILURE_COPY.unavailable}</p> : null}
        {outcome?.status === "rejected" ? <p role="alert">We could not read this question and packet. Reload the review and try again.</p> : null}
      </div>
    </section>
  );
}
