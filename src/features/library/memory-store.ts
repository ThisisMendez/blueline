import {
  summarizeStoredReview,
  type ReviewStore,
  type StoredReview,
  type StoredReviewSummary,
  type NewReview,
  type ReviewRetention,
} from "./store";

/**
 * Test-only persistence adapter with a controllable clock. It exercises
 * application ownership and lifecycle behavior, not deployed SQL or RLS.
 * Production always uses Supabase; missing configuration never selects this.
 */
export class InMemoryReviewStore implements ReviewStore {
  private readonly reviews = new Map<string, StoredReview>();
  constructor(private readonly now: () => Date = () => new Date()) {}

  async save(review: NewReview): Promise<ReviewRetention> {
    if (this.reviews.has(review.id)) throw new Error("Review already exists.");
    const retention = { createdAt: review.createdAt, savedAt: null, expiresAt: new Date(Date.parse(review.createdAt) + 30 * 86_400_000).toISOString() };
    this.reviews.set(review.id, structuredClone({ ...review, ...retention }));
    return retention;
  }

  private purgeExpired(): void {
    for (const [id, review] of this.reviews) {
      if (Date.parse(review.expiresAt) <= this.now().getTime()) this.reviews.delete(id);
    }
  }

  async retainForSigner(signerId: string, reviewId: string): Promise<ReviewRetention | null> {
    this.purgeExpired();
    const found = this.reviews.get(reviewId);
    if (!found || found.signerId !== signerId) return null;
    const savedAt = this.now().toISOString();
    const retention = { createdAt: found.createdAt, savedAt, expiresAt: new Date(Date.parse(savedAt) + 90 * 86_400_000).toISOString() };
    this.reviews.set(reviewId, { ...found, ...retention });
    return retention;
  }

  async findForSigner(signerId: string, reviewId: string): Promise<StoredReview | null> {
    this.purgeExpired();
    const found = this.reviews.get(reviewId);
    if (!found || found.signerId !== signerId) return null;
    return structuredClone(found);
  }

  async listForSigner(signerId: string): Promise<readonly StoredReviewSummary[]> {
    this.purgeExpired();
    return [...this.reviews.values()]
      .filter((review) => review.signerId === signerId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map(summarizeStoredReview);
  }

  /** Test affordance: how many reviews are held, across all signers. */
  get size(): number {
    this.purgeExpired();
    return this.reviews.size;
  }
}
