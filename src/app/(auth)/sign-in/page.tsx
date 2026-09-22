import Link from "next/link";

// Placeholder only: the app shell and its sign-in flow are specced in
// .impeccable/surfaces/app-app-layout-tsx.md but not built yet. This route
// exists so the landing page's call to action has somewhere real to land.
export default function SignIn() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-navy)]">
        Status
      </p>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-navy-ink)]">
        Sign-in isn&apos;t wired up yet
      </h1>
      <p className="max-w-md font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)]/80">
        The review flow behind it is still being built.
      </p>
      <Link
        href="/"
        className="mt-2 font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wide text-[var(--color-navy)] underline decoration-2 underline-offset-4 hover:text-[var(--color-red-ink)]"
      >
        Back to the landing page
      </Link>
    </main>
  );
}
