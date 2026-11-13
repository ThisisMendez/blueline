export type SignInStatus =
  | "idle"
  | "sign-in-link-sent"
  | "confirmation-sent"
  | "recovery-sent"
  | "confirmation-required"
  | "confirmation-unavailable"
  | "confirmation-session-ended"
  | "invalid-confirmation-code"
  | "invalid-confirmation-link"
  | "verification-rate-limited"
  | "invalid-input"
  | "invalid-password"
  | "password-mismatch"
  | "invalid-credentials"
  | "provider-unavailable"
  | "unconfigured"
  | "email-rate-limited"
  | "recovery-required"
  | "error";

export interface SignInState {
  readonly status: SignInStatus;
  readonly confirmationEmail?: string;
}

export const initialSignInState: SignInState = { status: "idle" };
