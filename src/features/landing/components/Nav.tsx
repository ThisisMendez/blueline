"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

import { PRODUCT_MARK, PRODUCT_NAME, PRODUCT_TRADEMARK } from "@/shared/brand";

const navigation = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
  { label: "My Account", href: "/sign-in" },
] as const;

const navLinkClassName =
  "inline-flex min-h-11 items-center text-[var(--color-navy)] underline-offset-4 hover:text-[var(--color-red-ink)] hover:underline focus-visible:underline";

export function Nav() {
  const isHome = usePathname() === "/";
  const menu = useRef<HTMLDetailsElement>(null);
  const menuToggle = useRef<HTMLElement>(null);

  function closeMenu() {
    if (menu.current) menu.current.open = false;
  }

  return (
    <header className={isHome ? "border-b border-[var(--color-navy)] bg-[#fcf7ee]" : "border-b-2 border-[var(--color-navy)]"}>
      <div className={`mx-auto grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-3 lg:grid-cols-[auto_1fr_auto] lg:gap-x-6 ${isHome ? "max-w-[100rem] px-[clamp(1.25rem,3.9vw,3.75rem)]" : "max-w-6xl px-6 sm:px-10"}`}>
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2.5 justify-self-start rounded-sm"
          aria-label={`${PRODUCT_NAME} home`}
        >
          <Image
            src={PRODUCT_MARK}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            priority
          />
          <span className={`font-bold tracking-tight text-[var(--color-navy-ink)] ${isHome ? "font-[family-name:var(--font-body)] text-xl sm:text-[1.7rem]" : "font-[family-name:var(--font-display)] text-lg"}`}>
            {isHome ? PRODUCT_TRADEMARK : PRODUCT_NAME}
          </span>
        </Link>
        <details
          ref={menu}
          className="relative justify-self-end font-[family-name:var(--font-display)] text-sm font-semibold lg:hidden"
          onKeyDown={(event) => {
            if (event.key !== "Escape" || !event.currentTarget.open) return;
            closeMenu();
            menuToggle.current?.focus();
          }}
        >
          <summary
            ref={menuToggle}
            className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-2 text-[var(--color-navy)] [&::-webkit-details-marker]:hidden"
          >
            Menu
            <span aria-hidden="true" className="h-2 w-2 rotate-45 border-b-2 border-r-2 border-current" />
          </summary>
          <nav
            aria-label="Mobile navigation"
            className="absolute right-0 top-full z-10 mt-1 flex w-44 flex-col border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-3 py-1"
          >
            <Link href="/review" onNavigate={closeMenu} className={navLinkClassName}>
              Analyze My Lease
            </Link>
            {navigation.map(({ label, href }) => (
              <Link key={href} href={href} onNavigate={closeMenu} className={navLinkClassName}>
                {label}
              </Link>
            ))}
          </nav>
        </details>
        <nav
          aria-label="Main navigation"
          className={`hidden items-center gap-x-6 justify-self-end font-[family-name:var(--font-display)] font-semibold lg:flex ${isHome ? "text-sm xl:text-base" : "text-sm"}`}
        >
          {navigation.map(({ label, href }) => (
            <Link key={href} href={href} className={navLinkClassName}>
              {label}
            </Link>
          ))}
        </nav>
        <Link
          href="/review"
          className={`hidden min-h-11 items-center justify-center bg-[var(--color-navy)] py-2 text-center font-[family-name:var(--font-display)] font-bold text-[var(--color-paper)] transition-colors hover:bg-[var(--color-navy-ink)] lg:inline-flex ${isHome ? "rounded-sm px-4 text-sm xl:px-5 xl:text-base" : "px-4 text-sm"}`}
        >
          Analyze My Lease
        </Link>
      </div>
    </header>
  );
}
