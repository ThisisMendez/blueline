import { beforeEach, describe, expect, it } from "vitest";

import type { AccountsState } from "@/features/auth/session";
import { InMemoryReviewStore } from "@/features/library/memory-store";

import { createFixtureModelClient } from "~tests/support/fixture-model-client";
import { loadFixture } from "~tests/fixtures/index";

import type { AnalysisOutcome } from "../types";
import { createAnalysisRoute } from "./route";

const SIGNER_A: AccountsState = {
  kind: "signed-in",
  signer: { id: "signer-a", email: "a@example.test" },
};

const { text: adhesionText } = loadFixture("adhesion-lease");

let store: InMemoryReviewStore;
let accounts: AccountsState;

function route() {
  return createAnalysisRoute({
    model: createFixtureModelClient({ behaviour: "correct" }),
    accounts: async () => accounts,
    store: async () => (accounts.kind === "unconfigured" ? null : store),
    now: () => new Date("2027-02-01T09:00:00.000Z"),
    newReviewId: () => "review-1",
  });
}

function post(body: unknown): Request {
  return new Request("http://localhost/api/analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  store = new InMemoryReviewStore();
  accounts = SIGNER_A;
});

describe("the analysis route", () => {
  it("persists extracted text and nothing that could hold a file", async () => {
    const response = await route()(post({ text: adhesionText }));
    expect(response.status).toBe(200);

    const outcome = (await response.json()) as AnalysisOutcome;
    expect(outcome.status).toBe("reviewed");
    if (outcome.status !== "reviewed") return;
    expect(outcome.persisted).toBe(true);
    expect(outcome.reviewId).toBe("review-1");

    const stored = await store.findForSigner("signer-a", "review-1");
    expect(stored).not.toBeNull();
    expect(stored!.documents).toHaveLength(1);
    expect(Object.keys(stored!.documents[0]).sort()).toEqual(["id", "text", "title"]);
    expect(stored!.documents[0].text).toBe(adhesionText);
    expect(stored!.createdAt).toBe("2027-02-01T09:00:00.000Z");
    expect(stored!.review.riskFlags.length).toBeGreaterThan(0);
  });

  it("refuses a body carrying anything but text", async () => {
    const response = await route()(
      post({ text: adhesionText, file: "JVBERi0xLjQK", fileName: "lease.pdf" }),
    );

    expect(response.status).toBe(400);
    const outcome = (await response.json()) as AnalysisOutcome;
    expect(outcome).toEqual({ status: "rejected", reason: "malformed-request" });
    expect(store.size).toBe(0);
  });

  it("refuses an empty paste before calling the model", async () => {
    const response = await route()(post({ text: "   \n  " }));

    expect(response.status).toBe(400);
    const outcome = (await response.json()) as AnalysisOutcome;
    expect(outcome).toEqual({ status: "rejected", reason: "empty-text" });
    expect(store.size).toBe(0);
  });

  it("refuses to analyse anything for a signed-out visitor when accounts are running", async () => {
    accounts = { kind: "signed-out" };

    const response = await route()(post({ text: adhesionText }));

    expect(response.status).toBe(401);
    const outcome = (await response.json()) as AnalysisOutcome;
    expect(outcome).toEqual({ status: "rejected", reason: "not-signed-in" });
    expect(store.size).toBe(0);
  });

  it("reviews without persisting when accounts are not configured", async () => {
    accounts = { kind: "unconfigured" };

    const response = await route()(post({ text: adhesionText }));

    expect(response.status).toBe(200);
    const outcome = (await response.json()) as AnalysisOutcome;
    expect(outcome.status).toBe("reviewed");
    if (outcome.status !== "reviewed") return;
    expect(outcome.persisted).toBe(false);
    expect(outcome.reviewId).toBeNull();
    expect(outcome.review.riskFlags.length).toBeGreaterThan(0);
    expect(store.size).toBe(0);
  });
});
