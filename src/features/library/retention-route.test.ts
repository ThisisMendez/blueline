import { describe, expect, it } from "vitest";
import type { AccountsState } from "@/features/auth/session";
import { runGeneralReview } from "@/features/analysis/review";
import { loadFixture } from "~tests/fixtures/index";
import { createFixtureModelClient } from "~tests/support/fixture-model-client";
import { InMemoryReviewStore } from "./memory-store";
import { createRetentionRoute } from "./retention-route";

function request(body: unknown) {
  return new Request("http://localhost/api/library/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

async function setup() {
  const time = Date.parse("2027-01-13T09:00:00Z");
  const store = new InMemoryReviewStore(() => new Date(time));
  const documents = [{ id: "lease", title: "Lease", text: loadFixture("clean-lease").text }];
  await store.save({ id: "review", signerId: "a", createdAt: "2027-01-01T09:00:00Z", documents, review: await runGeneralReview({ packet: { documents }, model: createFixtureModelClient() }) });
  let accounts: AccountsState = { kind: "signed-in", signer: { id: "a", email: "a@example.test" } };
  return { store, setAccounts(value: AccountsState) { accounts = value; }, route: createRetentionRoute({ accounts: async () => accounts, store: async () => store }) };
}

describe("explicit authenticated retention action", () => {
  it("returns actual retention from the save time and refuses caller timestamps", async () => {
    const { route } = await setup();
    const forged = await route(request({ reviewId: "review", expiresAt: "2099-01-01" }));
    expect(forged.status).toBe(400);
    const response = await route(request({ reviewId: "review" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "saved", retention: { createdAt: "2027-01-01T09:00:00Z", savedAt: "2027-01-13T09:00:00.000Z", expiresAt: "2027-04-13T09:00:00.000Z" } });
  });
  it("cannot save another signer's review or reveal whether it exists", async () => {
    const { route, setAccounts, store } = await setup();
    setAccounts({ kind: "signed-in", signer: { id: "b", email: "b@example.test" } });
    const response = await route(request({ reviewId: "review" }));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ status: "failed", reason: "not-found" });
    expect((await store.findForSigner("a", "review"))?.savedAt).toBeNull();
  });
  it.each([{ kind: "signed-out" } as const, { kind: "unconfigured" } as const])("requires configured authentication: $kind", async (account) => {
    const { route, setAccounts } = await setup();
    setAccounts(account);
    const response = await route(request({ reviewId: "review" }));
    expect(response.status).toBe(account.kind === "signed-out" ? 401 : 503);
    expect((await response.json()).status).toBe("failed");
  });
});
