import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthFrame, authPageHref, type AuthPageProps } from "@/features/auth/components/AuthFrame";
import { GoogleSignInForm, SignInForm } from "@/features/auth/components/SignInForm";
import { signInReturnPath } from "@/features/auth/redirects";
import { getAccountsState } from "@/features/auth/session";

export const metadata: Metadata = { title: "Sign in | Blueline Redline" };

const PROBLEM_MESSAGE: Record<string, string> = {
  "link-unreadable": "That confirmation link is incomplete. Request a new one.",
  "link-expired": "That confirmation link has expired. Request a new one and open it in this browser.",
  "accounts-unavailable": "Accounts aren’t running on this deployment yet.",
  "google-incomplete": "Google sign-in didn’t finish. Try again or sign in with email and password.",
};

export default async function SignInPage({ searchParams }: AuthPageProps) {
  const accounts = await getAccountsState();
  const query = await searchParams;
  const next = signInReturnPath(query.next);
  if (accounts.kind === "signed-in") redirect(next);
  const problem = typeof query.problem === "string" && Object.hasOwn(PROBLEM_MESSAGE, query.problem)
    ? PROBLEM_MESSAGE[query.problem]
    : undefined;

  return (
    <AuthFrame
      title="Sign in to Blueline Redline"
      description="Open your saved lease reviews and account settings."
      configured={accounts.kind !== "unconfigured"}
      problem={problem}
    >
      <GoogleSignInForm next={next} />
      <div className="flex items-center gap-3 text-sm text-[var(--color-navy)]">
        <span aria-hidden="true" className="h-px flex-1 bg-[var(--color-navy)]/30" />
        or use email
        <span aria-hidden="true" className="h-px flex-1 bg-[var(--color-navy)]/30" />
      </div>
      <SignInForm next={next} />
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <Link href={authPageHref("/forgot-password", next)} className="underline">Forgot password?</Link>
        <Link href={authPageHref("/sign-up", next)} className="underline">Create account</Link>
        <Link href={authPageHref("/sign-up", next, { mode: "resend" })} className="underline">Resend confirmation</Link>
      </div>
    </AuthFrame>
  );
}
