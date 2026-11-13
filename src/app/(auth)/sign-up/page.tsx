import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthFrame, authPageHref, type AuthPageProps } from "@/features/auth/components/AuthFrame";
import { SignInForm } from "@/features/auth/components/SignInForm";
import { signInReturnPath } from "@/features/auth/redirects";
import { getAccountsState } from "@/features/auth/session";

export const metadata: Metadata = { title: "Create account | Blueline Redline" };

export default async function SignUpPage({ searchParams }: AuthPageProps) {
  const query = await searchParams;
  const next = signInReturnPath(query.next);
  const accounts = await getAccountsState();
  if (accounts.kind === "signed-in") redirect(next);
  const resend = query.mode === "resend";

  return (
    <AuthFrame
      title={resend ? "Resend your confirmation" : "Create your account"}
      description={resend
        ? "Enter the email address you used to sign up."
        : "Confirm your email once, then sign in with your password."}
      configured={accounts.kind !== "unconfigured"}
    >
      <SignInForm mode={resend ? "resend" : "sign-up"} next={next} />
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <Link href={authPageHref("/sign-in", next)} className="underline">Back to sign in</Link>
        {resend ? null : (
          <Link href={authPageHref("/sign-up", next, { mode: "resend" })} className="underline">Resend confirmation</Link>
        )}
      </div>
    </AuthFrame>
  );
}
