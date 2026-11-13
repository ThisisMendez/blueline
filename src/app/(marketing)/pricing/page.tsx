import type { Metadata } from "next";
import Link from "next/link";

import { linkClassName, PageShell, Panel, primaryActionClassName, StatusTag } from "@/features/site/PageShell";

export const metadata: Metadata = {
  title: "Pricing | Blueline Redline",
  description: "Blueline Redline is free while in beta. No cost and no card.",
};

const starterIncludes = [
  "Renter or landlord review of a residential lease",
  "PDF upload with the documents your lease mentions",
  "Lease Risk Score and flagged terms with exact quotes",
  "Severity and fee filters",
  "Drafts for the next step",
  "Six topics we check",
  "Saved reviews and personal red lines when you sign in",
] as const;

const proCandidates = [
  "State and local law references, checked by hand",
  "Plain-English summaries of those laws",
  "A toolkit to organize and compare proposed changes",
] as const;

export default function PricingPage() {
  return (
    <PageShell
      eyebrow="Pricing"
      title="Free while in beta"
      intro={
        <>
          <p>No cost, no card for the beta.</p>
          <p>
            Everyone can use every live feature while the beta runs. We
            haven&apos;t set prices for anything after the beta.
          </p>
        </>
      }
      aside={
        <Link href="/review" className={primaryActionClassName}>
          Analyze Lease <span aria-hidden="true">→</span>
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <Panel id="starter-heading" title="Starter">
          <p>
            <StatusTag>Live in beta</StatusTag>
          </p>
          <p>What everyone uses today.</p>
          <ul className="list-disc space-y-1 pl-5 marker:text-[var(--color-navy)]">
            {starterIncludes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Panel>

        <Panel id="pro-heading" title="Pro" tone="deep">
          <p>
            <StatusTag>Planned</StatusTag>
          </p>
          <p>
            Ideas for a later paid tier. None of them exist yet, and there is
            no price or sign-up.
          </p>
          <ul className="space-y-1">
            {proCandidates.map((item) => (
              <li key={item} className="flex flex-wrap items-center gap-2">
                {item} <StatusTag>Planned</StatusTag>
              </li>
            ))}
          </ul>
          <p className="text-sm">
            Law references need checked state and local coverage and a
            lawyer&apos;s review before they ship.{" "}
            <Link href="/features" className={linkClassName}>
              See all features
            </Link>
          </p>
        </Panel>
      </div>
    </PageShell>
  );
}
