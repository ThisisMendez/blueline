import { DraftBanner } from "./DraftBanner";
import { LEGAL_DRAFT_DATE, type LegalSection } from "./legal-content";
import { PageShell } from "./PageShell";

export function LegalDraft({
  eyebrow,
  title,
  sections,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly sections: readonly LegalSection[];
}) {
  return (
    <PageShell
      eyebrow={eyebrow}
      title={title}
      intro={<p>Draft dated {LEGAL_DRAFT_DATE}.</p>}
      aside={<DraftBanner />}
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
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
