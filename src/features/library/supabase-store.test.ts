import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { runGeneralReview } from "@/features/analysis/review";
import { loadFixture } from "~tests/fixtures/index";
import { createFixtureModelClient } from "~tests/support/fixture-model-client";
import { SupabaseReviewStore } from "./supabase-store";

async function databaseRows() {
  const { text } = loadFixture("clean-lease");
  const review = await runGeneralReview({
    packet: { documents: [{ id: "lease", title: "Lease", text }] },
    model: createFixtureModelClient(),
  });
  return {
    reviews: { id: "review", user_id: "signer", created_at: "2027-01-01", summary: review.summary, clean: true, dropped_flag_count: 0 },
    review_documents: [{ document_id: "lease", title: "Lease", extracted_text: text, position: 0 }],
    review_flags: [] as Record<string, unknown>[],
    review_checklist_topics: review.coverage.items.map((item) => ({
      topic_id: item.topicId, status: item.status,
      source_document_id: item.status === "found" ? item.sourceDocumentId : null,
      source_start: item.status === "found" ? item.sourceStart : null,
      source_end: item.status === "found" ? item.sourceEnd : null,
    })),
  };
}

function storeFor(rows: Awaited<ReturnType<typeof databaseRows>>) {
  // Substitute only the external database client's query result boundary.
  const client = {
    from(table: keyof typeof rows) {
      const result = { data: rows[table], error: null };
      const query = {
        select: () => query, eq: () => query, order: () => Promise.resolve(result),
        maybeSingle: () => Promise.resolve(result),
      };
      return query;
    },
  } as unknown as SupabaseClient;
  return new SupabaseReviewStore(client);
}

describe("stored review citation integrity", () => {
  it("reconstructs all checklist sentences from stored extracted text", async () => {
    const rows = await databaseRows();
    const stored = await storeFor(rows).findForSigner("signer", "review");
    expect(stored?.review.coverage.items).toHaveLength(6);
    expect(stored?.review.clean).toBe(true);
    for (const item of stored!.review.coverage.items) {
      if (item.status === "found") expect(rows.review_documents[0].extracted_text).toContain(item.sourceSentence);
    }
  });

  it.each(["missing-topic", "missing-text", "bad-offset", "missing-risk-text"])("refuses a stored review with %s", async (failure) => {
    const rows = await databaseRows();
    if (failure === "missing-topic") rows.review_checklist_topics.pop();
    if (failure === "missing-text") rows.review_documents = [];
    if (failure === "bad-offset") rows.review_checklist_topics[0].source_end = 999999;
    if (failure === "missing-risk-text") rows.review_flags.push({
      severity: "high", consequence: "Cost", triggering_condition: "On exit",
      source_document_id: "missing", source_start: 0, source_end: 5,
    });
    await expect(storeFor(rows).findForSigner("signer", "review")).rejects.toThrow();
  });
});
