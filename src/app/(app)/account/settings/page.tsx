import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ChangePasswordForm, DisplayNameForm } from "@/features/account/SettingsForms";
import { signOutAction } from "@/features/auth/actions";
import { isRecoveryConfigured } from "@/features/auth/recovery-authorization";
import { getAccountsState } from "@/features/auth/session";

export const metadata: Metadata = { title: "Account settings | Blueline Redline" };

const DETAILS_LABEL = "font-[family-name:var(--font-data)] text-xs font-semibold uppercase tracking-wide text-[var(--color-navy)]";
const DETAILS_VALUE = "mt-1 break-words font-[family-name:var(--font-body)]";
const PANEL = "flex flex-col gap-5 border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-5 sm:p-8";
const HEADING = "font-[family-name:var(--font-display)] text-xl font-bold";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });
const timeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

function AccountDate({ date, withTime }: { readonly date?: string; readonly withTime?: boolean }) {
  if (!date || !Number.isFinite(Date.parse(date))) return "Unavailable";
  const formatted = (withTime ? timeFormatter : dateFormatter).format(new Date(date));
  return <time dateTime={date}>{formatted}{withTime ? " UTC" : ""}</time>;
}

export default async function AccountSettingsPage() {
  const accounts = await getAccountsState();
  if (accounts.kind !== "signed-in") redirect("/sign-in?next=/account/settings");

  const { signer } = accounts;
  const hasEmailIdentity = signer.signInMethods?.includes("email");
  const googleOnly = !hasEmailIdentity && signer.signInMethods?.includes("google");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <Link href="/account" className="font-[family-name:var(--font-display)] text-sm font-semibold underline underline-offset-4">Back to your account</Link>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--color-navy-ink)]">Account settings</h1>
      </div>

      <section aria-labelledby="profile-heading" className={PANEL}>
        <h2 id="profile-heading" className={HEADING}>Profile</h2>
        <DisplayNameForm name={signer.displayName ?? ""} />
        <dl className="grid gap-5 sm:grid-cols-2">
          <div className="min-w-0 sm:col-span-2">
            <dt className={DETAILS_LABEL}>Email</dt>
            <dd className={DETAILS_VALUE}>{signer.email ?? "Unavailable"}{signer.emailVerified ? <span className="ml-2 text-sm">Verified</span> : null}</dd>
          </div>
          <div>
            <dt className={DETAILS_LABEL}>Member since</dt>
            <dd className={DETAILS_VALUE}><AccountDate date={signer.memberSince} /></dd>
          </div>
          <div>
            <dt className={DETAILS_LABEL}>Last sign-in</dt>
            <dd className={DETAILS_VALUE}><AccountDate date={signer.lastSignInAt} withTime /></dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="password-heading" className={PANEL}>
        <h2 id="password-heading" className={HEADING}>Password</h2>
        {googleOnly ? (
          <p className="font-[family-name:var(--font-body)]">You sign in with Google. Manage your Google password in your Google account.</p>
        ) : (
          <>
            {hasEmailIdentity && signer.emailVerified ? <ChangePasswordForm /> : null}
            {signer.email && isRecoveryConfigured() ? (
              <p className="font-[family-name:var(--font-body)] text-sm">
                <Link href="/forgot-password" className="underline underline-offset-4">Send a password recovery link</Link> if you forgot your password or used to sign in by email link.
              </p>
            ) : null}
          </>
        )}
      </section>

      <form action={signOutAction}>
        <button type="submit" className="border-2 border-[var(--color-navy)] px-5 py-3 font-[family-name:var(--font-display)] text-sm font-semibold hover:bg-[var(--color-paper-deep)]">Sign out</button>
      </form>
    </div>
  );
}
