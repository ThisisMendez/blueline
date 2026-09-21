"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Adds `specimen-in-view` once the wrapped content crosses into the
 * viewport, so leader lines draw on and badges settle a single time.
 * Renders already-in-view when the browser has no IntersectionObserver
 * or the visitor asked for reduced motion.
 */
export function InView({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
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
      { threshold: 0.35 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${className ?? ""} ${inView ? "specimen-in-view" : ""}`}>
      {children}
    </div>
  );
}
