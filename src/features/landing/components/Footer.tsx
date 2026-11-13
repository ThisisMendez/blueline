import Link from "next/link";

import { FeedbackLink } from "@/features/site/FeedbackLink";

const footerLinks = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Analyze My Lease", href: "/review" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
  { label: "Terms", href: "/terms", draft: true },
  { label: "Privacy", href: "/privacy", draft: true },
] as const;

const footerLinkClass = "inline-flex min-h-11 items-center font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-navy)] underline-offset-4 hover:text-[var(--color-red-ink)] hover:underline focus-visible:underline";

// Terms and Privacy are unverified drafts: they render only outside production
// until the owner (and counsel) approve them, so production hides the links.
function visibleLinks() {
  const production = process.env.VERCEL_ENV === "production";
  return footerLinks.filter((link) => !(production && "draft" in link));
}

export function Footer() {
  return (
    <footer className="border-t-2 border-[var(--color-navy)] px-6 py-4 sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--color-navy-ink)]">
            Blueline <span className="text-[var(--color-red-ink)]">Redline</span>
          </p>
          <p className="mt-1 font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]/70">
            Free while in beta. No cost, no card for the beta.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
            {visibleLinks().map(({ label, href }) => (
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
