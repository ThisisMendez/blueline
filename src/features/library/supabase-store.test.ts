import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { runGeneralReview } from "@/features/analysis/review";
import { loadFixture } from "~tests/fixtures/index";
import { createFixtureModelClient } from "~tests/support/fixture-model-client";
import { SupabaseReviewStore } from "./supabase-store";

async function databaseRows(fixtureId: "clean-lease" | "adhesion-lease" = "clean-lease") {
  const { text } = loadFixture(fixtureId);
  const review = await runGeneralReview({
    packet: { documents: [{ id: "lease", title: "Lease", text }] },
    model: createFixtureModelClient(),
  });
  return {
    reviews: { id: "review", user_id: "signer", created_at: "2027-01-01T00:00:00Z", saved_at: null, expires_at: "2027-01-31T00:00:00Z", summary: review.summary, clean: review.clean, dropped_flag_count: 0 },
    review_documents: [{ document_id: "lease", title: "Lease", extracted_text: text, position: 0 }],
    review_flags: review.riskFlags.map((flag) => ({ severity: flag.severity, consequence: flag.consequence, triggering_condition: flag.triggeringCondition, source_document_id: flag.sourceDocumentId, source_start: flag.sourceStart, source_end: flag.sourceEnd, counter_offer: flag.counterOffer, residual_risk: flag.residualRisk })) as Record<string, unknown>[],
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
  it("disambiguates library joins through the composite ownership relationships", async () => {
    let selection = "";
    const query = { select(value: string) { selection = value; return query; }, eq() { return query; }, async order() { return { data: [], error: null }; } };
    const client = { from() { return query; } } as unknown as SupabaseClient;
    expect(await new SupabaseReviewStore(client).listForSigner("signer")).toEqual([]);
    expect(selection).toContain("review_documents!review_documents_owner_fk(title, position)");
    expect(selection).toContain("review_flags!review_flags_owner_fk(rank)");
  });

  it("returns the database save clock, including expired/missing and failure responses", async () => {
    const calls: unknown[] = [];
    let data: unknown = { created_at: "2027-01-01T00:00:00Z", saved_at: "2027-01-12T00:00:00Z", expires_at: "2027-04-12T00:00:00Z" };
    let error: unknown = null;
    const client = { async rpc(name: string, args: unknown) { calls.push({ name, args }); return { data, error }; } } as unknown as SupabaseClient;
    const store = new SupabaseReviewStore(client);
    expect(await store.retainForSigner("signer", "review")).toEqual({ createdAt: "2027-01-01T00:00:00Z", savedAt: "2027-01-12T00:00:00Z", expiresAt: "2027-04-12T00:00:00Z" });
    expect(calls[0]).toEqual({ name: "retain_review", args: { p_signer_id: "signer", p_review_id: "review" } });
    data = null;
    expect(await store.retainForSigner("signer", "review")).toBeNull();
    error = { message: "Database unavailable" };
    await expect(store.retainForSigner("signer", "review")).rejects.toThrow();
  });
  it("returns database timestamps from an atomic save without sending caller lifecycle fields", async () => {
    const calls: Record<string, unknown>[] = [];
    const client = { async rpc(name: string, args: Record<string, unknown>) {
      calls.push({ name, ...args });
      return { data: { created_at: "2027-02-01T00:00:00Z", saved_at: null, expires_at: "2027-03-03T00:00:00Z" }, error: null };
    } } as unknown as SupabaseClient;
    const documents = [{ id: "lease", title: "Lease", text: loadFixture("adhesion-lease").text }];
    const review = await runGeneralReview({ packet: { documents }, model: createFixtureModelClient() });
    const retention = await new SupabaseReviewStore(client).save({ id: "review", signerId: "signer", createdAt: "2099-01-01T00:00:00Z", documents, review });
    expect(retention).toEqual({ createdAt: "2027-02-01T00:00:00Z", savedAt: null, expiresAt: "2027-03-03T00:00:00Z" });
    expect(calls).toHaveLength(1);
    expect(calls[0].name).toBe("create_review");
    expect(JSON.stringify(calls[0])).not.toContain("2099");
    expect(calls[0].p_review).toMatchObject({ documents: [{ extracted_text: documents[0].text }], flags: expect.any(Array), topics: expect.any(Array) });
  });

  it("propagates failed atomic saves and does not fabricate successful retention", async () => {
    const client = { async rpc() { return { data: null, error: { message: "Transaction failed" } }; } } as unknown as SupabaseClient;
    const documents = [{ id: "lease", title: "Lease", text: loadFixture("clean-lease").text }];
    const review = await runGeneralReview({ packet: { documents }, model: createFixtureModelClient() });
    await expect(new SupabaseReviewStore(client).save({ id: "review", signerId: "signer", createdAt: "2027-01-01T00:00:00Z", documents, review })).rejects.toThrow("could not be stored");
  });
  it("reads each stored proposed edit together with its residual risk", async () => {
    const rows = await databaseRows("adhesion-lease");
    const stored = await storeFor(rows).findForSigner("signer", "review");
    const expected = loadFixture("adhesion-lease").sidecar.plantedFlags;
    for (const flag of stored!.review.riskFlags) {
      const fixture = expected.find((candidate) => candidate.sourceSentence === flag.sourceSentence)!;
      expect(flag.counterOffer).toBe(fixture.counterOffer);
      expect(flag.residualRisk).toBe(fixture.residualRisk);
    }
  });
  it("requires a new analysis for legacy flags rather than inventing a proposed edit", async () => {
    const rows = await databaseRows("adhesion-lease");
    rows.review_flags[0].counter_offer = null;
    rows.review_flags[0].residual_risk = null;
    await expect(storeFor(rows).findForSigner("signer", "review")).rejects.toThrow("needs a new analysis");
  });
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
