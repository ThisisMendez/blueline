import type { Metadata } from "next";

import { linkClassName, PageShell, Panel } from "@/features/site/PageShell";

export const metadata: Metadata = {
  title: "Resources | Blueline Redline",
  description: "Official U.S. government sources for renters and landlords.",
};

/* Each URL was checked to load on 2026-11-13. Official government sources only. */
const sources = [
  {
    name: "Tenant rights by state",
    publisher: "U.S. Department of Housing and Urban Development (HUD)",
    href: "https://www.hud.gov/topics/rental_assistance/tenantrights",
  },
  {
    name: "Fair housing",
    publisher: "HUD Office of Fair Housing and Equal Opportunity",
    href: "https://www.hud.gov/program_offices/fair_housing_equal_opp",
  },
  {
    name: "Housing help",
    publisher: "USA.gov",
    href: "https://www.usa.gov/housing-help",
  },
  {
    name: "How to file a complaint against a landlord",
    publisher: "USA.gov",
    href: "https://www.usa.gov/tenant-rights",
  },
  {
    name: "Get help paying rent and bills",
    publisher: "Consumer Financial Protection Bureau",
    href: "https://www.consumerfinance.gov/renthelp/",
  },
  {
    name: "Find free legal aid",
    publisher: "Legal Services Corporation",
    href: "https://www.lsc.gov/about-lsc/what-legal-aid/i-need-legal-help",
  },
] as const;

export default function ResourcesPage() {
  return (
    <PageShell
      eyebrow="Resources"
      title="Where to learn about your rights"
      intro={
        <p>
          Blueline Redline reads your lease. It doesn&apos;t check it against
          the law. These official sources can help you with that part, and
          rules differ by state and city.
        </p>
      }
    >
      <div className="grid gap-4 md:grid-cols-[1.6fr_1fr] md:items-start md:gap-6">
        <Panel id="sources-heading" title="Official sources">
          <ul className="divide-y divide-[var(--color-navy)]/30">
            {sources.map((source) => (
              <li key={source.href} className="py-2 first:pt-0 last:pb-0">
                <a href={source.href} className={linkClassName} rel="noopener noreferrer">
                  {source.name}
                </a>
                <p className="text-sm">{source.publisher}</p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel id="lawyer-heading" title="When to talk to a lawyer" tone="deep">
          <p>
            If a flagged term worries you, bring the exact words from your
            report to a qualified lawyer, a legal aid office, or a local
            tenant or landlord group. They can tell you how the rules where
            you live apply to it.
          </p>
        </Panel>
      </div>
    </PageShell>
  );
}
