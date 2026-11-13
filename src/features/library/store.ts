import type { GeneralReview, ReviewRole } from "@/features/analysis/types";
import type { ExtractedDocument } from "@/features/packet/types";
import { generateReviewTitle } from "@/features/review/title";

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

export interface NewReview {
  readonly id: string;
  /** The authenticated signer the review belongs to. */
  readonly signerId: string;
  /** Completion time for the test adapter; Supabase ignores this and uses its database clock. */
  readonly createdAt: string;
  /** Extracted text only. There is nowhere here to put bytes. */
  readonly documents: readonly ExtractedDocument[];
  readonly review: GeneralReview;
  /**
   * The review's display title. When absent, the store derives one from the
   * lease with `generateReviewTitle`, so every new review is stored with one.
   */
  readonly title?: string;
}

export interface ReviewRetention {
  readonly createdAt: string;
  readonly savedAt: string | null;
  readonly expiresAt: string;
}

export interface StoredReview extends NewReview, ReviewRetention {
  /** The signer's name for it, else the generated title, else the lease's document title. */
  readonly title: string;
}

/** One line in the signer's library. */
export interface StoredReviewSummary extends ReviewRetention {
  readonly id: string;
  readonly createdAt: string;
  /**
   * The display title: the signer's own name for it or the one generated at
   * creation. Reviews saved before titles existed fall back to the first
   * document's title.
   */
  readonly title: string;
  readonly flagCount: number;
  readonly clean: boolean;
  readonly role?: ReviewRole;
}

export interface ReviewStore {
  save(review: NewReview): Promise<ReviewRetention>;
  /** Extends only an owned, unexpired review; null means absent or expired. */
  retainForSigner(signerId: string, reviewId: string): Promise<ReviewRetention | null>;
  /**
   * Reads one review, scoped to its owner. Another signer's id returns null —
   * the store never answers with a review it was not asked for by its owner.
   */
  findForSigner(signerId: string, reviewId: string): Promise<StoredReview | null>;
  listForSigner(signerId: string): Promise<readonly StoredReviewSummary[]>;
  /**
   * Gives one owned, unexpired review a new display title. The title must
   * already be normalised (`normaliseTypedTitle`). Returns the stored title,
   * or null when the review is absent, expired or another signer's — the
   * same answer for all three, so ownership can't be probed.
   */
  renameForSigner(signerId: string, reviewId: string, title: string): Promise<string | null>;
}

/** The title a legacy review shows: its lease's document title. */
export function legacyReviewTitle(documents: readonly { readonly title: string }[]): string {
  return documents[0]?.title ?? "Untitled review";
}

/** The title a new review is stored with. */
export function titleForNewReview(review: NewReview): string {
  const lease = review.documents[0];
  return review.title ?? generateReviewTitle({ text: lease?.text ?? "", fileName: lease?.title });
}

/** Builds the library line for a stored review. */
export function summarizeStoredReview(review: StoredReview): StoredReviewSummary {
  return {
    id: review.id,
    createdAt: review.createdAt,
    savedAt: review.savedAt,
    expiresAt: review.expiresAt,
    title: review.title,
    flagCount: review.review.riskFlags.length,
    clean: review.review.clean,
    role: review.review.role,
  };
}
