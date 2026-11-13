"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { getSupabaseConfig } from "@/features/auth/config";
import { isValidNewPassword, PASSWORD_MIN_LENGTH } from "@/features/auth/password-validation";
import { createServerSupabaseClient } from "@/features/auth/server-client";
import { getSignInMethods } from "@/features/auth/session";

type SettingsResult = {
  readonly status: "saved" | "error";
  readonly message: string;
};

const SIGN_IN_AGAIN = "Sign in again to update your account.";

function error(message: string): SettingsResult {
  return { status: "error", message };
}

export async function updateDisplayNameAction(
  _previous: SettingsResult | null,
  formData: FormData,
): Promise<SettingsResult> {
  const input = formData.get("displayName");
  const displayName = typeof input === "string" ? input.trim() : "";
  if (!displayName || displayName.length > 80) return error("Enter a name between 1 and 80 characters.");

  const supabase = await createServerSupabaseClient();
  if (!supabase) return error(SIGN_IN_AGAIN);
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data.user) return error(SIGN_IN_AGAIN);

  const result = await supabase.auth.updateUser({ data: { display_name: displayName } });
  if (result.error) return error("We couldn't save your name. Try again.");

  revalidatePath("/account", "layout");
  return { status: "saved", message: "Your name was saved." };
}

export async function changePasswordAction(
  _previous: SettingsResult | null,
  formData: FormData,
): Promise<SettingsResult> {
  const currentPassword = formData.get("currentPassword");
  const password = formData.get("newPassword");
  if (typeof currentPassword !== "string" || !currentPassword) {
    return error("Enter your current password.");
  }
  if (typeof password !== "string" || [...password].length < PASSWORD_MIN_LENGTH) {
    return error(`Use at least ${PASSWORD_MIN_LENGTH} characters for your new password.`);
  }
  if (!isValidNewPassword(password)) return error("Your new password is too long. Try a shorter one.");
  if (password !== formData.get("confirmPassword")) return error("The new passwords don't match.");
  if (password === currentPassword) return error("Choose a different password.");

  const config = getSupabaseConfig();
  const supabase = await createServerSupabaseClient();
  if (!config || !supabase) return error(SIGN_IN_AGAIN);
  const { data, error: authError } = await supabase.auth.getUser();
  const user = data.user;
  if (authError || !user?.email || !user.email_confirmed_at) return error(SIGN_IN_AGAIN);
  if (!getSignInMethods(user).includes("email")) return error("Manage your password with your sign-in provider.");

  // Verify the current credential even when the project leaves Supabase's
  // current-password setting off. Keep the temporary session out of cookies.
  const verifier = createClient(config.url, config.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const verified = await verifier.auth.signInWithPassword({ email: user.email, password: currentPassword });
  if (verified.error) {
    return error(verified.error.code === "invalid_credentials"
      ? "Check your current password or use password recovery."
      : "We couldn't verify your current password. Try again.");
  }
  await verifier.auth.signOut({ scope: "local" });
  if (verified.data.user?.id !== user.id) return error(SIGN_IN_AGAIN);

  const result = await supabase.auth.updateUser({ password, current_password: currentPassword });
  if (result.error?.code === "reauthentication_needed") return error("Sign in again before changing your password.");
  if (result.error?.code === "weak_password") return error("Choose a stronger password.");
  if (result.error) return error("We couldn't change your password. Try again.");

  revalidatePath("/account/settings");
  return { status: "saved", message: "Your password was changed." };
}
