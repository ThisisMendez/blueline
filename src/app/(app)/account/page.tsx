import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAccountsState } from "@/features/auth/session";
import type { StoredReviewSummary } from "@/features/library/store";
import { openReviewStore } from "@/features/library/supabase-store";
import { LibraryList } from "@/features/review/components/LibraryList";

export const metadata: Metadata = { title: "Your account | Blueline Redline" };

export default async function AccountPage() {
  const accounts = await getAccountsState();
  if (accounts.kind !== "signed-in") redirect("/sign-in?next=/account");

  const { signer } = accounts;
  let reviews: readonly StoredReviewSummary[] = [];
  let unavailable = false;
  try {
    const store = await openReviewStore();
    if (store) reviews = await store.listForSigner(signer.id);
    else unavailable = true;
  } catch {
    unavailable = true;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-navy)]">Your lease analyst</p>
          <h1 className="mt-3 break-words font-[family-name:var(--font-display)] text-3xl font-bold leading-tight text-[var(--color-navy-ink)]">
            {signer.displayName ? `Welcome back, ${signer.displayName}` : "Welcome back"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/review" className="bg-[var(--color-navy)] px-5 py-3 font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-paper)] hover:bg-[var(--color-navy-ink)]">Start a review</Link>
          <Link href="/account/settings" className="font-[family-name:var(--font-display)] text-sm font-semibold underline underline-offset-4">Account settings</Link>
        </div>
      </div>
      <LibraryList reviews={reviews} unavailable={unavailable} />
    </div>
  );
}
