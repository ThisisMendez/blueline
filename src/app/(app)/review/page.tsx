import type { Metadata } from "next";
import Link from "next/link";

import { AccountsNotice } from "@/features/auth/components/AccountsNotice";
import { getAccountsState } from "@/features/auth/session";
import { openReviewStore } from "@/features/library/supabase-store";
import type { StoredReviewSummary } from "@/features/library/store";
import { LibraryList } from "@/features/review/components/LibraryList";
import { DocumentIntake } from "@/features/review/components/DocumentIntake";

export const metadata: Metadata = {
  title: "Review a lease | Blueline Redline",
};

/** Public intake; authenticated signers also see their retained reviews. */
export default async function ReviewPage() {
  const accounts = await getAccountsState();

  const signedIn = accounts.kind === "signed-in";
  let library: readonly StoredReviewSummary[] = [];

  if (signedIn) {
    const store = await openReviewStore();
    if (store) {
      library = await store.listForSigner(accounts.signer.id);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
      <div>
        <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]">
          New review
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-3xl">
          Your lease, read sentence by sentence
        </h1>
        <p className="mt-4 max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
          Paste the text, or open a PDF you can select text in. Add the
          documents your lease points at, such as a fee schedule or an
          addendum, so we read the whole agreement rather than part of it.
          You get a plain-English summary and the terms that could cost you,
          heaviest first, each one quoting the sentence it came from.
        </p>
      </div>

      {accounts.kind === "unconfigured" ? <AccountsNotice /> : !signedIn ? (
        <p className="font-[family-name:var(--font-body)]">
          This review stays in this tab. <Link href="/sign-in" className="underline">Sign in</Link> to
          keep reviews in your library and set personal red lines.
        </p>
      ) : null}

      <DocumentIntake persists={signedIn} />

      {signedIn ? <LibraryList reviews={library} /> : null}
    </div>
  );
}
