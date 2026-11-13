import type { Metadata } from "next";
import Link from "next/link";

import { AuthFrame, authPageHref, type AuthPageProps } from "@/features/auth/components/AuthFrame";
import { SignInForm } from "@/features/auth/components/SignInForm";
import { isAccountsConfigured } from "@/features/auth/config";
import { signInReturnPath } from "@/features/auth/redirects";

export const metadata: Metadata = { title: "Forgot password | Blueline Redline" };

export default async function ForgotPasswordPage({ searchParams }: AuthPageProps) {
  const query = await searchParams;
  const next = signInReturnPath(query.next);
  const problem = query.problem === "link-expired"
    ? "That link has expired or already been used. Request a new one."
    : query.problem === "recovery-unavailable" ? "Password recovery is unavailable right now." : undefined;

  return (
    <AuthFrame
      title="Set or reset your password"
      description="Use your account email, including the address you used to sign in by email link."
      configured={isAccountsConfigured()}
      problem={problem}
    >
      <SignInForm mode="forgot-password" next={next} />
      <Link href={authPageHref("/sign-in", next)} className="text-sm underline">Back to sign in</Link>
    </AuthFrame>
  );
}
