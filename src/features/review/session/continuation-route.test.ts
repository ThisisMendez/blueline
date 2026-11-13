import { afterEach, describe, expect, it, vi } from "vitest";

import { createAnalysisRoute } from "@/features/analysis/server/route";
import type { AnalysisOutcome } from "@/features/analysis/types";
import type { AccountsState } from "@/features/auth/session";
import { InMemoryReviewStore } from "@/features/library/memory-store";
import { loadFixture } from "~tests/fixtures";
import { createFixtureModelClient } from "~tests/support/fixture-model-client";

import { createReviewContinuationRoute } from "./continuation-route";

afterEach(() => vi.unstubAllEnvs());

describe("returning to a guest report after sign-in", () => {
  it("opens protected wording in the original browser and saves only on request", async () => {
    vi.stubEnv("REVIEW_CONTINUATION_SECRET", "local test secret with at least 32 bytes");
    let now = new Date("2026-11-13T12:00:00Z");
    const store = new InMemoryReviewStore(() => now);
    const model = createFixtureModelClient();
    let state: AccountsState = { kind: "signed-out" };
    const accounts = async () => state;
    const analyze = createAnalysisRoute({
      accounts,
      model,
      store: async () => store,
      now: () => now,
      newReviewId: () => "guest-review",
    });
    const response = await analyze(new Request("https://blueline.example/api/analysis", {
      method: "POST",
      body: JSON.stringify({ role: "renter", text: loadFixture("adhesion-lease").text }),
    }));
    const result = await response.json() as AnalysisOutcome;
    expect(result.status).toBe("reviewed");
    if (result.status !== "reviewed") throw new Error("Expected a fixture report");
    expect(result.continuation).toBeTruthy();
    expect(result.draftableFlagIds?.length).toBeGreaterThan(0);
    expect(result.review.riskFlags.every(({ counterOffer, residualRisk }) => !counterOffer && !residualRisk)).toBe(true);
    const cookie = response.headers.get("set-cookie")?.split(";")[0];
    expect(cookie).toMatch(/^__Host-blueline-review-browser-[a-f0-9]{16}=/);
    const post = createReviewContinuationRoute({ accounts, now: () => now, store: async () => store });
    const act = (action: "draft" | "save", browser = cookie, token = result.continuation) => post(new Request(
      "https://blueline.example/api/library/continue",
      { method: "POST", headers: { cookie: browser ?? "" }, body: JSON.stringify({ action, token }) },
    ));

    expect((await act("draft")).status).toBe(401);
    state = { kind: "signed-in", signer: { id: "renter-a", email: null } };
    expect((await act("draft", "")).status).toBe(410);
    expect((await act("draft", cookie, "invalid-token")).status).toBe(410);
    const draft = await act("draft");
    expect(draft.status).toBe(200);
    const { wording } = await draft.json();
    expect(wording[0].counterOffer).toBeTruthy();
    expect(await store.listForSigner("renter-a")).toEqual([]);

    const saves = await Promise.all([act("save"), act("save")]);
    expect(saves.map(({ status }) => status)).toEqual([200, 200]);
    expect(await store.listForSigner("renter-a")).toHaveLength(1);
    expect(await store.listForSigner("renter-b")).toEqual([]);
    expect(await store.findForSigner("renter-b", "guest-review")).toBeNull();
    now = new Date("2026-11-13T14:01:00Z");
    expect((await act("draft")).status).toBe(410);
  });
});
