/**
 * The state the sign-in form moves through.
 *
 * It lives beside the action rather than inside it because a `"use server"`
 * module may only export async functions, and the form needs a starting
 * value.
 */
export type SignInState =
  | { readonly status: "idle" }
  | { readonly status: "unconfigured" }
  | { readonly status: "sent"; readonly email: string }
  | { readonly status: "invalid-email" }
  | { readonly status: "error" };

export const initialSignInState: SignInState = { status: "idle" };
