import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { exchangeAuthCode } from "@/features/auth/exchange-code";
import { grantPasswordRecovery } from "@/features/auth/recovery-authorization";
import { DEFAULT_SIGN_IN_PATH, internalReturnPath } from "@/features/auth/redirects";
import { createServerSupabaseClient } from "@/features/auth/server-client";

function supportedEmailType(type: string | null) {
  return type === "email" || type === "signup" || type === "magiclink" || type === "recovery"
    ? type
    : null;
}

/** Accepts a PKCE email code or a token hash from an Auth email template. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = supportedEmailType(searchParams.get("type"));
  const next = internalReturnPath(searchParams.get("next") ?? DEFAULT_SIGN_IN_PATH);
  const recoveryRequested = type === "recovery" || searchParams.get("recovery") === "1";
  const credential = code
    ? { kind: "code" as const, code }
    : tokenHash && type ? { kind: "otp" as const, tokenHash, type } : null;

  if (searchParams.has("error") || searchParams.has("error_code")) {
    redirect(recoveryRequested ? "/forgot-password?problem=link-expired" : "/sign-in?problem=link-expired");
  }
  if (!credential) redirect("/sign-in?problem=link-unreadable");

  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/sign-in?problem=accounts-unavailable");

  const result = credential.kind === "code"
    ? await exchangeAuthCode(supabase, credential.code, searchParams)
    : await supabase.auth.verifyOtp({ token_hash: credential.tokenHash, type: credential.type });
  if (result.error) {
    redirect(recoveryRequested ? "/forgot-password?problem=link-expired" : "/sign-in?problem=link-expired");
  }

  // The recovery query parameter only selects an error message. The
  // verified email OTP type or the SDK's stored PKCE flow determines purpose.
  const isRecovery = credential.kind === "code"
    ? result.data && "redirectType" in result.data && result.data.redirectType === "recovery"
    : credential.type === "recovery";
  if (isRecovery) {
    const userId = result.data?.user?.id;
    if (!userId || !await grantPasswordRecovery(supabase, userId)) {
      await supabase.auth.signOut({ scope: "local" });
      redirect("/forgot-password?problem=recovery-unavailable");
    }
    const query = new URLSearchParams({ next: next ?? DEFAULT_SIGN_IN_PATH });
    redirect(`/reset-password?${query}`);
  }
  if (recoveryRequested) redirect("/forgot-password?problem=link-expired");

  redirect(next ?? DEFAULT_SIGN_IN_PATH);
}
