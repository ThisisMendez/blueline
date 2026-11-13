import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { runGeneralReview } from "@/features/analysis/review";
import type { AccountsState } from "@/features/auth/session";
import { loadFixture } from "~tests/fixtures/index";
import { createFixtureModelClient } from "~tests/support/fixture-model-client";

import { InMemoryReviewStore } from "./memory-store";
import { createRenameRoute } from "./rename-route";
import { SupabaseReviewStore } from "./supabase-store";

function request(body: unknown) {
  return new Request("http://localhost/api/library/rename", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function setup() {
  const store = new InMemoryReviewStore(() => new Date("2027-01-13T09:00:00Z"));
  const text = loadFixture("clean-lease").text;
  const documents = [{ id: "pasted-lease", title: "Residential Lease Agreement", text }];
  const review = await runGeneralReview({ role: "renter", packet: { documents }, model: createFixtureModelClient() });
  await store.save({ id: "review-a", signerId: "a", createdAt: "2027-01-01T09:00:00Z", documents, review });
  let accounts: AccountsState = { kind: "signed-in", signer: { id: "a", email: "a@example.test" } };
  const route = createRenameRoute({ accounts: async () => accounts, store: async () => store });
  return { store, route, setAccounts(value: AccountsState) { accounts = value; } };
}

describe("renaming a saved review", () => {
  it("renames the signer's own review, trimmed, and the name is there on the next read", async () => {
    const { store, route } = await setup();
    expect((await store.listForSigner("a"))[0].title).toBe("Residential Lease Agreement");

    const response = await route(request({ reviewId: "review-a", title: "   Spring   lease  " }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "renamed", title: "Spring lease" });

    // A reload reads the store again.
    expect((await store.listForSigner("a"))[0].title).toBe("Spring lease");
    expect((await store.findForSigner("a", "review-a"))?.title).toBe("Spring lease");
  });

  it("refuses another signer's review and doesn't reveal that it exists", async () => {
    const { store, route, setAccounts } = await setup();
    setAccounts({ kind: "signed-in", signer: { id: "b", email: "b@example.test" } });
    const response = await route(request({ reviewId: "review-a", title: "Mine now" }));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ status: "failed", reason: "not-found" });
    expect((await store.findForSigner("a", "review-a"))?.title).toBe("Residential Lease Agreement");
  });

  it.each([
    [{ reviewId: "review-a", title: "   " }, 400, "invalid-title"],
    [{ reviewId: "review-a", title: "x".repeat(81) }, 400, "invalid-title"],
    [{ reviewId: "review-a", title: "Fine", signerId: "b" }, 400, "invalid-request"],
    [{ reviewId: "review-a" }, 400, "invalid-request"],
  ])("refuses %j", async (body, status, reason) => {
    const { route, store } = await setup();
    const response = await route(request(body));
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ status: "failed", reason });
    expect((await store.listForSigner("a"))[0].title).toBe("Residential Lease Agreement");
  });

  it.each([
    [{ kind: "signed-out" } as const, 401],
    [{ kind: "unconfigured" } as const, 503],
  ])("requires a signed-in account: %j", async (account, status) => {
    const { route, setAccounts } = await setup();
    setAccounts(account);
    expect((await route(request({ reviewId: "review-a", title: "New" }))).status).toBe(status);
  });
});

describe("titles in the Supabase store", () => {
  it("stores the generated title with a new review", async () => {
    const calls: Record<string, unknown>[] = [];
    const client = {
      async rpc(name: string, args: Record<string, unknown>) {
        calls.push({ name, ...args });
        return { data: { created_at: "2027-02-01T00:00:00Z", saved_at: null, expires_at: "2027-03-03T00:00:00Z" }, error: null };
      },
    } as unknown as SupabaseClient;
    const documents = [{ id: "pasted-lease", title: "harrowgate-lease.pdf", text: loadFixture("adhesion-lease").text }];
    const review = await runGeneralReview({ role: "renter", packet: { documents }, model: createFixtureModelClient() });
    await new SupabaseReviewStore(client).save({ id: "review", signerId: "signer", createdAt: "2027-02-01T00:00:00Z", documents, review });
    expect(calls[0].p_review).toMatchObject({ display_title: "Residential Lease Agreement" });
  });

  it("renames through the owner-checked RPC and reports a refused rename as not found", async () => {
    const calls: unknown[] = [];
    let data: unknown = { display_title: "Spring lease" };
    let error: unknown = null;
    const client = {
      async rpc(name: string, args: unknown) {
        calls.push({ name, args });
        return { data, error };
      },
    } as unknown as SupabaseClient;
    const store = new SupabaseReviewStore(client);
    expect(await store.renameForSigner("signer", "review", "Spring lease")).toBe("Spring lease");
    expect(calls[0]).toEqual({ name: "rename_review", args: { p_signer_id: "signer", p_review_id: "review", p_title: "Spring lease" } });
    data = null;
    expect(await store.renameForSigner("other", "review", "Mine")).toBeNull();
    error = { message: "Database unavailable" };
    await expect(store.renameForSigner("signer", "review", "Again")).rejects.toThrow("could not be renamed");
  });

  it("lists the stored title, and falls back to the lease's document title for older reviews", async () => {
    const rows = [
      { id: "new", created_at: "2027-01-02T00:00:00Z", saved_at: null, expires_at: "2027-02-01T00:00:00Z", display_title: "Spring lease", role: "renter", clean: true, review_documents: [{ title: "Lease", position: 0 }], review_flags: [] },
      { id: "old", created_at: "2027-01-01T00:00:00Z", saved_at: null, expires_at: "2027-01-31T00:00:00Z", display_title: null, role: null, clean: true, review_documents: [{ title: "Fees", position: 1 }, { title: "Lease text you pasted", position: 0 }], review_flags: [] },
    ];
    const query = { select: () => query, eq: () => query, async order() { return { data: rows, error: null }; } };
    const client = { from: () => query } as unknown as SupabaseClient;
    const listed = await new SupabaseReviewStore(client).listForSigner("signer");
    expect(listed.map((review) => review.title)).toEqual(["Spring lease", "Lease text you pasted"]);
  });
});
