import { afterEach, describe, expect, it, vi } from "vitest";

import type { AnalysisOutcome } from "@/features/analysis/types";

import { createReviewSessionStore, type SessionDocument } from "./store";

const lease: SessionDocument = {
  id: "lease-1",
  kind: "lease",
  fileName: "harrowgate-lease.pdf",
  pageCount: 5,
  title: "Residential Lease Agreement",
  text: "RESIDENTIAL LEASE AGREEMENT\nRent is due on the first.",
};
const fees: SessionDocument = {
  id: "document-2",
  kind: "supporting",
  fileName: "fees.pdf",
  pageCount: 1,
  title: "fees",
  text: "Late fee: $50.",
};

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function respond(outcome: AnalysisOutcome): Response {
  return Response.json(outcome);
}

const failed: AnalysisOutcome = { status: "failed", reason: "model-timeout" };

afterEach(() => vi.restoreAllMocks());

describe("one review per tab", () => {
  it("sends the role, titles and text, and nothing that could carry a file", async () => {
    const calls: RequestInit[] = [];
    const store = createReviewSessionStore({
      fetch: async (_input, init) => {
        calls.push(init!);
        return respond(failed);
      },
    });
    store.actions.chooseRole("renter");
    store.actions.setLease(lease);
    store.actions.addSupporting(fees);
    await store.actions.start();

    expect(JSON.parse(String(calls[0].body))).toEqual({
      role: "renter",
      title: "Residential Lease Agreement",
      text: lease.text,
      referenced: [{ title: "fees", text: fees.text }],
    });
  });

  it("runs one analysis however many times start is called while it runs", async () => {
    const answer = deferred<Response>();
    const fetch = vi.fn(async () => answer.promise);
    const store = createReviewSessionStore({ fetch });
    store.actions.chooseRole("landlord");
    store.actions.setLease(lease);

    const first = store.actions.start();
    const second = store.actions.start();
    void store.actions.retry();
    expect(store.getSnapshot().status).toBe("processing");
    // Packet edits are refused while it runs.
    store.actions.removeDocument(lease.id);
    expect(store.getSnapshot().documents).toHaveLength(1);

    answer.resolve(respond(failed));
    await Promise.all([first, second]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("keeps the role and documents after a failure, and retries the same packet", async () => {
    const outcomes: (AnalysisOutcome | Error)[] = [new Error("offline"), failed];
    const bodies: string[] = [];
    const store = createReviewSessionStore({
      fetch: async (_input, init) => {
        bodies.push(String(init?.body));
        const next = outcomes.shift()!;
        if (next instanceof Error) throw next;
        return respond(next);
      },
    });
    store.actions.chooseRole("renter");
    store.actions.setLease(lease);

    await store.actions.start();
    expect(store.getSnapshot()).toMatchObject({
      status: "failed",
      role: "renter",
      documents: [lease],
      error: expect.stringMatching(/didn't reach us/),
    });

    await store.actions.retry();
    expect(store.getSnapshot()).toMatchObject({
      status: "failed",
      role: "renter",
      documents: [lease],
      error: expect.stringMatching(/took too long/),
    });
    expect(bodies[1]).toBe(bodies[0]);

    store.actions.returnToIntake();
    expect(store.getSnapshot()).toMatchObject({ status: "idle", role: "renter", documents: [lease] });
    expect(store.getSnapshot().error).toBeUndefined();
  });

  it("ignores an answer that arrives after the signer started over", async () => {
    const answer = deferred<Response>();
    const store = createReviewSessionStore({ fetch: async () => answer.promise });
    store.actions.chooseRole("renter");
    store.actions.setLease(lease);
    const running = store.actions.start();
    store.actions.reset();
    answer.resolve(respond(failed));
    await running;
    expect(store.getSnapshot()).toMatchObject({ status: "idle", role: null, documents: [] });
  });

  it("forgets earlier answers about references when the packet changes", () => {
    const store = createReviewSessionStore({ fetch: async () => respond(failed) });
    store.actions.setLease(lease);
    store.actions.choose("pet-addendum", "supplied-2");
    expect(store.getSnapshot().resolutions).toEqual({ "pet-addendum": "supplied-2" });
    store.actions.addSupporting(fees);
    expect(store.getSnapshot().resolutions).toEqual({});
    expect(store.getSnapshot().title).toBe("Residential Lease Agreement");
  });

  it("keeps the review out of browser storage and the address bar", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const pushState = vi.spyOn(window.history, "pushState");
    const replaceState = vi.spyOn(window.history, "replaceState");
    const store = createReviewSessionStore({ fetch: async () => respond(failed) });
    store.actions.chooseRole("renter");
    store.actions.setLease(lease);
    await store.actions.start();
    expect(setItem).not.toHaveBeenCalled();
    expect(pushState).not.toHaveBeenCalled();
    expect(replaceState).not.toHaveBeenCalled();
  });
});
