import Link from "next/link";

import { FeedbackLink } from "@/features/site/FeedbackLink";
import { PRODUCT_NAME } from "@/shared/brand";

const footerLinks = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Analyze My Lease", href: "/review" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
] as const;

const footerLinkClass = "inline-flex min-h-11 items-center font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-navy)] underline-offset-4 hover:text-[var(--color-red-ink)] hover:underline focus-visible:underline";

export function Footer() {
  return (
    <footer className="border-t-2 border-[var(--color-navy)] px-6 py-4 sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--color-navy-ink)]">
            © 2026 {PRODUCT_NAME}
          </p>
          <p className="mt-1 font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]/70">
            Free while in beta. No cost, no card for the beta.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
            {footerLinks.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={footerLinkClass}
                >
                  {label}
                </Link>
              </li>
            ))}
            <li><FeedbackLink className={footerLinkClass} /></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
