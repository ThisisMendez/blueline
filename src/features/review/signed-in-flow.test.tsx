import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AccountsState } from "@/features/auth/session";
import type { ReviewStore } from "@/features/library/store";

const adapters = vi.hoisted(() => ({
  accounts: { kind: "signed-out" } as AccountsState,
  store: null as ReviewStore | null,
}));

// The two external adapters: who is signed in, and where reviews are kept.
// Supabase itself cannot run here, so the session comes from a plain record
// and the store is the real in-memory implementation of the same port. The
// pipeline, the verifier, the route, and the screens all run unmodified.
vi.mock("@/features/auth/session", () => ({
  getAccountsState: async () => adapters.accounts,
  getSignedInSigner: async () =>
    adapters.accounts.kind === "signed-in" ? adapters.accounts.signer : null,
}));

vi.mock("@/features/library/supabase-store", () => ({
  openReviewStore: async () => adapters.store,
}));

import SavedReviewPage from "@/app/(app)/review/[reviewId]/page";
import ReviewPage from "@/app/(app)/review/page";
import { createAnalysisRoute } from "@/features/analysis/server/route";
import { InMemoryReviewStore } from "@/features/library/memory-store";

import { createFixtureModelClient } from "~tests/support/fixture-model-client";
import { renderScreen } from "~tests/support/render-screen";
import { installRouteFetch } from "~tests/support/route-fetch";
import { loadFixture } from "~tests/fixtures/index";

const SIGNER_A: AccountsState = {
  kind: "signed-in",
  signer: { id: "signer-a", email: "a@example.test" },
};
const SIGNER_B: AccountsState = {
  kind: "signed-in",
  signer: { id: "signer-b", email: "b@example.test" },
};

const { text: adhesionText, sidecar } = loadFixture("adhesion-lease");

/** Severity badges, in the order a correctly ranked review shows them. */
const ORDER_ON_SCREEN = ["Severity: High", "Severity: Medium", "Severity: Low"];

let store: InMemoryReviewStore;
let restoreFetch: () => void;

beforeEach(() => {
  store = new InMemoryReviewStore();
  adapters.store = store;
  adapters.accounts = SIGNER_A;

  restoreFetch = installRouteFetch({
    "/api/analysis": createAnalysisRoute({
      model: createFixtureModelClient({ behaviour: "correct" }),
      accounts: async () => adapters.accounts,
      store: async () => adapters.store,
      now: () => new Date("2027-02-01T09:00:00.000Z"),
      newReviewId: () => "review-1",
    }),
  });
});

afterEach(() => {
  restoreFetch();
});

async function pasteAndSubmit() {
  const user = userEvent.setup();
  renderScreen(await ReviewPage());

  const textarea = screen.getByLabelText("Paste your lease");
  await user.click(textarea);
  await user.paste(adhesionText);
  await user.click(screen.getByRole("button", { name: "Read my lease" }));
}

describe("a signed-in signer pasting a lease", () => {
  it("reads the ranked flags on screen and finds the review again after a reload", async () => {
    await pasteAndSubmit();

    expect(
      await screen.findByRole("heading", { name: /terms to look at/i }, { timeout: 10_000 }),
    ).toBeInTheDocument();

    // The summary, then every flag, quoting the signer's own text.
    expect(screen.getByText(sidecar.summary)).toBeInTheDocument();
    for (const planted of sidecar.plantedFlags) {
      expect(screen.getByText(planted.sourceSentence)).toBeInTheDocument();
    }

    const severities = screen
      .getAllByText(/^Severity: (High|Medium|Low)$/)
      .map((node) => node.textContent ?? "");
    const ranks = severities.map((label) => ORDER_ON_SCREEN.indexOf(label));
    expect(ranks).toEqual([...ranks].sort((left, right) => left - right));
    expect(severities[0]).toBe("Severity: High");

    const savedLink = screen.getByRole("link", { name: /open this review on its own page/i });
    expect(savedLink).toHaveAttribute("href", "/review/review-1");

    // Reload: the same review, read back out of the store.
    cleanup();
    const reloaded = await SavedReviewPage({
      params: Promise.resolve({ reviewId: "review-1" }),
    } as PageProps<"/review/[reviewId]">);
    renderScreen(reloaded);

    expect(screen.getByText(sidecar.summary)).toBeInTheDocument();
    for (const planted of sidecar.plantedFlags) {
      expect(screen.getByText(planted.sourceSentence)).toBeInTheDocument();
    }
    const reloadedSeverities = screen
      .getAllByText(/^Severity: (High|Medium|Low)$/)
      .map((node) => node.textContent);
    expect(reloadedSeverities).toEqual(severities);
  }, 20_000);

  it("keeps one signer's review away from another signer", async () => {
    await pasteAndSubmit();
    await screen.findByRole("heading", { name: /terms to look at/i }, { timeout: 10_000 });
    cleanup();

    expect(await store.findForSigner("signer-a", "review-1")).not.toBeNull();

    adapters.accounts = SIGNER_B;

    // The store refuses first.
    expect(await store.findForSigner("signer-b", "review-1")).toBeNull();
    expect(await store.listForSigner("signer-b")).toEqual([]);

    // So does the page: a review that is not yours is a review that is not there.
    await expect(
      SavedReviewPage({
        params: Promise.resolve({ reviewId: "review-1" }),
      } as PageProps<"/review/[reviewId]">),
    ).rejects.toThrow();
  }, 20_000);

  it("lists the signer's own reviews and nobody else's", async () => {
    await pasteAndSubmit();
    await screen.findByRole("heading", { name: /terms to look at/i }, { timeout: 10_000 });
    cleanup();

    renderScreen(await ReviewPage());
    const library = screen.getByRole("region", { name: /your reviews/i });
    expect(
      within(library).getByRole("link", { name: "Lease text you pasted" }),
    ).toHaveAttribute("href", "/review/review-1");

    cleanup();
    adapters.accounts = SIGNER_B;
    renderScreen(await ReviewPage());
    expect(screen.queryByRole("region", { name: /your reviews/i })).toBeNull();
  }, 20_000);
});
