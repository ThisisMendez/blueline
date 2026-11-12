import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { createServerSupabaseClient } from "@/features/auth/server-client";

/**
 * Supabase's default email link verifies the email and redirects here with a
 * PKCE code. Custom templates can send a token hash directly to this route.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/review";

  const credential = code
    ? { kind: "code" as const, code }
    : tokenHash && type
      ? { kind: "otp" as const, tokenHash, type }
      : null;
  if (!credential) redirect("/sign-in?problem=link-unreadable");

  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/sign-in?problem=accounts-unavailable");

  const { error } = credential.kind === "code"
    ? await supabase.auth.exchangeCodeForSession(credential.code)
    : await supabase.auth.verifyOtp({
        token_hash: credential.tokenHash,
        type: credential.type,
      });
  if (error) redirect("/sign-in?problem=link-expired");

  const destination = next.startsWith("/") ? URL.parse(next, request.nextUrl.origin) : null;
  redirect(destination?.origin === request.nextUrl.origin ? destination.href : "/review");
}
