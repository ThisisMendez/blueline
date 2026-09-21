import Link from "next/link";

export function Nav() {
  return (
    <header className="border-b-2 border-[var(--color-navy)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span
          className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[var(--color-navy-ink)]"
        >
          Blueline <span className="text-[var(--color-red)]">Redline</span>
        </span>
        <Link
          href="/sign-in"
          className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wide text-[var(--color-navy)] underline decoration-2 underline-offset-4 hover:text-[var(--color-red)]"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
