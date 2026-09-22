import { describe, expect, it } from "vitest";
import { runGeneralReview } from "@/features/analysis/review";
import { loadFixture } from "~tests/fixtures/index";
import { createFixtureModelClient } from "~tests/support/fixture-model-client";
import { InMemoryReviewStore } from "./memory-store";

const DAY = 86_400_000;
const start = Date.parse("2027-01-01T09:00:00.000Z");
async function completedReview() {
  const documents = [{ id: "lease", title: "Synthetic lease", text: loadFixture("clean-lease").text }];
  return { id: "review-1", signerId: "a", createdAt: new Date(start).toISOString(), documents, review: await runGeneralReview({ packet: { documents }, model: createFixtureModelClient() }) };
}

describe("review retention with a controlled clock", () => {
  it("keeps an automatic review at day29 and deletes its record and text by day31", async () => {
    let time = start;
    const store = new InMemoryReviewStore(() => new Date(time));
    const retention = await store.save(await completedReview());
    expect(retention.expiresAt).toBe("2027-01-31T09:00:00.000Z");
    time = start + 29 * DAY;
    expect((await store.findForSigner("a", "review-1"))?.documents[0].text).toContain("RESIDENTIAL LEASE");
    time = start + 31 * DAY;
    expect(await store.findForSigner("a", "review-1")).toBeNull();
    expect(await store.listForSigner("a")).toEqual([]);
    expect(store.size).toBe(0);
  });
  it("sets ninety days from a later explicit save and cannot resurrect an expired review", async () => {
    let time = start;
    const store = new InMemoryReviewStore(() => new Date(time));
    await store.save(await completedReview());
    time = start + 12 * DAY;
    const saved = await store.retainForSigner("a", "review-1");
    expect(saved?.savedAt).toBe("2027-01-13T09:00:00.000Z");
    expect(saved?.expiresAt).toBe(new Date(time + 90 * DAY).toISOString());
    time = start + (12 + 89) * DAY;
    expect(await store.findForSigner("a", "review-1")).not.toBeNull();
    time = start + (12 + 91) * DAY;
    expect(await store.retainForSigner("a", "review-1")).toBeNull();
    expect(await store.findForSigner("a", "review-1")).toBeNull();
    expect(store.size).toBe(0);
  });
  it("rejects another owner, resets ninety days on each save, and expires at the exact boundary", async () => {
    let time = start;
    const store = new InMemoryReviewStore(() => new Date(time));
    await store.save(await completedReview());
    time += 10 * DAY;
    expect(await store.retainForSigner("b", "review-1")).toBeNull();
    expect((await store.findForSigner("a", "review-1"))?.savedAt).toBeNull();
    await store.retainForSigner("a", "review-1");
    time += 20 * DAY;
    const saved = await store.retainForSigner("a", "review-1");
    expect(saved?.expiresAt).toBe(new Date(time + 90 * DAY).toISOString());
    time += 90 * DAY - 1;
    expect(await store.findForSigner("a", "review-1")).not.toBeNull();
    time += 1;
    expect(await store.retainForSigner("a", "review-1")).toBeNull();
    expect(await store.listForSigner("a")).toEqual([]);
    expect(store.size).toBe(0);
  });
});
