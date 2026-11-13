"use client";

import { type FormEvent, useId, useRef, useState } from "react";

import {
  CONTACT_LIMITS,
  CONTACT_TOPICS,
  USEFULNESS_ANSWERS,
  type FeedbackContext,
} from "./contact-fields";
import { primaryActionClassName } from "./PageShell";

const LABEL =
  "font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-navy)]";
const FIELD =
  "mt-1 w-full border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-3 py-2 text-base text-[var(--color-navy-ink)] disabled:cursor-not-allowed disabled:opacity-60";
const DELIVERY_ERRORS: Record<number, string> = {
  400: "Check your details and try again.",
  413: "Your message is too long. Shorten it and try again.",
  429: "The form has reached its sending limit. Try again later.",
  503: "The form is unavailable right now. Try again later.",
};
const DELIVERY_ERROR = "We couldn’t confirm that your message went through. Your text is still here.";

export function ContactForm({
  available,
  feedback,
}: {
  readonly available: boolean;
  readonly feedback?: FeedbackContext;
}) {
  const ids = useId();
  const sending = useRef(false);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const label = feedback ? "Send feedback" : "Send message";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!available || sending.current) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const message = String(data.get("message") ?? "").trim();
    if (!message) {
      setError("Write a message first.");
      return;
    }

    const email = String(data.get("email") ?? "").trim();
    const website = data.get("website");
    const payload = feedback
      ? {
          kind: "feedback",
          email: email || undefined,
          message,
          useful: data.get("useful") || undefined,
          source: feedback.source,
          role: feedback.role,
          website,
        }
      : { kind: "contact", name: data.get("name"), email, topic: data.get("topic"), message, website };

    sending.current = true;
    setPending(true);
    setSent(false);
    setError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.status === 204) {
        form.reset();
        setSent(true);
      } else {
        setError(DELIVERY_ERRORS[response.status] ?? DELIVERY_ERROR);
      }
    } catch {
      setError(DELIVERY_ERROR);
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  return (
    <form
      action="/api/contact"
      method="post"
      aria-label={feedback ? "Beta feedback form" : "Contact form"}
      onSubmit={submit}
      onChange={() => { setSent(false); setError(""); }}
      className="space-y-3"
    >
      {!available && (
        <p role="status" className="border-l-4 border-[var(--color-navy)] bg-[var(--color-paper-deep)] px-3 py-2 text-sm">
          This form is temporarily unavailable.
        </p>
      )}

      <fieldset disabled={!available || pending} className="grid gap-3 sm:grid-cols-2">
        <legend className="sr-only">Your message</legend>
        {!feedback && (
          <div>
            <label htmlFor={`${ids}-name`} className={LABEL}>Name</label>
            <input
              id={`${ids}-name`}
              name="name"
              autoComplete="name"
              required
              maxLength={CONTACT_LIMITS.name}
              className={FIELD}
            />
          </div>
        )}
        <div className={feedback ? "sm:col-span-2" : undefined}>
          <label htmlFor={`${ids}-email`} className={LABEL}>
            {feedback ? "Email (optional, if you’d like a reply)" : "Email"}
          </label>
          <input
            id={`${ids}-email`}
            name="email"
            type="email"
            autoComplete="email"
            required={!feedback}
            maxLength={CONTACT_LIMITS.email}
            className={FIELD}
          />
        </div>
        <div className="sm:col-span-2">
          {feedback ? (
            <>
              <label htmlFor={`${ids}-useful`} className={LABEL}>Was this useful? (optional)</label>
              <select id={`${ids}-useful`} name="useful" className={FIELD} defaultValue="">
                <option value="">Choose an answer</option>
                {USEFULNESS_ANSWERS.map((answer) => <option key={answer}>{answer}</option>)}
              </select>
            </>
          ) : (
            <>
              <label htmlFor={`${ids}-topic`} className={LABEL}>Topic</label>
              <select id={`${ids}-topic`} name="topic" className={FIELD}>
                {CONTACT_TOPICS.map((topic) => <option key={topic}>{topic}</option>)}
              </select>
            </>
          )}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${ids}-message`} className={LABEL}>
            {feedback ? "What worked or could be better?" : "Message"}
          </label>
          <textarea
            id={`${ids}-message`}
            name="message"
            rows={6}
            required
            maxLength={CONTACT_LIMITS.message}
            aria-describedby={`${ids}-message-hint`}
            className={FIELD}
          />
          <p id={`${ids}-message-hint`} className="mt-1 text-sm">
            Leave out lease text, property addresses, and account details.
          </p>
        </div>
        <div hidden>
          <label htmlFor={`${ids}-website`}>Website</label>
          <input id={`${ids}-website`} name="website" autoComplete="off" tabIndex={-1} />
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={!available || pending}
        className={`${primaryActionClassName} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {pending ? "Sending…" : label}
      </button>

      {error && <p role="alert" className="text-sm font-semibold text-[var(--color-red-ink)]">{error}</p>}
      {sent && <p role="status" className="text-sm font-semibold">Thanks. We received your {feedback ? "feedback" : "message"}.</p>}
    </form>
  );
}
