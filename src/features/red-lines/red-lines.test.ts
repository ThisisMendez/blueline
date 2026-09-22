import { describe, expect, it } from "vitest";
import { createAnalysisRoute } from "@/features/analysis/server/route";
import { InMemoryReviewStore } from "@/features/library/memory-store";
import { createFixtureModelClient } from "~tests/support/fixture-model-client";
import { loadFixture } from "~tests/fixtures/index";
import { createRedLineRoutes } from "./routes";
import type { RedLineStore } from "./store";
import type { AccountsState } from "@/features/auth/session";
import { RED_LINES_SCHEMA_NAME } from "./contract";
import { ModelError, type ModelClient } from "@/features/analysis/model/client";

export function memoryPreferences(): RedLineStore {
  const values = new Map<string, readonly string[]>();
  return {
    async read(signerId) { return values.get(signerId) ?? []; },
    async save(signerId, lines) { values.set(signerId, [...lines]); },
  };
}

function request(path: string, body: unknown, method = "POST") {
  return new Request(`http://localhost/api/${path}`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

describe("personal red lines after a general review", () => {
  it("requires a real account for reading, saving, and matching preferences", async () => {
    for (const accounts of [{ kind: "unconfigured" }, { kind: "signed-out" }] as const) {
      const routes = createRedLineRoutes({ model: createFixtureModelClient(), accounts: async () => accounts, reviews: async () => new InMemoryReviewStore(), preferences: async () => memoryPreferences() });
      for (const response of [
        await routes.preferences(new Request("http://localhost/api/red-lines")),
        await routes.preferences(request("red-lines", { lines: ["No fees"] }, "PUT")),
        await routes.matches(request("red-lines/matches", { reviewId: "review-1" })),
      ]) expect(response.status).toBe(accounts.kind === "unconfigured" ? 503 : 401);
    }
  });

  it("isolates saved preferences by the authenticated signer and rejects forged identity", async () => {
    const preferences = memoryPreferences();
    const reviews = new InMemoryReviewStore();
    const model = createFixtureModelClient();
    let accounts: AccountsState = { kind: "signed-in", signer: { id: "signer-a", email: null } };
    await createAnalysisRoute({ model, accounts: async () => accounts, store: async () => reviews, now: () => new Date(), newReviewId: () => "review-1" })(request("analysis", { text: loadFixture("adhesion-lease").text }));
    const routes = createRedLineRoutes({ model, accounts: async () => accounts, preferences: async () => preferences, reviews: async () => reviews });
    await routes.preferences(request("red-lines", { lines: ["No arbitration"] }, "PUT"));
    accounts = { kind: "signed-in", signer: { id: "signer-b", email: null } };
    expect(await (await routes.preferences(new Request("http://localhost/api/red-lines"))).json()).toEqual({ status: "preferences", lines: [] });
    expect((await routes.preferences(request("red-lines", { lines: [], signerId: "signer-a" }, "PUT"))).status).toBe(400);
    expect((await routes.matches(request("red-lines/matches", { reviewId: "review-1" }))).status).toBe(404);
    expect(await preferences.read("signer-a")).toEqual(["No arbitration"]);
  });

  it.each(["wrong-document", "invented-red-line", "fabricated", "unreadable", "provider"])("withholds %s preference output", async (failure) => {
    const fixture = loadFixture("adhesion-lease");
    const external = createFixtureModelClient();
    const model: ModelClient = { async complete(query) {
      if (query.schemaName !== RED_LINES_SCHEMA_NAME) return external.complete(query);
      if (failure === "provider") throw new ModelError("rate-limited", "Limited");
      if (failure === "unreadable") return { matches: "invalid" };
      return { matches: [{ redLineIndex: failure === "invented-red-line" ? 8 : 0, explanation: "Conflicts with your preference.", sourceDocumentId: failure === "wrong-document" ? "someone-elses-lease" : "pasted-lease", sourceSentence: failure === "fabricated" ? "A sentence absent from the lease." : fixture.sidecar.redLines[0].expectedMatchSentence }] };
    } };
    const reviews = new InMemoryReviewStore();
    const preferences = memoryPreferences();
    const accounts = async () => ({ kind: "signed-in" as const, signer: { id: "signer-a", email: null } });
    await createAnalysisRoute({ model, accounts, store: async () => reviews, now: () => new Date(), newReviewId: () => "review-1" })(request("analysis", { text: fixture.text }));
    await preferences.save("signer-a", [fixture.sidecar.redLines[0].redLine]);
    const routes = createRedLineRoutes({ model, accounts, preferences: async () => preferences, reviews: async () => reviews });
    const result = await (await routes.matches(request("red-lines/matches", { reviewId: "review-1" }))).json();
    expect(result).toEqual({ status: "failed", reason: failure === "provider" ? "rate-limited" : failure === "unreadable" ? "unreadable" : "verification-failed" });
  });

  it("saves preferences and adds separate cited matches without changing general flags", async () => {
    const fixture = loadFixture("adhesion-lease");
    const model = createFixtureModelClient();
    const reviews = new InMemoryReviewStore();
    const preferences = memoryPreferences();
    const accounts = async () => ({ kind: "signed-in" as const, signer: { id: "signer-a", email: null } });
    await createAnalysisRoute({ model, accounts, store: async () => reviews, now: () => new Date(), newReviewId: () => "review-1" })(request("analysis", { text: fixture.text }));
    const before = await reviews.findForSigner("signer-a", "review-1");
    const routes = createRedLineRoutes({ model, accounts, preferences: async () => preferences, reviews: async () => reviews });
    expect((await (await routes.matches(request("red-lines/matches", { reviewId: "review-1" }))).json()).matches).toEqual([]);
    await routes.preferences(request("red-lines", { lines: [fixture.sidecar.redLines[0].redLine] }, "PUT"));
    const result = await (await routes.matches(request("red-lines/matches", { reviewId: "review-1" }))).json();
    expect(result.status).toBe("matched");
    expect(result.matches[0].redLine).toBe(fixture.sidecar.redLines[0].redLine);
    expect(result.matches[0].sourceSentence).toBe(fixture.sidecar.redLines[0].expectedMatchSentence);
    expect(result.matches[0]).not.toHaveProperty("severity");
    expect((await reviews.findForSigner("signer-a", "review-1"))!.review.riskFlags).toEqual(before!.review.riskFlags);
  });
});
