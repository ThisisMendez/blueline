"use client";

import { useActionState } from "react";

import {
  requestPasswordResetAction,
  resendConfirmationAction,
  resetPasswordAction,
  signInWithPasswordAction,
  signUpAction,
  startGoogleSignInAction,
} from "../actions";
import { PASSWORD_MIN_LENGTH } from "../password-validation";
import { initialSignInState, type SignInState } from "../sign-in-state";

export type AuthFormMode = "sign-in" | "sign-up" | "resend" | "forgot-password" | "reset-password";

const FORM = {
  "sign-in": { action: signInWithPasswordAction, label: "Sign in", pending: "Signing in…" },
  "sign-up": { action: signUpAction, label: "Create account", pending: "Creating account…" },
  resend: { action: resendConfirmationAction, label: "Resend confirmation", pending: "Sending…" },
  "forgot-password": { action: requestPasswordResetAction, label: "Send reset link", pending: "Sending…" },
  "reset-password": { action: resetPasswordAction, label: "Save new password", pending: "Saving…" },
};

const MESSAGE: Record<Exclude<SignInState["status"], "idle">, string> = {
  "confirmation-sent": "If this address needs confirmation, check its inbox for a link. Open it in this browser.",
  "recovery-sent": "If an account can use this address, you’ll receive a password reset link. Open it in this browser.",
  "confirmation-required": "Confirm your email before signing in. You can request another confirmation link if you need one.",
  "confirmation-unavailable": "Email confirmation isn’t set up here. Your signup didn’t finish.",
  "invalid-input": "Check the information you entered and try again.",
  "invalid-password": "Use at least 8 characters. If your password is very long, shorten it and try again.",
  "password-mismatch": "Enter the same password in both fields.",
  "invalid-credentials": "The email or password didn’t match. Try again or reset your password.",
  "provider-unavailable": "Google sign-in is unavailable here right now. You can sign in with email and password.",
  "unconfigured": "This sign-in option isn’t set up here.",
  "email-rate-limited": "Too many confirmation emails have gone out. Wait a while, then try again.",
  "recovery-required": "Your reset link is missing or expired. Request a new link.",
  error: "Something went wrong. Try again in a moment.",
};

const LABEL = "font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]";
const INPUT = "border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-4 py-3 font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)]";
const PRIMARY = "inline-flex items-center justify-center bg-[var(--color-navy)] px-6 py-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-paper)] transition-colors hover:bg-[var(--color-navy-ink)] disabled:opacity-70";

function Message({ state }: { state: SignInState }) {
  if (state.status === "idle") return null;
  return (
    <p role="status" className="mt-4 border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] px-4 py-3 font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]">
      {MESSAGE[state.status]}
    </p>
  );
}

export function SignInForm({ mode = "sign-in", next = "/account" }: {
  readonly mode?: AuthFormMode;
  readonly next?: string;
}) {
  const form = FORM[mode];
  const [state, action, pending] = useActionState(form.action, initialSignInState);
  const isSignup = mode === "sign-up";
  const isReset = mode === "reset-password";
  const isSignIn = mode === "sign-in";
  const showPassword = isSignIn || isSignup || isReset;

  return (
    <div>
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next} />
        {isSignup ? (
          <>
            <label htmlFor="auth-name" className={LABEL}>Display name</label>
            <input id="auth-name" name="displayName" autoComplete="name" required maxLength={80} className={INPUT} />
          </>
        ) : null}
        {isReset ? null : (
          <>
            <label htmlFor="auth-email" className={LABEL}>Email address</label>
            <input id="auth-email" name="email" type="email" autoComplete="email" required maxLength={254} className={INPUT} />
          </>
        )}
        {showPassword ? (
          <>
            <label htmlFor="auth-password" className={LABEL}>{isReset ? "New password" : "Password"}</label>
            <input
              id="auth-password" name="password" type="password" required className={INPUT}
              autoComplete={isSignIn ? "current-password" : "new-password"}
              minLength={isSignIn ? undefined : PASSWORD_MIN_LENGTH}
              aria-describedby={isSignIn ? undefined : "auth-password-hint"}
            />
            {isSignIn ? null : <p id="auth-password-hint" className="text-sm">Use at least {PASSWORD_MIN_LENGTH} characters.</p>}
          </>
        ) : null}
        {isReset ? (
          <>
            <label htmlFor="auth-password-confirmation" className={LABEL}>Confirm new password</label>
            <input id="auth-password-confirmation" name="confirmPassword" type="password" autoComplete="new-password" required className={INPUT} />
          </>
        ) : null}
        <button type="submit" disabled={pending} className={PRIMARY}>{pending ? form.pending : form.label}</button>
      </form>
      <Message state={state} />
    </div>
  );
}

export function GoogleSignInForm({ next }: { readonly next: string }) {
  const [state, action, pending] = useActionState(startGoogleSignInAction, initialSignInState);
  return (
    <div>
      <form action={action}>
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          disabled={pending}
          className="w-full border-2 border-[var(--color-navy)] px-6 py-3 font-[family-name:var(--font-display)] text-sm font-bold text-[var(--color-navy)] hover:bg-[var(--color-paper-deep)] disabled:opacity-70"
        >
          {pending ? "Opening Google…" : "Continue with Google"}
        </button>
      </form>
      <Message state={state} />
    </div>
  );
}
