"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { ExtractedDocument } from "@/features/packet/types";
import { redLinesSchema, type PreferenceMatch, type RedLineOutcome } from "./contract";

const ERRORS: Record<string, string> = {
  "accounts-unavailable": "Personal red lines are unavailable because accounts are not configured.",
  "sign-in-required": "Sign in again to use your personal red lines.",
  "storage-unavailable": "Your saved red lines could not be read or updated. Try again.",
  "review-not-found": "This review is no longer available in your account.",
  "invalid-request": "Use up to 20 red lines, with no more than 500 characters on each line.",
  "not-configured": "The model is not configured to check red lines.",
  "rate-limited": "The review service is busy. Try again shortly.",
  "timeout": "The check took too long. Try again.",
  "unreadable": "The red-line check returned an unreadable answer. Try again.",
  "verification-failed": "We could not verify the preference matches against your document. Try again.",
  "unavailable": "The review service could not check your red lines. Try again.",
};

export function RedLinesPanel({ reviewId, documents }: { readonly reviewId: string; readonly documents: readonly ExtractedDocument[] }) {
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState<readonly PreferenceMatch[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/api/red-lines").then((response) => response.json()).then((outcome: RedLineOutcome) => {
      if (!active) return;
      if (outcome.status === "preferences") { setText(outcome.lines.join("\n")); setLoaded(true); }
      else if (outcome.status === "failed") setMessage(ERRORS[outcome.reason] ?? ERRORS.unavailable);
    }).catch(() => {
      if (active) setMessage(ERRORS["storage-unavailable"]);
    });
    return () => { active = false; };
  }, [loadAttempt]);

  async function rerun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !loaded) return;
    const parsed = redLinesSchema.safeParse(text.split("\n").map((line) => line.trim()).filter(Boolean));
    if (!parsed.success) { setMessage(ERRORS["invalid-request"]); return; }
    setBusy(true);
    setMatches(null);
    setMessage(null);
    let saved = false;
    try {
      const saveResponse = await fetch("/api/red-lines", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lines: parsed.data }) });
      const saveOutcome: RedLineOutcome = await saveResponse.json();
      if (saveOutcome.status !== "preferences") {
        setMessage(saveOutcome.status === "failed" ? ERRORS[saveOutcome.reason] ?? ERRORS.unavailable : ERRORS["storage-unavailable"]);
        return;
      }
      saved = true;
      const response = await fetch("/api/red-lines/matches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewId }) });
      const outcome: RedLineOutcome = await response.json();
      if (outcome.status === "matched") { setMatches(outcome.matches); setMessage("Your red lines are saved."); }
      else if (outcome.status === "failed") setMessage(`Your red lines are saved. ${ERRORS[outcome.reason] ?? ERRORS.unavailable}`);
    } catch {
      setMessage(saved ? `Your red lines are saved. ${ERRORS.unavailable}` : ERRORS["storage-unavailable"]);
    } finally { setBusy(false); }
  }

  return (
    <section aria-labelledby="red-lines-heading" className="border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-6 sm:p-8">
      <h2 id="red-lines-heading" className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-navy-ink)]">Your personal red lines</h2>
      <p className="mt-3 font-[family-name:var(--font-body)] text-base leading-relaxed">Add the terms you cannot accept, one per line. We will check this agreement for conflicts with them. The general flags above keep their original severity.</p>
      <form onSubmit={rerun} className="mt-6 flex flex-col gap-3">
        <label htmlFor="personal-red-lines" className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide">Your red lines</label>
        <textarea id="personal-red-lines" rows={4} value={text} onChange={(event) => { setText(event.target.value); setMatches(null); setMessage(null); }} disabled={!loaded || busy} aria-describedby="red-line-limits" className="w-full border-2 border-[var(--color-navy)] bg-[var(--color-paper)] p-3 font-[family-name:var(--font-body)] text-base" />
        <p id="red-line-limits" className="font-[family-name:var(--font-body)] text-sm">Up to 20 red lines, 500 characters each. Clear the box and save to remove them from your account.</p>
        <button disabled={!loaded || busy} type="submit" className="self-start bg-[var(--color-navy)] px-5 py-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-paper)] hover:bg-[var(--color-navy-ink)] disabled:opacity-70">{busy ? "Checking red lines" : "Save and check red lines"}</button>
      </form>
      <div aria-live="polite" className="mt-4 font-[family-name:var(--font-body)] text-base">
        {!loaded && !message ? <p>Loading your saved red lines.</p> : null}
        {busy ? <p>Checking your saved red lines against this agreement.</p> : null}
        {message ? <p>{message}</p> : null}
        {!loaded && message ? <button type="button" className="mt-3 font-[family-name:var(--font-display)] underline" onClick={() => { setMessage(null); setLoadAttempt((attempt) => attempt + 1); }}>Try loading again</button> : null}
      </div>
      {matches !== null ? (
        <section aria-labelledby="preference-matches-heading" className="mt-6 flex flex-col gap-4">
          <h3 id="preference-matches-heading" className="font-[family-name:var(--font-display)] text-xl font-bold">Preference matches</h3>
          {matches.length === 0 ? <p className="font-[family-name:var(--font-body)]">No preference matches found for your saved red lines.</p> : null}
          {matches.map((match, index) => <article key={`${match.sourceDocumentId}-${match.sourceStart}-${index}`} className="border-2 border-[var(--color-navy)] bg-[var(--color-paper)] p-5">
            <span className="bg-[var(--color-red-ink)] px-2 py-1 font-[family-name:var(--font-data)] text-xs font-bold uppercase text-[var(--color-paper)]">Preference match</span>
            <p className="mt-4 font-[family-name:var(--font-body)] font-semibold">Your red line: {match.redLine}</p>
            <p className="mt-3 font-[family-name:var(--font-body)] leading-relaxed">{match.explanation}</p>
            <blockquote className="mt-4 border-l-2 border-[var(--color-navy)] pl-4 font-[family-name:var(--font-body)] leading-relaxed">{match.sourceSentence}</blockquote>
            <p className="mt-4 font-[family-name:var(--font-data)] text-xs uppercase tracking-wide">Source: {documents.find((document) => document.id === match.sourceDocumentId)?.title ?? match.sourceDocumentId}, characters {match.sourceStart} to {match.sourceEnd}</p>
          </article>)}
        </section>
      ) : null}
    </section>
  );
}
