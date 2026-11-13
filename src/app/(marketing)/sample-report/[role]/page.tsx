import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { REVIEW_ROLES, type ReviewRole } from "@/features/analysis/types";
import { ReviewResult } from "@/features/review/components/ReviewResult";
import { sampleDocument, sampleReview } from "@/features/review/sample-report";
import { canIssueReviewContinuation } from "@/features/review/session/continuation";
import { scoreFromStoredReview } from "@/features/score";
import { primaryActionClassName } from "@/features/site/PageShell";

export const metadata: Metadata = {
  title: "Sample lease reports | Blueline Redline",
  description: "Explore an example rental agreement from the renter and landlord perspectives.",
};

const LABELS = { renter: "Renter", landlord: "Landlord" } as const;
const ROLE_LINK = "inline-flex min-h-11 items-center border-2 border-[var(--color-navy)] px-4 py-2 text-sm font-bold text-[var(--color-navy)] hover:bg-[var(--color-paper-deep)] aria-[current=page]:bg-[var(--color-navy)] aria-[current=page]:text-[var(--color-paper)]";

export function generateStaticParams() {
  return REVIEW_ROLES.map((role) => ({ role }));
}

export default async function SampleReportPage({ params }: { readonly params: Promise<{ role: string }> }) {
  const { role: segment } = await params;
  const role = REVIEW_ROLES.find((value): value is ReviewRole => value === segment);
  if (!role) notFound();
  const review = sampleReview(role);

  return (
    <main id="main" tabIndex={-1} className="flex-1 px-6 py-6 sm:px-10 md:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="space-y-3 border-b-2 border-[var(--color-navy)] pb-4">
          <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-navy)]">Sample report</p>
          <p className="max-w-2xl text-sm">Both reports use the same fictional lease. Pick a side and try the drafting tools.</p>
          {canIssueReviewContinuation() ? (
            <p className="max-w-2xl text-sm">For your own lease, you can read the report as a guest. Sign in when you want to draft wording or save the report.</p>
          ) : null}
          <nav aria-label="Sample report perspective" className="flex flex-wrap gap-2">
            {REVIEW_ROLES.map((view) => (
              <Link key={view} href={`/sample-report/${view}`} aria-current={role === view ? "page" : undefined} className={ROLE_LINK}>
                {LABELS[view]} sample
              </Link>
            ))}
          </nav>
          <details>
            <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold underline underline-offset-4">Read the fictional lease</summary>
            <p className="max-w-3xl whitespace-pre-line bg-[var(--color-paper-deep)] p-3 text-sm">{sampleDocument.text}</p>
          </details>
        </header>
        <ReviewResult review={review} documents={[sampleDocument]} title={sampleDocument.title} score={scoreFromStoredReview({ review })} />
        <div><Link href="/review" className={primaryActionClassName}>Analyze my lease</Link></div>
      </div>
    </main>
  );
}
