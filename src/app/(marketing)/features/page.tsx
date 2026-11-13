import type { Metadata } from "next";
import Link from "next/link";

import { linkClassName, PageShell, Panel, StatusTag } from "@/features/site/PageShell";

export const metadata: Metadata = {
  title: "Features | Blueline Redline",
  description:
    "What you can use in Blueline Redline today, and what we plan to build next.",
};

const liveFeatures = [
  {
    name: "Renter or landlord review",
    body: "Pick your side before the review starts. Flags, severity, and explanations follow that choice.",
  },
  {
    name: "PDF intake with attachments",
    body: "Upload the lease and any fee list, rules, or addendum it mentions. Your browser reads the text, and we keep only that text, never the file.",
  },
  {
    name: "Missing document check",
    body: "If the lease refers to a document you didn't add, the review stops and names it.",
  },
  {
    name: "Lease Risk Score",
    body: "A score from 1 to 100 with a letter grade. Higher means we found fewer or less serious concerns. It sums up the verified flags and nothing else.",
  },
  {
    name: "Terms to look at",
    body: "Each flagged clause quotes the exact words from your lease, checked against the text. Filter by high, medium, or low severity.",
  },
  {
    name: "Fees and charges",
    body: "A filter that narrows the list to verified flags that mention fees or charges, so you can find them quickly.",
  },
  {
    name: "Plain-English explanations",
    body: "What each flagged clause could mean for you, in everyday words, with a suggested edit you could raise.",
  },
  {
    name: "Six topics we check",
    body: "Deposit deductions and return, early-exit costs, rent changes, repairs, access to the home, and dispute routes. A missing one shows as “Not found in the text reviewed.”",
  },
  {
    name: "Saved reviews and personal red lines",
    body: "Sign in to keep reviews in your library, rename them, and list your own red lines. Each saved review shows when it expires.",
  },
] as const;

const plannedFeatures = [
  {
    name: "Legal compliance checks",
    body: "Comparing a lease with the rules where the home is.",
  },
  {
    name: "State and local law library",
    body: "Links to official law sources, checked by hand, for the place you rent.",
  },
  {
    name: "Plain-English explanations of laws",
    body: "Short summaries of the rules behind those sources.",
  },
  {
    name: "Negotiation templates",
    body: "Ready-to-edit messages for asking the other party about a term.",
  },
] as const;

export default function FeaturesPage() {
  return (
    <PageShell
      eyebrow="Features"
      title="What you can use today"
      intro={
        <p>
          Everything in the first list works now and is free during the beta.
          The second list is work we&apos;ve planned but haven&apos;t built,
          with no date yet.
        </p>
      }
    >
      <div className="grid gap-4 md:grid-cols-[1.6fr_1fr] md:items-start md:gap-6">
        <Panel id="live-heading" title="Live now">
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {liveFeatures.map((feature) => (
              <div key={feature.name}>
                <dt className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-navy-ink)]">
                  {feature.name}
                </dt>
                <dd className="mt-0.5 text-sm leading-relaxed text-[var(--color-navy-ink)]">
                  {feature.body}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel id="planned-heading" title="Planned" tone="deep">
          <p className="text-sm">
            None of these are in the product yet. Legal research will stay
            separate from the live review and won&apos;t change the Lease Risk
            Score.
          </p>
          <ul className="space-y-3">
            {plannedFeatures.map((feature) => (
              <li key={feature.name}>
                <p className="flex flex-wrap items-center gap-2 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-navy-ink)]">
                  {feature.name} <StatusTag>Planned</StatusTag>
                </p>
                <p className="mt-0.5 text-sm leading-relaxed">{feature.body}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <p className="text-base leading-relaxed text-[var(--color-navy-ink)]">
        Want to see how a review runs?{" "}
        <Link href="/how-it-works" className={linkClassName}>
          Read how it works
        </Link>{" "}
        or{" "}
        <Link href="/pricing" className={linkClassName}>
          see what the beta costs
        </Link>
        .
      </p>
    </PageShell>
  );
}
