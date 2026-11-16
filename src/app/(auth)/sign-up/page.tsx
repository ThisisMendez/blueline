import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthFrame, authPageHref, type AuthPageProps } from "@/features/auth/components/AuthFrame";
import { SignInForm } from "@/features/auth/components/SignInForm";
import { signInReturnPath } from "@/features/auth/redirects";
import { getAccountsState } from "@/features/auth/session";
import { publicSignupEmailReady } from "@/features/auth/signup-delivery";

export const metadata: Metadata = { title: "Create account" };

export default async function SignUpPage({ searchParams }: AuthPageProps) {
  const query = await searchParams;
  const next = signInReturnPath(query.next);
  const accounts = await getAccountsState();
  if (accounts.kind === "signed-in") redirect(next);
  const resend = query.mode === "resend";
  const signupPaused = !resend && !publicSignupEmailReady();

  return (
    <AuthFrame
      title={resend ? "Resend your confirmation" : "Create your account"}
      description={resend
        ? "Enter the email address you used to sign up."
        : "Create an account, then confirm your email."}
      configured={accounts.kind !== "unconfigured"}
    >
      {signupPaused ? <p role="status">New accounts are paused while we finish setting up verification email. You can still review a lease as a guest.</p> : null}
      <SignInForm mode={resend ? "resend" : "sign-up"} next={next} submitDisabled={signupPaused} />
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <Link href={authPageHref("/sign-in", next)} className="underline">Back to sign in</Link>
        {resend ? null : (
          <Link href={authPageHref("/sign-up", next, { mode: "resend" })} className="underline">Resend confirmation</Link>
        )}
      </div>
    </AuthFrame>
  );
}
