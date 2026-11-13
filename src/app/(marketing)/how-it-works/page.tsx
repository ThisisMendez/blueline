import type { Metadata } from "next";
import Link from "next/link";

import { linkClassName, PageShell, Panel, primaryActionClassName } from "@/features/site/PageShell";

export const metadata: Metadata = {
  title: "How It Works | Blueline Redline",
  description:
    "Upload your lease as a PDF, pick renter or landlord, and get a report that quotes the exact words behind each flag.",
};

/*
 * Step 2 follows the real order in src/features/analysis/server/route.ts and
 * src/features/analysis/review.ts: text is extracted in the browser, the
 * packet is checked for missing documents, the model proposes flags, every
 * quote is verified (one retry, then dropped), and the six-topic checklist
 * is a separate question asked after that. The steps run one after another.
 */
const readingSteps = [
  "Your browser pulls the text out of each PDF. The file itself never leaves your device.",
  "We check that every document the lease points to is there. If one is missing, we stop and tell you which one.",
  "We look for terms that could hurt the side you picked.",
  "We match each quote against your text, word for word. A flag whose quote we can't find gets one retry, then we drop it.",
  "We check the lease for six common topics and note any we can't find.",
] as const;

export default function HowItWorksPage() {
  return (
    <PageShell
      eyebrow="How it works"
      title="From PDF to report in three steps"
      intro={
        <p>
          We read the lease and the PDFs you add. We look for terms that could
          cost you money, change what you have to do, or limit your options,
          and we show you the exact words behind each flag. We also check six
          common lease topics. We don&apos;t check your lease against local
          law.
        </p>
      }
    >
      <ol className="grid gap-4 md:grid-cols-3 md:gap-6">
        <li className="contents">
          <Panel id="step-upload" title="1. Upload your lease">
            <p>
              Pick renter or landlord first. The report looks at the lease from
              that side.
            </p>
            <p>
              Choose the lease as a PDF with selectable text. If it mentions a
              fee list, house rules, or an addendum, add each one with
              &ldquo;Add another PDF&rdquo;. Scanned pages and photos
              won&apos;t work.
            </p>
            <p>
              You don&apos;t need an account to run a review. Sign in if you
              want to save it.
            </p>
          </Panel>
        </li>
        <li className="contents">
          <Panel id="step-read" title="2. We read the lease" tone="deep">
            <ol className="list-decimal space-y-1.5 pl-5 marker:font-[family-name:var(--font-data)] marker:text-sm marker:text-[var(--color-navy)]">
              {readingSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </Panel>
        </li>
        <li className="contents">
          <Panel id="step-report" title="3. Get your report">
            <p>
              You get a Lease Risk Score and the flagged clauses, each with
              the exact words from your lease and a plain-English explanation.
            </p>
            <p>
              The score sums up the verified flags. It doesn&apos;t say whether
              to sign, whether a term is legal, or that we found every risk.
            </p>
            <p>
              <Link href="/#sample-report" className={linkClassName}>
                See a sample report
              </Link>
            </p>
          </Panel>
        </li>
      </ol>

      <section
        aria-labelledby="how-limits-heading"
        className="grid gap-3 border-y-2 border-[var(--color-navy)] py-4 md:grid-cols-[1fr_1.5fr] md:items-center md:gap-10"
      >
        <h2
          id="how-limits-heading"
          className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-3xl"
        >
          What the report can&apos;t tell you
        </h2>
        <div className="space-y-2 text-base leading-relaxed text-[var(--color-navy-ink)]">
          <p>
            It reports what your lease says and what could follow from it. It
            won&apos;t tell you whether a term is allowed where you live or
            whether to sign. For that, take your questions to a qualified
            lawyer or a local tenant or landlord group.
          </p>
          <p>
            <Link href="/review" className={primaryActionClassName}>
              Analyze Lease <span aria-hidden="true">→</span>
            </Link>
          </p>
        </div>
      </section>
    </PageShell>
  );
}
