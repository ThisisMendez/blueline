import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { createServerSupabaseClient } from "@/features/auth/server-client";

/**
 * Where an email sign-in link lands. `@supabase/ssr` forces the PKCE flow, so
 * the link carries a `token_hash` rather than an OAuth-style code, and the
 * Supabase email template has to point here:
 *
 *   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Sign in</a>
 *
 * Every failure sends the signer back to the sign-in screen with a reason, so
 * an expired link reads as an expired link rather than a blank page.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/review";

  if (!tokenHash || !type) redirect("/sign-in?problem=link-unreadable");

  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/sign-in?problem=accounts-unavailable");

  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) redirect("/sign-in?problem=link-expired");

  redirect(next.startsWith("/") ? next : "/review");
}
