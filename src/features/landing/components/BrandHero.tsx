import Image from "next/image";
import Link from "next/link";

import { sampleDocument, sampleReview } from "@/features/review/sample-report";
import { PRODUCT_MARK } from "@/shared/brand";

import styles from "./BrandHero.module.css";

const lateFee = sampleReview("renter").riskFlags.find(({ id }) => id === "lateFee");
const consequentialPhrase = "for each day";

function LateFeeQuote({ sentence }: { readonly sentence: string }) {
  const start = sentence.indexOf(consequentialPhrase);
  if (start < 0) return <q>{sentence}</q>;

  const end = start + consequentialPhrase.length;
  return (
    <q>
      {sentence.slice(0, start)}
      <mark>{sentence.slice(start, end)}</mark>
      {sentence.slice(end)}
    </q>
  );
}

function HeroSampleReport() {
  if (!lateFee) return null;

  return (
    <figure className={styles.report} aria-labelledby="hero-sample-caption">
      <figcaption id="hero-sample-caption" className={styles.reportCaption}>
        <Image src={PRODUCT_MARK} alt="" width={36} height={36} />
        <span>
          <strong>Sample report</strong>{" "}
          <span className={styles.reportSource}>
            {sampleDocument.title} · <span className="whitespace-nowrap">Section 2</span>
          </span>
        </span>
      </figcaption>
      <h2 className={styles.finding}>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="23" height="23" fill="currentColor">
          <path d="M3 3a1 1 0 0 1 1-1h1c3.6-1.4 6-.5 8 .5 2 1 4 1.7 7-.2v10c-3 1.9-5 1.2-7 .2-2-1-4.4-1.9-8-.5v9a1 1 0 1 1-2 0z" />
        </svg>
        {lateFee.title}
      </h2>
      <blockquote className={styles.quote}>
        <LateFeeQuote sentence={lateFee.sourceSentence} />
      </blockquote>
      <dl className={styles.reportDetails}>
        <div>
          <dt>Why it matters</dt>
          <dd>{lateFee.consequence}</dd>
        </div>
        <div>
          <dt>What to ask for</dt>
          <dd>{lateFee.nextStep}</dd>
        </div>
      </dl>
    </figure>
  );
}

export function BrandHero() {
  return (
    <section className={styles.hero} aria-labelledby="homepage-heading">
      <div className={styles.layout}>
        <div className={styles.copy}>
          <h1 id="homepage-heading">Understand your rental lease.</h1>
          <p className={styles.lead}>Spot risky terms and see the exact clause behind each flag.</p>
          <p className={styles.audience}>For renters and landlords.</p>
          <div className={styles.actions}>
            <Link href="/review" className={styles.primaryAction}>
              Review a lease <span aria-hidden="true">→</span>
            </Link>
            <a href="#sample-report" className={styles.secondaryAction}>
              See sample report
            </a>
          </div>
          <p className={styles.scope}>We don&apos;t check your lease against local law.</p>
        </div>
        <div className={styles.art} aria-hidden="true">
          <Image
            src="/images/homepage/spotter-entryway.webp"
            alt=""
            fill
            sizes="(min-width: 100rem) 1088px, (min-width: 70rem) 68vw, (min-width: 48rem) 55vw, 54vw"
            loading="eager"
            fetchPriority="high"
            className={styles.artImage}
          />
          {lateFee && (
            <svg
              className={styles.connector}
              viewBox="0 0 1536 960"
              preserveAspectRatio="xMinYMin slice"
              fill="none"
            >
              <path d="M762 518 1095 394" stroke="white" strokeWidth="7" />
              <path d="M762 518 1095 394" stroke="var(--color-navy-ink)" strokeWidth="3" />
              <circle cx="762" cy="518" r="8" fill="white" stroke="var(--color-navy-ink)" strokeWidth="2" />
            </svg>
          )}
        </div>
        <HeroSampleReport />
      </div>
    </section>
  );
}
