import Link from "next/link";
import { BrandMark } from "./BrandMark";

export function BrandHero() {
  return (
    <section className="relative overflow-hidden border-b-2 border-[var(--color-navy)] px-6 py-12 sm:px-10 sm:py-16 md:py-20">
      <p className="absolute left-6 top-1/2 hidden max-w-[9rem] -translate-y-1/2 border-l border-[var(--color-navy)] pl-4 font-[family-name:var(--font-data)] text-xs uppercase leading-relaxed tracking-[0.16em] text-[var(--color-navy)] lg:block">
        Clearer contracts. Stronger renters.
      </p>
      <p className="absolute right-6 top-1/2 hidden max-w-[9rem] -translate-y-1/2 border-l border-[var(--color-navy)] pl-4 font-[family-name:var(--font-data)] text-xs uppercase leading-relaxed tracking-[0.16em] text-[var(--color-navy)] lg:block">
        Same paper. A brighter tomorrow.
      </p>

      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <BrandMark
          title="A contract cut by a blue and red redline"
          className="h-32 w-32 text-[var(--color-navy)] sm:h-40 sm:w-40"
        />
        <p className="mt-5 font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-navy)]">
          Residential lease review
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-extrabold uppercase leading-[0.86] tracking-[-0.06em] text-[var(--color-navy-ink)] sm:text-7xl md:text-8xl">
          Blueline <span className="text-[var(--color-red)]">Redline</span>
        </h2>
        <p className="mt-5 font-[family-name:var(--font-data)] text-sm font-semibold uppercase tracking-[0.22em] text-[var(--color-navy)] sm:text-base">
          Read the terms. Make your mark.
        </p>
        <Link
          href="/sign-in"
          className="mt-7 inline-flex items-center gap-4 bg-[var(--color-navy)] px-7 py-3.5 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-paper)] transition-colors hover:bg-[var(--color-navy-ink)]"
        >
          Review a lease <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
