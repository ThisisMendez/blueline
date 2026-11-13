"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect, RedirectType } from "next/navigation";

import { isValidNewPassword } from "./password-validation";
import { readAuthProviderSettings } from "./provider-settings";
import { clearPasswordRecovery, hasPasswordRecovery, isRecoveryConfigured } from "./recovery-authorization";
import { authCallbackUrl, signInReturnPath } from "./redirects";
import { createServerSupabaseClient } from "./server-client";
import type { SignInState } from "./sign-in-state";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONFIRMATION_EMAIL_COOKIE = "blueline-confirmation-email";

function textField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function validEmail(email: string): string | null {
  return email.length <= 254 && EMAIL_PATTERN.test(email) ? email : null;
}

function emailField(formData: FormData): string | null {
  return validEmail(textField(formData, "email").trim());
}

async function rememberConfirmationEmail(email: string) {
  (await cookies()).set(CONFIRMATION_EMAIL_COOKIE, email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60,
  });
}

async function pendingConfirmationEmail(): Promise<string | null> {
  return validEmail((await cookies()).get(CONFIRMATION_EMAIL_COOKIE)?.value ?? "");
}

function confirmationStatus(code: string | undefined, email: string): SignInState {
  if (!code || ["user_already_exists", "email_exists", "user_not_found", "email_address_not_authorized"].includes(code)) {
    return { status: "confirmation-sent", confirmationEmail: email };
  }
  if (code === "weak_password") return { status: "invalid-password" };
  if (code === "over_email_send_rate_limit") return { status: "email-rate-limited" };
  return { status: "error" };
}

export async function sendSignInLinkAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = emailField(formData);
  if (!email) return { status: "invalid-input" };

  const supabase = await createServerSupabaseClient();
  const emailRedirectTo = await authCallbackUrl("/auth/confirm", {
    next: signInReturnPath(formData.get("next")),
  });
  if (!supabase || !emailRedirectTo) return { status: "unconfigured" };

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo, shouldCreateUser: true },
  });
  if (error?.code === "over_email_send_rate_limit") return { status: "email-rate-limited" };
  if (error && !["user_not_found", "email_address_not_authorized"].includes(error.code ?? "")) {
    return { status: "error" };
  }
  return { status: "sign-in-link-sent" };
}

export async function signInWithPasswordAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = emailField(formData);
  const password = textField(formData, "password");
  if (!email || !password) return { status: "invalid-input" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { status: "unconfigured" };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error?.code === "email_not_confirmed") return { status: "confirmation-required" };
  if (error) return { status: "invalid-credentials" };

  revalidatePath("/", "layout");
  redirect(signInReturnPath(formData.get("next")));
}

export async function signUpAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = emailField(formData);
  const firstName = textField(formData, "firstName").trim();
  const password = textField(formData, "password");
  if (!email || !firstName || firstName.length > 80) return { status: "invalid-input" };
  if (!isValidNewPassword(password)) return { status: "invalid-password" };

  const supabase = await createServerSupabaseClient();
  const emailRedirectTo = await authCallbackUrl("/auth/confirm", {
    next: signInReturnPath(formData.get("next")),
  });
  if (!supabase || !emailRedirectTo) return { status: "unconfigured" };
  const settings = await readAuthProviderSettings();
  if (settings?.external?.email !== true || settings.mailer_autoconfirm !== false || settings.disable_signup) {
    return { status: "confirmation-unavailable" };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: firstName }, emailRedirectTo },
  });
  // A signup session means Confirm Email is disabled in this Supabase project.
  if (data.session) {
    await supabase.auth.signOut({ scope: "local" });
    return { status: "confirmation-unavailable" };
  }
  if (error && !error.code) return { status: "error" };
  const state = confirmationStatus(error?.code, email);
  if (state.status === "confirmation-sent") await rememberConfirmationEmail(email);
  return state;
}

