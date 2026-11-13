import Image from "next/image";
import Link from "next/link";

export function BrandHero() {
  return (
    <section className="relative overflow-hidden border-b-2 border-[var(--color-navy)] px-6 py-12 sm:px-10 sm:py-16 md:py-20">

      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <Image
          src="/brand/blueline-redline-mark.png"
          alt="A contract cut by a blue and red redline"
          width={160}
          height={160}
          className="h-32 w-32 object-contain sm:h-40 sm:w-40"
          priority
        />
        <p className="mt-5 font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-navy)]">
          Residential lease review
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-extrabold uppercase leading-[0.86] tracking-[-0.06em] text-[var(--color-navy-ink)] sm:text-7xl md:text-8xl">
          Blueline <span className="text-[var(--color-red)]">Redline</span>
        </h2>
        <p className="mt-5 font-[family-name:var(--font-data)] text-sm font-semibold uppercase tracking-[0.22em] text-[var(--color-navy)] sm:text-base">
          Review your rental agreement from your perspective.
        </p>
        <p className="mt-4 max-w-md font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
          Choose renter or landlord to see what could affect you and what to
          clarify before signing. We don&apos;t check it against local law.
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
