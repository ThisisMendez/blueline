import type { ExtractedDocument } from "@/features/packet/types";

/** The product's fixed severity vocabulary, ranked high first. */
export type Severity = "high" | "medium" | "low";

/** Severity order, high first. Lower number sorts earlier. */
export const SEVERITY_RANK: Readonly<Record<Severity, number>> = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * A cited lease term with a plausible, material downside for the signer.
 *
 * `sourceSentence` is the slice taken from the document's extracted text at
 * `[sourceStart, sourceEnd)` — never the model's echo of it. A flag cannot
 * exist without those offsets, which is what makes the citation checkable.
 */
export interface RiskFlag {
  /** Derived from the citation, so the same sentence always gets the same id. */
  readonly id: string;
  readonly severity: Severity;
  /** What the signer concretely stands to lose or face. */
  readonly consequence: string;
  /** What would have to happen for the consequence to matter. */
  readonly triggeringCondition: string;
  /** Cut from the extracted text at the offsets below. */
  readonly sourceSentence: string;
  readonly sourceDocumentId: string;
  readonly sourceStart: number;
  readonly sourceEnd: number;
}

/**
 * The exact words a clean review reports. ADR 0004 fixes this wording: a
 * review with no material flags says what was and was not found, and says
 * nothing about whether the lease is safe to sign.
 */
export const CLEAN_REVIEW_STATEMENT = "No material flags found in the text reviewed";

/**
 * The first review of a complete agreement, before personal red lines.
 *
 * Later tickets add their own result categories beside `riskFlags` —
 * not-found items (04), preference matches (06), counter-offers on each flag
 * (07). They are separate fields by design and are never folded into this
 * list.
 */
export interface GeneralReview {
  /** Plain-English, neutral. No verdict. */
  readonly summary: string;
  /** Verified flags, ranked high severity first. */
  readonly riskFlags: readonly RiskFlag[];
  /** True when nothing material survived verification. */
  readonly clean: boolean;
  /** The clean-review wording, present only on a clean review. */
  readonly cleanStatement: string | null;
  /** Flags the model produced whose quotation never matched, after one retry. */
  readonly droppedFlagCount: number;
}

/** Why the request never reached the model. */
export type AnalysisRejection =
  | "malformed-request"
  | "empty-text"
  | "not-signed-in";

/** Why the model call could not produce a review. */
export type AnalysisFailure =
  | "model-not-configured"
  | "model-timeout"
  | "model-rate-limited"
  | "model-unavailable"
  | "model-unreadable";

/** What the analysis route answers with. */
export type AnalysisOutcome =
  | {
      readonly status: "reviewed";
      /** Present when the review was persisted for a signed-in signer. */
      readonly reviewId: string | null;
      readonly persisted: boolean;
      readonly documents: readonly ExtractedDocument[];
      readonly review: GeneralReview;
    }
  | { readonly status: "rejected"; readonly reason: AnalysisRejection }
  | { readonly status: "failed"; readonly reason: AnalysisFailure };

/** Ranks flags high severity first, then by where they sit in the document. */
export function rankFlags(flags: readonly RiskFlag[]): RiskFlag[] {
  return [...flags].sort((left, right) => {
    const bySeverity = SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity];
    if (bySeverity !== 0) return bySeverity;
    if (left.sourceDocumentId !== right.sourceDocumentId) {
      return left.sourceDocumentId < right.sourceDocumentId ? -1 : 1;
    }
    return left.sourceStart - right.sourceStart;
  });
}