export async function resendConfirmationAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const resending = formData.has("confirmationEmail");
  const email = resending ? await pendingConfirmationEmail() : emailField(formData);
  if (resending && email !== textField(formData, "confirmationEmail")) return { status: "confirmation-session-ended" };
  if (!email) return { status: "invalid-input" };

  const supabase = await createServerSupabaseClient();
  const emailRedirectTo = await authCallbackUrl("/auth/confirm", {
    next: signInReturnPath(formData.get("next")),
  });
  if (!supabase || !emailRedirectTo) return { status: "unconfigured" };

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo },
  });
  if (error && !error.code) return { status: "error" };
  const state = confirmationStatus(error?.code, email);
  if (state.status === "confirmation-sent") await rememberConfirmationEmail(email);
  return state;
}

export async function verifySignupCodeAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = await pendingConfirmationEmail();
  if (!email || email !== textField(formData, "confirmationEmail")) return { status: "confirmation-session-ended" };
  const token = textField(formData, "code").trim();
  if (!/^\d{6,10}$/.test(token)) return { status: "invalid-confirmation-code" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { status: "unconfigured" };
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error?.status === 429) return { status: "verification-rate-limited" };
  if (error || !data.session) return { status: "invalid-confirmation-code" };

  (await cookies()).delete(CONFIRMATION_EMAIL_COOKIE);
  revalidatePath("/", "layout");
  redirect(signInReturnPath(formData.get("next")));
}

export async function verifySignupLinkAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const tokenHash = textField(formData, "tokenHash");
  if (!/^[a-zA-Z0-9_-]{16,256}$/.test(tokenHash)) return { status: "invalid-confirmation-link" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { status: "unconfigured" };
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "signup" });
  if (error?.status === 429) return { status: "verification-rate-limited" };
  if (error || !data.session) return { status: "invalid-confirmation-link" };

  (await cookies()).delete(CONFIRMATION_EMAIL_COOKIE);
  revalidatePath("/", "layout");
  redirect("/account", RedirectType.replace);
}

export async function requestPasswordResetAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = emailField(formData);
  if (!email) return { status: "invalid-input" };

  const supabase = await createServerSupabaseClient();
  const redirectTo = await authCallbackUrl("/auth/confirm", {
    recovery: "1",
    next: signInReturnPath(formData.get("next")),
  });
  if (!supabase || !redirectTo || !isRecoveryConfigured()) return { status: "unconfigured" };

  await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  // The response is the same for an account that exists and one that does not.
  return { status: "recovery-sent" };
}

export async function resetPasswordAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const password = textField(formData, "password");
  if (!isValidNewPassword(password)) return { status: "invalid-password" };
  if (password !== textField(formData, "confirmPassword")) return { status: "password-mismatch" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { status: "unconfigured" };
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || !await hasPasswordRecovery(supabase, data.user.id)) {
    return { status: "recovery-required" };
  }
  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError?.code === "weak_password") return { status: "invalid-password" };
  if (updateError) return { status: "error" };

  await clearPasswordRecovery();
  revalidatePath("/", "layout");
  redirect(signInReturnPath(formData.get("next")));
}

export async function startGoogleSignInAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const supabase = await createServerSupabaseClient();
  const redirectTo = await authCallbackUrl("/auth/callback", {
    next: signInReturnPath(formData.get("next")),
  });
  if (!supabase || !redirectTo) return { status: "unconfigured" };
  if ((await readAuthProviderSettings())?.external?.google !== true) return { status: "provider-unavailable" };

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, scopes: "openid email profile" },
  });
  if (error || !data.url) return { status: "provider-unavailable" };
  redirect(data.url);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (supabase) await supabase.auth.signOut({ scope: "local" });
  await clearPasswordRecovery();
  (await cookies()).delete(CONFIRMATION_EMAIL_COOKIE);
  revalidatePath("/", "layout");
  redirect("/");
}
