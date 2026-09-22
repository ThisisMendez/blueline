import type { GeneralReview } from "@/features/analysis/types";
import type { ExtractedDocument } from "@/features/packet/types";

export class ReviewNeedsRerunError extends Error {
  constructor() {
    super("This review needs a new analysis to include proposed edits and remaining risks.");
    this.name = "ReviewNeedsRerunError";
  }
}

/**
 * The persistence port. Everything a review needs to be read back later, and
 * nothing that could hold an original file: a stored review is extracted text
 * plus the analysis of it.
 */

export interface StoredReview {
  readonly id: string;
  /** The authenticated signer the review belongs to. */
  readonly signerId: string;
  /** ISO 8601, from the injected clock. */
  readonly createdAt: string;
  /** Extracted text only. There is nowhere here to put bytes. */
  readonly documents: readonly ExtractedDocument[];
  readonly review: GeneralReview;
}

/** One line in the signer's library. */
export interface StoredReviewSummary {
  readonly id: string;
  readonly createdAt: string;
  /** The first document's title, which is what the signer recognises. */
  readonly title: string;
  readonly flagCount: number;
  readonly clean: boolean;
}

export interface ReviewStore {
  save(review: StoredReview): Promise<void>;
  /**
   * Reads one review, scoped to its owner. Another signer's id returns null —
   * the store never answers with a review it was not asked for by its owner.
   */
  findForSigner(signerId: string, reviewId: string): Promise<StoredReview | null>;
  listForSigner(signerId: string): Promise<readonly StoredReviewSummary[]>;
}

/** Builds the library line for a stored review. */
export function summarizeStoredReview(review: StoredReview): StoredReviewSummary {
  return {
    id: review.id,
    createdAt: review.createdAt,
    title: review.documents[0]?.title ?? "Untitled review",
    flagCount: review.review.riskFlags.length,
    clean: review.review.clean,
  };
}
