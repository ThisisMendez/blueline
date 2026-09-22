import {
  summarizeStoredReview,
  type ReviewStore,
  type StoredReview,
  type StoredReviewSummary,
} from "./store";

/**
 * A real implementation of the persistence port that keeps reviews in memory.
 *
 * It is not a mock: it enforces the same ownership rule the database does, so
 * a test that asks it for another signer's review gets the same answer the
 * row-level security policies give. Used by the test suite, and by later
 * tickets that need persistence without a Supabase project.
 */
export class InMemoryReviewStore implements ReviewStore {
  private readonly reviews = new Map<string, StoredReview>();

  async save(review: StoredReview): Promise<void> {
    this.reviews.set(review.id, structuredClone(review));
  }

  async findForSigner(signerId: string, reviewId: string): Promise<StoredReview | null> {
    const found = this.reviews.get(reviewId);
    if (!found || found.signerId !== signerId) return null;
    return structuredClone(found);
  }

  async listForSigner(signerId: string): Promise<readonly StoredReviewSummary[]> {
    return [...this.reviews.values()]
      .filter((review) => review.signerId === signerId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map(summarizeStoredReview);
  }

  /** Test affordance: how many reviews are held, across all signers. */
  get size(): number {
    return this.reviews.size;
  }
}
