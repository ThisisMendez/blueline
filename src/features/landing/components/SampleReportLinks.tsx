import Image from "next/image";
import Link from "next/link";

import styles from "./SampleReportLinks.module.css";

const samples = [
  {
    href: "/sample-report/renter",
    title: "Renter sample",
    description: "Pick issues to raise and draft an email.",
    image: "/images/homepage/renter-apartments.webp",
  },
  {
    href: "/sample-report/landlord",
    title: "Landlord sample",
    description: "See what to clarify and edit suggested wording.",
    image: "/images/homepage/landlord-house.webp",
  },
] as const;

export function SampleReportLinks() {
  return (
    <section
      id="sample-report"
      tabIndex={-1}
      aria-labelledby="sample-report-heading"
      className="scroll-mt-6 border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-4 sm:p-5"
    >
      <h2 id="sample-report-heading" className="font-[family-name:var(--font-display)] text-xl font-bold">
        Sample reports
      </h2>
      <p className="mt-1 text-sm">See the same fictional lease from either side.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:gap-5">
        {samples.map(({ href, title, description, image }) => (
          <Link key={href} href={href} className={styles.photoCard}>
            <Image
              src={image}
              alt=""
              fill
              sizes="(min-width: 77rem) 540px, (min-width: 64rem) calc(50vw - 4.75rem), (min-width: 40rem) calc(50vw - 4.625rem), calc(100vw - 5.5rem)"
              className="-z-20 object-cover object-right"
            />
            <span className={styles.cardCopy}>
              <span className={styles.cardTitle}>
                {title}
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4 shrink-0" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3.5 10h12m-5-5 5 5-5 5" />
                </svg>
              </span>{" "}
              <span className="mt-1 block text-sm leading-snug">{description}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
