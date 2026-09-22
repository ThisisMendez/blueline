import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountsNotice } from "@/features/auth/components/AccountsNotice";
import { SignInForm } from "@/features/auth/components/SignInForm";
import { getAccountsState } from "@/features/auth/session";

export const metadata: Metadata = {
  title: "Sign in | Blueline Redline",
};

const PROBLEM_MESSAGE: Record<string, string> = {
  "link-unreadable": "That link arrived incomplete. Send a fresh one.",
  "link-expired": "That link has expired. Send a fresh one and use it straight away.",
  "accounts-unavailable": "Accounts aren't running on this deployment yet.",
};

/**
 * The front door. With accounts absent it says so and points at the review
 * screen, which works without one — the product does not pretend to sign
 * anybody in.
 */
export default async function SignInPage(props: PageProps<"/sign-in">) {
  const accounts = await getAccountsState();
  const searchParams = await props.searchParams;

  const nextParam = searchParams.next;
  const next = typeof nextParam === "string" && nextParam.startsWith("/") ? nextParam : "/review";

  if (accounts.kind === "signed-in") {
    redirect(next);
  }

  const problemParam = searchParams.problem;
  const problem =
    typeof problemParam === "string" ? PROBLEM_MESSAGE[problemParam] : undefined;

  return (
    <main
      id="main"
      className="flex flex-1 flex-col items-center px-6 py-16 sm:px-10 md:py-24"
    >
      <div className="flex w-full max-w-lg flex-col gap-8">
        <div>
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[var(--color-navy-ink)]"
          >
            Blueline <span className="text-[var(--color-red-ink)]">Redline</span>
          </Link>
          <h1 className="mt-6 font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-3xl">
            Sign in to keep your reviews
          </h1>
          <p className="mt-4 font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
            Your account holds your review library and personal red lines.
            We send an email link to sign you in.
          </p>
        </div>

        {accounts.kind === "unconfigured" ? (
          <>
            <AccountsNotice />
            <p>
              <Link
                href="/review"
                className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wide text-[var(--color-navy)] underline decoration-2 underline-offset-4 hover:text-[var(--color-red-ink)]"
              >
                Review a lease without an account
              </Link>
            </p>
          </>
        ) : (
          <>
            {problem ? (
              <p className="border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] px-5 py-4 font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)]">
                {problem}
              </p>
            ) : null}
            <SignInForm />
            <Link href="/review" className="underline">Review a lease without an account</Link>
          </>
        )}
      </div>
    </main>
  );
}
