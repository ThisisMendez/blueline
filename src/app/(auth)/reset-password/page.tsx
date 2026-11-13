import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthFrame, authPageHref, type AuthPageProps } from "@/features/auth/components/AuthFrame";
import { SignInForm } from "@/features/auth/components/SignInForm";
import { hasPasswordRecovery } from "@/features/auth/recovery-authorization";
import { signInReturnPath } from "@/features/auth/redirects";
import { createServerSupabaseClient } from "@/features/auth/server-client";

export const metadata: Metadata = { title: "New password | Blueline Redline" };

export default async function ResetPasswordPage({ searchParams }: AuthPageProps) {
  const next = signInReturnPath((await searchParams).next);
  const supabase = await createServerSupabaseClient();
  if (!supabase) return <AuthFrame title="Set a new password" configured={false} />;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || !await hasPasswordRecovery(supabase, data.user.id)) {
    redirect(authPageHref("/forgot-password", next, { problem: "link-expired" }));
  }

  return (
    <AuthFrame title="Set a new password">
      <SignInForm mode="reset-password" next={next} />
    </AuthFrame>
  );
}
