import Link from "next/link";

import type { LegalSection } from "./legal-content";
import { PageShell } from "./PageShell";
import { SUPPORT_EMAIL } from "./policy-versions";

export function LegalPolicy({
  title,
  version,
  effectiveDate,
  sections,
  versionPath,
}: {
  readonly title: string;
  readonly version: number;
  readonly effectiveDate: string;
  readonly sections: readonly LegalSection[];
  readonly versionPath?: string;
}) {
  return (
    <PageShell
      eyebrow="Legal"
      title={title}
      intro={<p>Version {version} · Effective {effectiveDate}</p>}
    >
      <div className="grid max-w-3xl gap-5">
        {sections.map((section, index) => (
          <section key={section.heading} aria-labelledby={`legal-${index}`}>
            <h2
              id={`legal-${index}`}
              className="font-[family-name:var(--font-display)] text-xl font-bold leading-tight text-[var(--color-navy-ink)]"
            >
              {section.heading}
            </h2>
            <div className="mt-1.5 space-y-2 text-base leading-relaxed text-[var(--color-navy-ink)]">
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </section>
        ))}
        <p className="text-base leading-relaxed text-[var(--color-navy-ink)]">
          Email <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or visit our{" "}
          <Link className="underline" href="/contact">Contact page</Link>.
        </p>
        {versionPath ? <p><Link className="underline" href={versionPath}>Permanent link to version {version}</Link></p> : null}
      </div>
    </PageShell>
  );
}
