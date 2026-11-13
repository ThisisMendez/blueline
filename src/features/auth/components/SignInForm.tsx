"use client";

import { useActionState, useId } from "react";

import {
  requestPasswordResetAction,
  resendConfirmationAction,
  resetPasswordAction,
  sendSignInLinkAction,
  signInWithPasswordAction,
  signUpAction,
  startGoogleSignInAction,
  verifySignupCodeAction,
  verifySignupLinkAction,
} from "../actions";
import { PASSWORD_MIN_LENGTH } from "../password-validation";
import { initialSignInState, type SignInState } from "../sign-in-state";

export type AuthFormMode = "email-link" | "sign-in" | "sign-up" | "resend" | "forgot-password" | "reset-password";

const FORM = {
  "email-link": { action: sendSignInLinkAction, label: "Email me a sign-in link", pending: "Sending…" },
  "sign-in": { action: signInWithPasswordAction, label: "Sign in", pending: "Signing in…" },
  "sign-up": { action: signUpAction, label: "Create account", pending: "Creating account…" },
  resend: { action: resendConfirmationAction, label: "Resend confirmation", pending: "Sending…" },
  "forgot-password": { action: requestPasswordResetAction, label: "Send reset link", pending: "Sending…" },
  "reset-password": { action: resetPasswordAction, label: "Save new password", pending: "Saving…" },
};

const MESSAGE: Record<Exclude<SignInState["status"], "idle">, string> = {
  "sign-in-link-sent": "Check your inbox for a sign-in link and open it in this browser.",
  "confirmation-sent": "If this address needs confirmation, check your inbox for a code or confirmation link.",
  "recovery-sent": "If an account can use this address, you’ll receive a password reset link. Open it in this browser.",
  "confirmation-required": "Confirm your email before signing in. You can request a fresh confirmation email.",
  "confirmation-unavailable": "Email confirmation isn’t set up here. Your signup didn’t finish.",
  "confirmation-session-ended": "Request a fresh email to continue.",
  "invalid-confirmation-code": "That code didn’t work. Check the latest email or ask for a new code.",
  "invalid-confirmation-link": "That link is incomplete, expired, or already used. You can sign in or request a fresh email.",
  "verification-rate-limited": "Too many attempts. Wait a while and try again.",
  "invalid-input": "Check the information you entered and try again.",
  "invalid-password": "Use at least 8 characters. If your password is very long, shorten it and try again.",
  "password-mismatch": "Enter the same password in both fields.",
  "invalid-credentials": "The email or password didn’t match. Try again or reset your password.",
  "provider-unavailable": "Google sign-in is unavailable here right now. You can sign in with email and password.",
  "unconfigured": "This sign-in option isn’t set up here.",
  "email-rate-limited": "Too many account emails have gone out. Wait a while, then try again.",
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

function VerifySignupCodeForm({ next, email }: { readonly next: string; readonly email: string }) {
  const id = useId();
  const [state, action, pending] = useActionState(verifySignupCodeAction, initialSignInState);
  const [resendState, resendAction, resending] = useActionState(resendConfirmationAction, initialSignInState);
  return (
    <>
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="confirmationEmail" value={email} />
        <label htmlFor={id} className={LABEL}>Verification code</label>
        <p id={`${id}-hint`} className="text-sm break-all">Paste the code sent to {email} to sign in.</p>
        <input
          id={id}
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-describedby={`${id}-hint`}
          maxLength={10}
          required
          className={INPUT}
        />
        <button type="submit" disabled={pending || resending} className={PRIMARY}>
          {pending ? "Verifying…" : "Verify email"}
        </button>
      </form>
      <Message state={state} />
      <form action={resendAction} className="mt-4">
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="confirmationEmail" value={email} />
        <button type="submit" disabled={resending || pending} className="text-sm underline disabled:opacity-70">
          {resending ? "Sending…" : "Send a new code"}
        </button>
      </form>
      <Message state={resendState} />
      <p className="mt-4 text-sm">You can also use the confirmation link in your email.</p>
      <p className="mt-2 text-sm">After signing in, return to your open review and choose Continue after sign-in.</p>
    </>
  );
}

export function VerifySignupLinkForm() {
  const [state, action, pending] = useActionState(async (previous: SignInState, values: FormData) => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const tokenHash = fragment.get("token_hash");
    if (tokenHash) values.set("tokenHash", tokenHash);
    const result = await verifySignupLinkAction(previous, values);
    if (result.status === "invalid-confirmation-link") {
      window.history.replaceState(null, "", window.location.pathname);
    }
    return result;
  }, initialSignInState);
  return (
    <>
      <form action={action}>
        <button type="submit" disabled={pending} className={PRIMARY}>
          {pending ? "Verifying…" : "Verify email"}
        </button>
      </form>
      <Message state={state} />
    </>
  );
}

export function SignInForm({ mode = "sign-in", next = "/account" }: {
  readonly mode?: AuthFormMode;
  readonly next?: string;
}) {
  const form = FORM[mode];
  const [state, action, pending] = useActionState(form.action, initialSignInState);
  const emailId = mode === "email-link" ? "auth-link-email" : "auth-email";
  const isSignup = mode === "sign-up";
  const isReset = mode === "reset-password";
  const isSignIn = mode === "sign-in";
  const showPassword = isSignIn || isSignup || isReset;

  if ((isSignup || mode === "resend") && state.status === "confirmation-sent" && state.confirmationEmail) {
    return (
      <div>
        <VerifySignupCodeForm next={next} email={state.confirmationEmail} />
      </div>
    );
  }

  return (
    <div>
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next} />
        {isSignup ? (
          <>
            <label htmlFor="auth-name" className={LABEL}>First name</label>
            <input id="auth-name" name="firstName" autoComplete="given-name" required maxLength={80} className={INPUT} />
          </>
        ) : null}
        {isReset ? null : (
          <>
            <label htmlFor={emailId} className={LABEL}>{mode === "email-link" ? "Email address for sign-in link" : "Email address"}</label>
            <input id={emailId} name="email" type="email" autoComplete="email" required maxLength={254} className={INPUT} />
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
