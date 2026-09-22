"use client";

import { useActionState } from "react";

import { sendSignInLinkAction } from "../actions";
import { initialSignInState, type SignInState } from "../sign-in-state";

function Message({ state }: { state: SignInState }) {
  if (state.status === "idle") return null;

  const text =
    state.status === "sent"
      ? `Link sent to ${state.email}. Open it on this device to sign in.`
      : state.status === "invalid-email"
        ? "That address doesn't look complete. Check it and send again."
        : state.status === "unconfigured"
          ? "Accounts aren't running on this deployment, so there is no link to send."
          : "The link didn't go out. Try again in a moment.";

  return (
    <p
      aria-live="polite"
      className="mt-4 border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] px-4 py-3 font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]"
    >
      {text}
    </p>
  );
}

export function SignInForm() {
  const [state, formAction, pending] = useActionState(
    sendSignInLinkAction,
    initialSignInState,
  );

  return (
    <div>
      <form action={formAction} className="flex flex-col gap-4">
        <label
          htmlFor="sign-in-email"
          className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]"
        >
          Email address
        </label>
        <input
          id="sign-in-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-4 py-3 font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)]"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center bg-[var(--color-navy)] px-6 py-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-paper)] transition-colors hover:bg-[var(--color-navy-ink)] disabled:opacity-70"
        >
          {pending ? "Sending the link" : "Email me a sign-in link"}
        </button>
      </form>
      <Message state={state} />
    </div>
  );
}
