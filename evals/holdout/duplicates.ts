/**
 * Duplicate check for holdout candidates (decision 1, step 3).
 *
 * Two documents count as duplicates when their bytes match, or when most of
 * one's wording appears in the other after normalising case, punctuation,
 * quotes, ligatures and whitespace. Wording is compared as overlapping runs
 * of eight words ("shingles"); containment(a, b) is the share of a's runs
 * that also occur in b. Pure functions, so they can be tested without files.
 *
 * Thresholds (set before looking at the results):
 * - duplicate: identical SHA-256, or containment of 0.5 or more either way
 * - related: containment of 0.1 or more either way. Kept, but reported, so
 *   the owner can see when two documents share a template's wording.
 */
import { createHash } from "node:crypto";

export const SHINGLE_WORDS = 8;
export const DUPLICATE_AT = 0.5;
export const RELATED_AT = 0.1;

export function sha256(text: string | Buffer): string {
  return createHash("sha256").update(text).digest("hex");
}

export function normalise(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function shingles(text: string, size = SHINGLE_WORDS): Set<string> {
  const words = normalise(text).split(" ").filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + size <= words.length; i++) out.add(words.slice(i, i + size).join(" "));
  return out;
}

/** Share of a's shingles that also occur in b; 0 when a has none. */
export function containment(a: Set<string>, b: Set<string>): number {
  if (a.size === 0) return 0;
  let shared = 0;
  for (const item of a) if (b.has(item)) shared++;
  return shared / a.size;
}

export interface Comparison {
  readonly against: string;
  readonly sameText: boolean;
  /** Share of the candidate's wording found in the other document. */
  readonly candidateInOther: number;
  /** Share of the other document's wording found in the candidate. */
  readonly otherInCandidate: number;
  readonly verdict: "duplicate" | "related" | "distinct";
}

export function compare(candidate: string, otherId: string, other: string): Comparison {
  const a = shingles(candidate);
  const b = shingles(other);
  const sameText = sha256(candidate) === sha256(other);
  const candidateInOther = containment(a, b);
  const otherInCandidate = containment(b, a);
  const most = Math.max(candidateInOther, otherInCandidate);
  const verdict = sameText || most >= DUPLICATE_AT ? "duplicate" : most >= RELATED_AT ? "related" : "distinct";
  return { against: otherId, sameText, candidateInOther: round(candidateInOther), otherInCandidate: round(otherInCandidate), verdict };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
