import type { ReactNode } from "react";

/**
 * The frame every public page past the homepage shares: one heading, one short
 * intro, then the page's own content. Spacing and type match the compact
 * homepage so the marketing pages read as one site.
 */
export function PageShell({
  eyebrow,
  title,
  intro,
  aside,
  children,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly intro: ReactNode;
  /** Optional content set beside the intro on wide screens. */
  readonly aside?: ReactNode;
  readonly children?: ReactNode;
}) {
  return (
    <main id="main" tabIndex={-1} className="flex-1 px-6 py-6 sm:px-10 md:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:gap-8">
        <header
          className={`grid gap-3 border-b-2 border-[var(--color-navy)] pb-4 ${
            aside ? "md:grid-cols-[1.4fr_1fr] md:items-end md:gap-10" : ""
          }`}
        >
          <div className="max-w-2xl">
            <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-navy)]">
              {eyebrow}
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-5xl">
              {title}
            </h1>
            <div className="mt-2 space-y-2 text-base leading-relaxed text-[var(--color-navy-ink)]">
              {intro}
            </div>
          </div>
          {aside ? <div>{aside}</div> : null}
        </header>
        {children}
      </div>
    </main>
  );
}

/** A titled block of content: the unit pages pair side by side on desktop. */
export function Panel({
  title,
  id,
  tone = "plain",
  children,
}: {
  readonly title: string;
  readonly id: string;
  readonly tone?: "plain" | "deep";
  readonly children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={`border-2 border-[var(--color-navy)] px-4 py-3 sm:px-5 sm:py-4 ${
        tone === "deep" ? "bg-[var(--color-paper-deep)]" : "bg-[var(--color-paper)]"
      }`}
    >
      <h2
        id={id}
        className="font-[family-name:var(--font-display)] text-xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-2xl"
      >
        {title}
      </h2>
      <div className="mt-2 space-y-2 text-base leading-relaxed text-[var(--color-navy-ink)]">
        {children}
      </div>
    </section>
  );
}

/** A small mono label, used for "Live now" and "Planned" status tags. */
export function StatusTag({ children }: { readonly children: ReactNode }) {
  return (
    <span className="inline-block border border-[var(--color-navy)] px-1.5 py-0.5 font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-navy)]">
      {children}
    </span>
  );
}

export const linkClassName =
  "font-semibold text-[var(--color-navy)] underline decoration-2 underline-offset-4 hover:text-[var(--color-red-ink)]";

export const primaryActionClassName =
  "inline-flex min-h-11 items-center gap-3 border-2 border-[var(--color-navy)] bg-[var(--color-navy)] px-5 py-2 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-paper)] transition-colors hover:border-[var(--color-navy-ink)] hover:bg-[var(--color-navy-ink)]";
