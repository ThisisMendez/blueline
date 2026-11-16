import type { Metadata } from "next";
import Link from "next/link";

import { AccountsNotice } from "@/features/auth/components/AccountsNotice";
import { getAccountsState } from "@/features/auth/session";
import { openReviewStore } from "@/features/library/supabase-store";
import type { StoredReviewSummary } from "@/features/library/store";
import { LibraryList } from "@/features/review/components/LibraryList";
import { DocumentIntake } from "@/features/review/components/DocumentIntake";
import { CURRENT_LEGAL } from "@/features/site/policy-versions";

export const metadata: Metadata = {
  alternates: { canonical: "/review" },
  title: "Review a lease",
};

/** Public intake; authenticated signers also see their retained reviews. */
export default async function ReviewPage() {
  const accounts = await getAccountsState();

  const signedIn = accounts.kind === "signed-in";
  let library: readonly StoredReviewSummary[] = [];
  let libraryUnavailable = false;

  if (signedIn) {
    try {
      const store = await openReviewStore();
      if (store) library = await store.listForSigner(accounts.signer.id);
      else libraryUnavailable = true;
    } catch { libraryUnavailable = true; }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]">
          New review
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-3xl">
          Review your lease
        </h1>
        <p className="max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
          We show the biggest risks first and quote the lease for each one.
          We don&apos;t check it against local law.
        </p>
      </div>

      {accounts.kind === "unconfigured" ? <AccountsNotice /> : null}

      <DocumentIntake
        persists={signedIn}
        notice={
          <>
            <p>
              We send the text and names of your documents to our AI providers to run the review.
              Remove sensitive details, such as bank information or signatures, before you upload.
            </p>
            {!signedIn ? (
              <p>
                By starting a review you agree to the{" "}
                <Link href={CURRENT_LEGAL.termsPath} target="_blank" rel="noopener noreferrer" className="underline">Terms of Use</Link>
                {" and "}
                <Link href={CURRENT_LEGAL.privacyPath} target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</Link>.
              </p>
            ) : null}
            {accounts.kind === "signed-out" ? (
              <p>
                This review stays in this tab. <Link href="/sign-in" className="underline decoration-2 underline-offset-4">Sign in</Link> to
                keep reviews in your library and set personal red lines.
              </p>
            ) : null}
          </>
        }
      />

      {signedIn ? <LibraryList reviews={library} unavailable={libraryUnavailable} /> : null}
    </div>
  );
}
