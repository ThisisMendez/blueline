import type { ReactNode } from "react";
import Link from "next/link";

import { AccountsNotice } from "./AccountsNotice";

export interface AuthPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export function authPageHref(path: string, next: string, parameters?: Readonly<Record<string, string>>): string {
  const query = new URLSearchParams(parameters);
  if (next !== "/account") query.set("next", next);
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export function AuthFrame({ title, description, configured = true, problem, children }: {
  readonly title: string;
  readonly description?: string;
  readonly configured?: boolean;
  readonly problem?: string;
  readonly children?: ReactNode;
}) {
  return (
    <main id="main" className="flex flex-1 flex-col items-center px-6 py-16 sm:px-10 md:py-24">
      <div className="flex w-full max-w-lg flex-col gap-6">
        <div>
          <Link href="/" className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[var(--color-navy-ink)]">
            Blueline <span className="text-[var(--color-red-ink)]">Redline</span>
          </Link>
          <h1 className="mt-6 font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-3xl">
            {title}
          </h1>
          {description ? <p className="mt-4 font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">{description}</p> : null}
        </div>
        {configured ? (
          <>
            {problem ? (
              <p role="status" className="border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] px-4 py-3 text-sm">{problem}</p>
            ) : null}
            {children}
          </>
        ) : <AccountsNotice />}
        <Link href="/review" className="text-sm underline">Review a lease without an account</Link>
      </div>
    </main>
  );
}
