import Link from "next/link";

export function BrandHero() {
  return (
    <section className="border-b-2 border-[var(--color-navy)] px-6 py-8 sm:px-10 md:py-12">
      <div className="mx-auto grid max-w-6xl items-center gap-7 md:grid-cols-[3fr_2fr] md:gap-12">
        <div>
          <h1 className="max-w-[16ch] text-balance font-[family-name:var(--font-display)] text-4xl font-extrabold leading-none tracking-[-0.05em] text-[var(--color-navy-ink)] sm:text-5xl lg:text-6xl">
            Understand your rental lease.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--color-navy-ink)] sm:text-lg">
            Spot risky terms and see the exact clause behind each flag.
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--color-navy-ink)]">
            Choose renter or landlord to see what could affect your side.
            We don&apos;t check your lease against local law.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 font-[family-name:var(--font-display)] text-sm font-bold">
            <Link
              href="/review"
              className="inline-flex min-h-11 items-center gap-3 border-2 border-[var(--color-navy)] bg-[var(--color-navy)] px-4 py-2 text-[var(--color-paper)] transition-colors hover:border-[var(--color-navy-ink)] hover:bg-[var(--color-navy-ink)]"
            >
              Review a lease <span aria-hidden="true">→</span>
            </Link>
            <a
              href="#sample-report"
              className="inline-flex min-h-11 items-center px-2 text-[var(--color-navy)] underline underline-offset-4 hover:text-[var(--color-red-ink)]"
            >
              See sample report
            </a>
          </div>
        </div>
        <div className="border-l-[3px] border-[var(--color-red-ink)] py-1 pl-4 md:py-4 md:pl-6">
          <p className="font-[family-name:var(--font-display)] text-2xl font-extrabold leading-tight tracking-tight text-[var(--color-navy-ink)] sm:text-3xl">
            Draw the line before you sign.
          </p>
        </div>
      </div>
    </section>
  );
}
