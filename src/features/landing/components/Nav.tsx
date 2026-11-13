import Image from "next/image";
import Link from "next/link";

const navigation = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
] as const;

const navLinkClassName =
  "inline-flex min-h-11 items-center text-[var(--color-navy)] underline-offset-4 hover:text-[var(--color-red-ink)] hover:underline focus-visible:underline";

export function Nav() {
  return (
    <header className="border-b-2 border-[var(--color-navy)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-3 sm:px-10 lg:flex-row lg:items-center lg:justify-between">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2.5 self-start rounded-sm lg:self-auto"
          aria-label="Blueline Redline home"
        >
          <Image
            src="/brand/blueline-redline-mark.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            priority
          />
          <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[var(--color-navy-ink)]">
            Blueline{" "}
            <span className="text-[var(--color-red-ink)]">Redline</span>
          </span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="grid grid-cols-3 items-center gap-x-2 gap-y-1 font-[family-name:var(--font-display)] text-sm font-semibold sm:flex sm:flex-wrap sm:gap-x-6"
        >
          {navigation.map(({ label, href }) => (
            <Link key={href} href={href} className={navLinkClassName}>
              {label}
            </Link>
          ))}
          <Link href="/sign-in" className={navLinkClassName}>
            My Account
          </Link>
          <Link
            href="/review"
            className="col-span-3 inline-flex min-h-11 items-center justify-center bg-[var(--color-navy)] px-4 py-2 text-center font-bold text-[var(--color-paper)] transition-colors hover:bg-[var(--color-navy-ink)]"
          >
            Analyze My Lease
          </Link>
        </nav>
      </div>
    </header>
  );
}
