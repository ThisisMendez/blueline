"use client";

import { useEffect, useRef } from "react";

import type { OutOfScopePacket, UnverifiedCompleteness } from "@/features/packet/completeness";

export interface StoppedPacketProps {
  readonly completeness: OutOfScopePacket | UnverifiedCompleteness;
}

/**
 * The packet was stopped before any review ran (ADR 0014): it isn't a
 * residential lease, the check couldn't tell, or whether the packet is
 * complete couldn't be verified. There is no summary and no flag here,
 * because the pipeline never ran. Same treatment as a blocked packet: navy,
 * never signal red, because nothing here is a risk finding.
 */
export function StoppedPacket({ completeness }: StoppedPacketProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);

  const bodyClass =
    "max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]";

  let label: string;
  let title: string;
  let body: React.ReactNode;

  if (completeness.kind === "unverified") {
    label = "Not reviewed";
    title = "We couldn't confirm your packet is complete";
    body = (
      <>
        <p className={bodyClass}>
          Your lease seems to point at other documents, but we couldn&apos;t
          match those mentions to its text. We haven&apos;t reviewed it,
          because a review of part of an agreement can miss what the rest
          says.
        </p>
        <p className={bodyClass}>
          Send it again. If this keeps happening, add any schedules, rules or
          addenda the lease mentions.
        </p>
      </>
    );
  } else if (completeness.agreementKind === "not-a-residential-lease") {
    const description = completeness.description.charAt(0).toLowerCase() + completeness.description.slice(1);
    label = "Not a residential lease";
    title = "This doesn't look like a residential lease";
    body = (
      <>
        <p className={bodyClass}>
          Blueline Redline only reviews residential leases and the documents
          they point at, so we stopped before reviewing anything. It reads
          like {description.replace(/\.$/, "")}.
        </p>
        {completeness.evidence ? (
          <figure>
            <figcaption className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-navy)]">
              From your document
            </figcaption>
            <blockquote className="mt-2 border-l-2 border-[var(--color-navy)] pl-4 font-[family-name:var(--font-body)] text-base italic text-[var(--color-navy-ink)]">
              {completeness.evidence.sentence}
            </blockquote>
          </figure>
        ) : null}
        <p className={bodyClass}>
          If this is a lease for a home, check that you pasted the lease
          itself and send it again.
        </p>
      </>
    );
  } else {
    label = "Not reviewed";
    title = "We couldn't tell whether this is a residential lease";
    body = (
      <p className={bodyClass}>
        Blueline Redline only reviews residential leases, so we stopped
        instead of guessing. If it is one, paste the whole lease from its
        first page and send it again.
      </p>
    );
  }

  return (
    <section
      aria-labelledby="stopped-packet-heading"
      className="border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)]"
    >
      <p className="bg-[var(--color-navy)] px-6 py-3 font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-paper)] sm:px-8">
        {label}
      </p>
      <div className="flex flex-col gap-4 p-6 sm:p-8">
        <h2
          id="stopped-packet-heading"
          ref={heading}
          tabIndex={-1}
          className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-3xl"
        >
          {title}
        </h2>
        {body}
      </div>
    </section>
  );
}
