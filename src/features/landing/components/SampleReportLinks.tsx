import Image from "next/image";
import Link from "next/link";

import { sampleDocument, sampleReview } from "@/features/review/sample-report";

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

const renterFlag = sampleReview("renter").riskFlags.find((flag) => flag.id === "earlyExit");
const consequentialPhrase = "even if a new renter has started paying rent for the same apartment";

function EarlyExitQuote({ sentence }: { readonly sentence: string }) {
  const start = sentence.indexOf(consequentialPhrase);
  const end = start + consequentialPhrase.length;

  return (
    <blockquote className="mt-2 border-l-2 border-[var(--color-navy)] pl-3 leading-relaxed">
      {start < 0 ? sentence : (
        <>
          {sentence.slice(0, start)}
          <mark className="cited-mark text-[var(--color-navy-ink)]">{sentence.slice(start, end)}</mark>
          {sentence.slice(end)}
        </>
      )}
    </blockquote>
  );
}

export function SampleReportLinks() {
  return (
    <section
      id="sample-report"
      tabIndex={-1}
      aria-labelledby="sample-report-heading"
      className="scroll-mt-6 border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-4 sm:p-5"
    >
      <h3 id="sample-report-heading" className="font-[family-name:var(--font-display)] text-xl font-bold">
        Sample reports
      </h3>
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
      {renterFlag && (
        <figure
          aria-labelledby="sample-report-excerpt"
          className="mt-5 grid items-end gap-x-4 border-2 border-[var(--color-navy)] bg-[var(--color-paper)] md:grid-cols-[minmax(0,1fr)_clamp(7rem,14vw,10rem)]"
        >
          <figcaption id="sample-report-excerpt" className="col-span-full mx-4 mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[var(--color-navy)]/25 pb-2 sm:mx-5 sm:mt-5">
            <span className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-navy)]">
              {samples[0].title}
            </span>{" "}
            <span className="text-sm text-[var(--color-navy-ink)]">{sampleDocument.title}</span>
          </figcaption>
          <div className="min-w-0 px-4 pt-3 pb-4 [overflow-wrap:anywhere] sm:px-5 sm:pb-5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <span className={`px-1.5 py-0.5 font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide ${renterFlag.severity === "high" ? "bg-[var(--color-red-ink)] text-[var(--color-paper)]" : "border border-[var(--color-navy)] text-[var(--color-navy)]"}`}>
                Severity: {renterFlag.severity.charAt(0).toUpperCase() + renterFlag.severity.slice(1)}
              </span>
              <h4 className="font-[family-name:var(--font-display)] text-lg font-bold leading-tight">
                {renterFlag.title}
              </h4>
            </div>
            <EarlyExitQuote sentence={renterFlag.sourceSentence} />
            <p className="mt-2 text-sm leading-relaxed">{renterFlag.consequence}</p>
          </div>
          <div className="relative hidden aspect-square md:block">
            <Image
              src="/images/homepage/spotter-peek.webp"
              alt=""
              fill
              sizes="(min-width: 48rem) clamp(7rem, 14vw, 10rem), 1px"
              className="object-contain object-right-bottom"
            />
          </div>
        </figure>
      )}
    </section>
  );
}
