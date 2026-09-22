import type {
  CompleteAgreement,
  IncompleteAgreement,
} from "@/features/packet/completeness";
import type { ExtractedDocument } from "@/features/packet/types";
import type { ReviewRetention } from "@/features/library/store";

import type { ChecklistTopicId } from "./checklist";

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
  /** A proposed compromise that reduces this flag's concrete downside. */
  readonly counterOffer: string;
  /** What could still happen if the proposed edit were accepted. */
  readonly residualRisk: string;
  /** Cut from the extracted text at the offsets below. */
  readonly sourceSentence: string;
  readonly sourceDocumentId: string;
  readonly sourceStart: number;
  readonly sourceEnd: number;
}

/**
 * A published checklist topic the agreement addresses, with the sentence
 * that addresses it.
 *
 * Verified exactly as a risk flag is (ADR 0001): `sourceSentence` is the
 * slice of the document's extracted text at `[sourceStart, sourceEnd)`. A
 * found topic whose citation still cannot be verified after retry fails the
 * review, rather than becoming an unsupported absence claim.
 *
 * It is not a risk flag: being addressed is not a downside, so there is no
 * severity here and nothing on this type ever joins the ranked flag list.
 */
export interface FoundTopic {
  readonly status: "found";
  readonly topicId: ChecklistTopicId;
  /** Cut from the extracted text at the offsets below. */
  readonly sourceSentence: string;
  readonly sourceDocumentId: string;
  readonly sourceStart: number;
  readonly sourceEnd: number;
}

/**
 * A published checklist topic that was not located in the complete
 * agreement (ADR 0007).
 *
 * An absence has no sentence, which is why it cannot be a risk flag — and
 * why this type has nowhere to put one. The `never` fields below are not
 * decoration: they make `item.sourceSentence = "..."` a compiler error, so
 * a quotation cannot be attached to an absence by accident or by a later
 * refactor. There is no severity either: a not-found item is information,
 * not a ranked warning.
 */
export interface NotFoundItem {
  readonly status: "not-found";
  readonly topicId: ChecklistTopicId;
  readonly sourceSentence?: never;
  readonly sourceDocumentId?: never;
  readonly sourceStart?: never;
  readonly sourceEnd?: never;
  readonly severity?: never;
}

/** One line of the published checklist, in one state or the other. */
export type CoverageItem = FoundTopic | NotFoundItem;

/**
 * The published checklist as this agreement answers it: all six topics, in
 * published order, whether they were found or not. The signer reads the
 * whole list, not only what was missing.
 */
export interface CoverageChecklist {
  readonly items: readonly CoverageItem[];
}

/** The not-found items, in published order. Their own result category. */
export function notFoundItems(
  checklist: CoverageChecklist,
): readonly NotFoundItem[] {
  return checklist.items.filter(
    (item): item is NotFoundItem => item.status === "not-found",
  );
}

/** The topics the agreement addresses, in published order. */
export function foundTopics(checklist: CoverageChecklist): readonly FoundTopic[] {
  return checklist.items.filter((item): item is FoundTopic => item.status === "found");
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
 * preference matches (06), counter-offers on each flag (07). They are
 * separate fields by design and are never folded into this list, exactly as
 * `coverage` is not.
 */
export interface GeneralReview {
  /** Plain-English, neutral. No verdict. */
  readonly summary: string;
  /** Verified flags, ranked high severity first. */
  readonly riskFlags: readonly RiskFlag[];
  /** The published checklist, answered for all six topics. Not flags. */
  readonly coverage: CoverageChecklist;
  /**
   * True when nothing material survived verification. Read off the risk
   * flags alone: a not-found item is not a warning, so an agreement can be
   * silent on a checklist topic and still be a clean review.
   */
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
  | "model-verification-failed"
  | "model-unreadable";

/**
 * What the analysis route answers with.
 *
 * `reviewed` and `blocked` are separate members on purpose (ADR 0005). A
 * blocked packet is not a review with its fields left empty: it has no
 * `review` at all, and the optional `never` fields below make that a
 * compiler error rather than a convention. Code that wants a summary has to
 * narrow to `reviewed` first, and the route only reaches `reviewed` by
 * running the pipeline on a complete agreement.
 */
export type AnalysisOutcome =
  | {
      readonly status: "reviewed";
      /** Present when the review was persisted for a signed-in signer. */
      readonly reviewId: string | null;
      readonly persisted: boolean;
      readonly retention: ReviewRetention | null;
      readonly persistenceFailed: boolean;
      readonly documents: readonly ExtractedDocument[];
      /** Every reference answered by a supplied document. */
      readonly completeness: CompleteAgreement;
      readonly review: GeneralReview;
    }
  | {
      readonly status: "blocked";
      readonly documents: readonly ExtractedDocument[];
      /** What is missing, and the sentence in the agreement that names it. */
      readonly completeness: IncompleteAgreement;
      readonly review?: never;
      readonly summary?: never;
      readonly riskFlags?: never;
      readonly clean?: never;
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
