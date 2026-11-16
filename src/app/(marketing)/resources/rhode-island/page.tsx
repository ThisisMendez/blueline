import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { linkClassName, PageShell, Panel } from "@/features/site/PageShell";
import { availableRhodeIslandReferences, rhodeIslandPilotEnabled } from "@/features/site/rhode-island-references";

export const metadata: Metadata = {
  alternates: { canonical: "/resources/rhode-island" },
  title: "Rhode Island rental law",
  description: "Official Rhode Island law links for residential renters and landlords.",
};

const reviewDate = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

export default async function RhodeIslandResourcesPage() {
  await connection();
  if (!rhodeIslandPilotEnabled()) notFound();

  const references = await availableRhodeIslandReferences();

  return (
    <PageShell
      eyebrow="Resources"
      title="Rhode Island rental law"
      intro={
        <>
          <p>This page links only to Rhode Island state law. Providence and other cities and towns can add requirements. This list leaves out local rules.</p>
          <p>The official links are for general information. For legal advice about how these laws apply to your lease, talk to a qualified lawyer. Your lease review and score use only the documents you provide.</p>
        </>
      }
    >
      <Panel id="ri-statutes" title="Official Rhode Island sources">
        {references.length ? (
          <ul className="divide-y divide-[var(--color-navy)]/30">
            {references.map(({ title, section, url, reviewedOn }) => (
              <li key={section} className="py-2 first:pt-0 last:pb-0">
                <a href={url} className={linkClassName} rel="noopener noreferrer">{title}</a>
                <p className="text-sm">R.I. Gen. Laws § {section}</p>
                <p className="text-sm">Last reviewed <time dateTime={reviewedOn}>{reviewDate.format(new Date(reviewedOn))}</time></p>
              </li>
            ))}
          </ul>
        ) : (
          <p>These links are under review. You can still find housing help and legal aid on the Resources page.</p>
        )}
      </Panel>
      <p className="text-sm">
        New laws can take effect before the state updates its statute pages.
        We hide links when a source changes or its review expires and show them again after a current check passes.
      </p>
      <p><Link href="/resources" className={linkClassName}>Back to all resources</Link></p>
    </PageShell>
  );
}
