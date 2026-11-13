"use client";

import { useId, useState } from "react";

import { buildMailtoLink, CONTACT_TOPICS, MAILTO_MAX_LENGTH } from "./mailto";

const LABEL =
  "font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-navy)]";
const FIELD =
  "mt-1 w-full border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-3 py-2 text-base text-[var(--color-navy-ink)] disabled:cursor-not-allowed disabled:opacity-60";
const ACTION =
  "inline-flex min-h-11 items-center border-2 border-[var(--color-navy)] bg-[var(--color-navy)] px-5 py-2 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-paper)] transition-colors hover:bg-[var(--color-navy-ink)]";
const ACTION_DISABLED =
  "inline-flex min-h-11 cursor-not-allowed items-center border-2 border-[var(--color-navy)]/50 bg-[var(--color-paper-deep)] px-5 py-2 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-navy)]/70";

/**
 * Drafts an email in the visitor's own email app. Nothing is sent from here,
 * so the form never claims a message was delivered: after the click it says
 * the draft opened and still needs sending.
 */
export function ContactForm({ supportEmail }: { readonly supportEmail: string | null }) {
  const ids = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<string>(CONTACT_TOPICS[0]);
  const [message, setMessage] = useState("");
  const [opened, setOpened] = useState(false);

  const available = supportEmail !== null && supportEmail.trim().length > 0;
  const link = available ? buildMailtoLink(supportEmail, { name, email, topic, message }) : null;
  const ready = link !== null && !link.tooLong && message.trim().length > 0;

  function edited<T>(set: (value: T) => void) {
    return (value: T) => {
      set(value);
      setOpened(false);
    };
  }

  return (
    <form
      aria-label="Contact form"
      noValidate
      onSubmit={(event) => event.preventDefault()}
      className="space-y-3"
    >
      {!available ? (
        <p
          role="status"
          className="border-l-4 border-[var(--color-navy)] bg-[var(--color-paper-deep)] px-3 py-2 text-sm leading-relaxed text-[var(--color-navy-ink)]"
        >
          We&apos;re still setting up our contact address, so this form is
          switched off for now.
        </p>
      ) : null}

      <fieldset disabled={!available} className="grid gap-3 sm:grid-cols-2">
        <legend className="sr-only">Your message</legend>
        <div>
          <label htmlFor={`${ids}-name`} className={LABEL}>
            Name
          </label>
          <input
            id={`${ids}-name`}
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => edited(setName)(event.target.value)}
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor={`${ids}-email`} className={LABEL}>
            Email
          </label>
          <input
            id={`${ids}-email`}
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => edited(setEmail)(event.target.value)}
            className={FIELD}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${ids}-topic`} className={LABEL}>
            Topic
          </label>
          <select
            id={`${ids}-topic`}
            name="topic"
            value={topic}
            onChange={(event) => edited(setTopic)(event.target.value)}
            className={FIELD}
          >
            {CONTACT_TOPICS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${ids}-message`} className={LABEL}>
            Message
          </label>
          <textarea
            id={`${ids}-message`}
            name="message"
            rows={6}
            value={message}
            aria-describedby={`${ids}-message-hint`}
            onChange={(event) => edited(setMessage)(event.target.value)}
            className={FIELD}
          />
          <p id={`${ids}-message-hint`} className="mt-1 text-sm text-[var(--color-navy-ink)]">
            Please don&apos;t paste your lease or personal details like your
            address or account numbers.
          </p>
        </div>
      </fieldset>

      {link?.tooLong ? (
        <p role="alert" className="text-sm font-semibold text-[var(--color-red-ink)]">
          This message is too long for an email link (the limit is about{" "}
          {MAILTO_MAX_LENGTH.toLocaleString("en-US")} characters once encoded).
          Cut about {link.overBy.toLocaleString("en-US")} characters to
          continue.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {ready && link ? (
          <a href={link.href} onClick={() => setOpened(true)} className={ACTION}>
            Open email app
          </a>
        ) : (
          <button type="button" disabled className={ACTION_DISABLED}>
            Open email app
          </button>
        )}
        {available && !ready && !link?.tooLong ? (
          <span className="text-sm text-[var(--color-navy-ink)]">Write a message first.</span>
        ) : null}
      </div>

      {opened ? (
        <p role="status" className="text-sm leading-relaxed text-[var(--color-navy-ink)]">
          Your email app should now have a draft open. It isn&apos;t sent yet:
          check it and press send there. If nothing opened, your browser may
          not have an email app set up.
        </p>
      ) : null}
    </form>
  );
}
