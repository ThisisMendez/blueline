export function Footer() {
  return (
    <footer className="border-t-2 border-[var(--color-navy)] px-6 py-4 sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:gap-4 sm:items-baseline sm:justify-between">
        <p className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--color-navy-ink)]">
          Blueline <span className="text-[var(--color-red-ink)]">Redline</span>
        </p>
        <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]/70">
          Free to use while we prove this works. No cost, no card, for this
          version.
        </p>
        <section
          id="contact"
          tabIndex={-1}
          aria-labelledby="contact-heading"
          className="scroll-mt-6"
        >
          <h2
            id="contact-heading"
            className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--color-navy-ink)]"
          >
            Contact
          </h2>
          <a
            href="https://github.com/ThisisMendez/blueline/issues"
            className="inline-flex min-h-11 items-center font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-navy)] underline decoration-2 underline-offset-4 hover:text-[var(--color-red-ink)]"
          >
            Share feedback on GitHub
          </a>
        </section>
      </div>
    </footer>
  );
}
