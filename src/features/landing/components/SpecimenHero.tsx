"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };

function pathBetween(a: Point, b: Point): string {
  const midX = a.x + (b.x - a.x) * 0.55;
  return `M ${a.x} ${a.y} C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`;
}

/**
 * The landing page's first viewport: one lease clause rendered as a
 * field-guide specimen card, leader lines measured (not guessed) from
 * the cited phrases to their margin labels, drawing on the moment the
 * card enters view. Demo content — labeled as such in the source note.
 */
export function SpecimenHero() {
  const cardRef = useRef<HTMLDivElement>(null);
  const mark1Ref = useRef<HTMLElement>(null);
  const mark2Ref = useRef<HTMLElement>(null);
  const label1Ref = useRef<HTMLDivElement>(null);
  const label2Ref = useRef<HTMLDivElement>(null);
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [inView, setInView] = useState(false);
  const [showLines, setShowLines] = useState(false);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setShowLines(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!showLines) return;

    function measure() {
      const card = cardRef.current;
      const svg = svgRef.current;
      if (!card || !svg) return;
      const cardBox = card.getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${cardBox.width} ${cardBox.height}`);

      const pairs: Array<
        [React.RefObject<HTMLElement | null>, React.RefObject<HTMLDivElement | null>, React.RefObject<SVGPathElement | null>]
      > = [
        [mark1Ref, label1Ref, path1Ref],
        [mark2Ref, label2Ref, path2Ref],
      ];

      for (const [markRef, labelRef, pathRef] of pairs) {
        const mark = markRef.current;
        const label = labelRef.current;
        const path = pathRef.current;
        if (!mark || !label || !path) continue;
        const markBox = mark.getBoundingClientRect();
        const labelBox = label.getBoundingClientRect();
        const from: Point = {
          x: markBox.right - cardBox.left,
          y: markBox.top + markBox.height / 2 - cardBox.top,
        };
        const to: Point = {
          x: labelBox.left - cardBox.left,
          y: labelBox.top + 14 - cardBox.top,
        };
        path.setAttribute("d", pathBetween(from, to));
        const length = path.getTotalLength();
        path.style.setProperty("--path-length", String(length));
      }
    }

    measure();
    const ro = new ResizeObserver(measure);
    if (cardRef.current) ro.observe(cardRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [showLines]);

  return (
    <div
      ref={cardRef}
      className={`relative border-2 border-[var(--color-navy)] bg-[var(--color-paper)] shadow-[0_28px_54px_-24px_rgba(18,59,93,0.5),0_10px_22px_-14px_rgba(18,59,93,0.35)] ${
        inView ? "specimen-in-view" : ""
      }`}
    >
      {showLines && (
        <svg
          ref={svgRef}
          className="pointer-events-none absolute inset-0 hidden md:block"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            ref={path1Ref}
            className="leader-path"
            fill="none"
            stroke="var(--color-red)"
            strokeWidth={1.5}
          />
          <path
            ref={path2Ref}
            className="leader-path"
            fill="none"
            stroke="var(--color-red)"
            strokeWidth={1.5}
          />
        </svg>
      )}

      <div className="grid gap-x-10 gap-y-8 p-6 sm:p-10 md:grid-cols-[1.6fr_1fr] md:p-12">
        <div>
          <p className="font-[family-name:var(--font-data)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-navy)]">
            Specimen — Early Termination Clause
          </p>

          <p className="mt-5 font-[family-name:var(--font-body)] text-xl leading-relaxed text-[var(--color-navy-ink)] sm:text-2xl">
            &ldquo;Tenant shall be liable for{" "}
            <mark
              ref={mark1Ref}
              tabIndex={0}
              aria-describedby="specimen-note-1"
              className="cited-mark"
            >
              the full remaining balance of rent due under this Lease
            </mark>{" "}
            if Tenant vacates prior to the expiration date,{" "}
            <mark
              ref={mark2Ref}
              tabIndex={0}
              aria-describedby="specimen-note-2"
              className="cited-mark"
            >
              regardless of whether Landlord re-rents the unit
            </mark>
            .&rdquo;
          </p>

          <p className="mt-5 font-[family-name:var(--font-data)] text-xs text-[var(--color-navy)]">
            Source: sample lease, Section 8(c) — demonstration text, not a real
            agreement.
          </p>
        </div>

        <div className="flex flex-col gap-6 md:pt-9">
          <div id="specimen-note-1" ref={label1Ref} className="badge-in">
            <span className="inline-block bg-[var(--color-red-ink)] px-2 py-1 font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-paper)]">
              Severity: High
            </span>
            <p className="mt-2 font-[family-name:var(--font-body)] text-sm leading-snug text-[var(--color-navy-ink)]">
              You could owe rent for months you don&apos;t live there. By this
              clause, a new tenant moving in doesn&apos;t reduce what you owe.
            </p>
          </div>

          <div id="specimen-note-2" ref={label2Ref} className="badge-in">
            <span className="inline-block border-2 border-[var(--color-navy)] px-2 py-1 font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-navy)]">
              Matters if
            </span>
            <p className="mt-2 font-[family-name:var(--font-body)] text-sm leading-snug text-[var(--color-navy-ink)]">
              Your situation could change before the lease ends: a job move, a
              health issue, a roommate falling through.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] px-6 py-6 sm:px-10 sm:py-7 md:flex-row md:items-center md:justify-between md:px-12">
        <p className="font-[family-name:var(--font-data)] text-xs uppercase tracking-wide text-[var(--color-navy)]">
          Specimen 1 of 1. Yours is next.
        </p>
        <Link
          href="/sign-in"
          className="inline-flex items-center justify-center bg-[var(--color-navy)] px-6 py-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-paper)] transition-colors hover:bg-[var(--color-navy-ink)]"
        >
          Sign in and try it on your lease
        </Link>
      </div>
    </div>
  );
}
