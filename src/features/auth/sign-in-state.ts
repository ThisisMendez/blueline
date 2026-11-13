export type SignInStatus =
  | "idle"
  | "confirmation-sent"
  | "recovery-sent"
  | "confirmation-required"
  | "confirmation-unavailable"
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
}

export const initialSignInState: SignInState = { status: "idle" };
