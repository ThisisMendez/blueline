import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AccountsNotice } from "@/features/auth/components/AccountsNotice";
import { getAccountsState } from "@/features/auth/session";
import { openReviewStore } from "@/features/library/supabase-store";
import { ReviewResult } from "@/features/review/components/ReviewResult";

/**
 * A review read back from the library.
 *
 * The store is asked for this review *as this signer*. Another signer's id
 * gets nothing back, here and in Postgres, where the row-level security
 * policies enforce the same rule independently of this page.
 */
export default async function SavedReviewPage(
  props: PageProps<"/review/[reviewId]">,
) {
  const { reviewId } = await props.params;
  const accounts = await getAccountsState();

  if (accounts.kind === "unconfigured") {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <AccountsNotice />
        <p className="font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)]">
          Reviews are not kept on this deployment, so there is nothing at this
          address.{" "}
          <Link
            href="/review"
            className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wide text-[var(--color-navy)] underline decoration-2 underline-offset-4 hover:text-[var(--color-red-ink)]"
          >
            Run a new review
          </Link>
        </p>
      </div>
    );
  }

  if (accounts.kind === "signed-out") {
    redirect(`/sign-in?next=/review/${reviewId}`);
  }

  const store = await openReviewStore();
  if (!store) notFound();

  const stored = await store.findForSigner(accounts.signer.id, reviewId);
  if (!stored) notFound();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
      <div>
        <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-navy)]">
          Saved review
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-3xl">
          {stored.documents[0]?.title ?? "Your review"}
        </h1>
      </div>

      <ReviewResult review={stored.review} documents={stored.documents} reviewId={stored.id} />

      <p>
        <Link
          href="/review"
          className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wide text-[var(--color-navy)] underline decoration-2 underline-offset-4 hover:text-[var(--color-red-ink)]"
        >
          Review another lease
        </Link>
      </p>
    </div>
  );
}
