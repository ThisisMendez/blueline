import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { exchangeAuthCode } from "@/features/auth/exchange-code";
import { signInReturnPath } from "@/features/auth/redirects";
import { createServerSupabaseClient } from "@/features/auth/server-client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = signInReturnPath(searchParams.get("next"));
  const problem = new URLSearchParams({ problem: "google-incomplete" });
  if (next !== "/account") problem.set("next", next);

  const code = searchParams.get("code");
  if (!code || searchParams.has("error") || searchParams.has("error_code")) {
    redirect(`/sign-in?${problem}`);
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/sign-in?problem=accounts-unavailable");

  const { error } = await exchangeAuthCode(supabase, code, searchParams);
  if (error) redirect(`/sign-in?${problem}`);

  redirect(next);
}
