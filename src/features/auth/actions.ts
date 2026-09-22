"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "./server-client";
import type { SignInState } from "./sign-in-state";

/**
 * Sign-in is an email link and nothing else: no password to store, no
 * password to lose. Both actions are reachable by a direct POST, so each one
 * resolves configuration itself rather than trusting the screen that called
 * it.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function siteOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  if (origin) return origin;

  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured;

  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function sendSignInLinkAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!EMAIL_PATTERN.test(email)) return { status: "invalid-email" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { status: "unconfigured" };

  const origin = await siteOrigin();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/review`,
      shouldCreateUser: true,
    },
  });

  if (error) return { status: "error" };
  return { status: "sent", email };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut({ scope: "local" });
  }
  revalidatePath("/", "layout");
  redirect("/");
}
