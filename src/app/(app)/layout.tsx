import Link from "next/link";

import { signOutAction } from "@/features/auth/actions";
import { getAccountsState } from "@/features/auth/session";

/**
 * The app shell behind sign-in. The landing page's field-guide language
 * carries through rather than turning into dashboard chrome: paper ground,
 * 2px navy rules, mono labels, and red held back for citations and severity
 * inside the work itself.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const accounts = await getAccountsState();

  return (
    <>
      <header className="border-b-2 border-[var(--color-navy)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[var(--color-navy-ink)]"
          >
            Blueline <span className="text-[var(--color-red-ink)]">Redline</span>
          </Link>

          {accounts.kind === "signed-in" ? (
            <div className="flex items-center gap-4">
              <span className="font-[family-name:var(--font-data)] text-xs uppercase tracking-wide text-[var(--color-navy)]">
                {accounts.signer.email ?? "Signed in"}
              </span>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wide text-[var(--color-navy)] underline decoration-2 underline-offset-4 hover:text-[var(--color-red-ink)]"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : accounts.kind === "signed-out" ? (
            <Link
              href="/sign-in"
              className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wide text-[var(--color-navy)] underline decoration-2 underline-offset-4 hover:text-[var(--color-red-ink)]"
            >
              Sign in
            </Link>
          ) : (
            <span className="font-[family-name:var(--font-data)] text-xs uppercase tracking-wide text-[var(--color-navy)]">
              Accounts aren&apos;t running yet
            </span>
          )}
        </div>
      </header>

      <main id="main" className="flex-1 px-6 py-12 sm:px-10 md:py-16">
        {children}
      </main>

      <footer className="border-t-2 border-[var(--color-navy)]">
        <p className="mx-auto max-w-6xl px-6 py-6 font-[family-name:var(--font-data)] text-xs uppercase tracking-wide text-[var(--color-navy)]">
          Blueline Redline reports what your document says. It does not tell
          you whether to sign it.
        </p>
      </footer>
    </>
  );
}
