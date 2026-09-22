import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t-2 border-[var(--color-navy)] px-6 py-10 sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--color-navy-ink)]">
          Blueline <span className="text-[var(--color-red-ink)]">Redline</span>
        </p>
        <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]/70">
          Free to use while we prove this works. No cost, no card, for this
          version.
        </p>
        <Link
          href="/sign-in"
          className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wide text-[var(--color-navy)] underline decoration-2 underline-offset-4 hover:text-[var(--color-red-ink)]"
        >
          Sign in
        </Link>
      </div>
    </footer>
  );
}
