import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AccountsState } from "@/features/auth/session";
import type { ReviewStore, StoredReview } from "@/features/library/store";

const adapters = vi.hoisted(() => ({
  accounts: { kind: "signed-in", signer: { id: "a", email: "a@example.test" } } as AccountsState,
  store: null as ReviewStore | null,
}));

vi.mock("@/features/auth/session", () => ({ getAccountsState: async () => adapters.accounts }));
vi.mock("@/features/library/supabase-store", () => ({ openReviewStore: async () => adapters.store }));

import SavedReviewPage from "@/app/(app)/review/[reviewId]/page";
import { runGeneralReview } from "@/features/analysis/review";
import { InMemoryReviewStore } from "@/features/library/memory-store";
import { legacyReviewTitle } from "@/features/library/store";
import { SCORE_UNAVAILABLE_LABEL, UNAVAILABLE_EXPLANATIONS } from "@/features/score";
import { loadFixture } from "~tests/fixtures/index";
import { createFixtureModelClient } from "~tests/support/fixture-model-client";
import { renderScreen } from "~tests/support/render-screen";

const documents = [{ id: "pasted-lease", title: "Residential Lease Agreement", text: loadFixture("adhesion-lease").text }];

async function openSaved(reviewId: string) {
  renderScreen(
    await SavedReviewPage({ params: Promise.resolve({ reviewId }) } as PageProps<"/review/[reviewId]">),
  );
}

afterEach(cleanup);

describe("a saved report", () => {
  beforeEach(async () => {
    const store = new InMemoryReviewStore(() => new Date("2027-01-13T09:00:00Z"));
    for (const role of ["renter", "landlord"] as const) {
      const review = await runGeneralReview({ role, packet: { documents }, model: createFixtureModelClient() });
      await store.save({ id: `review-${role}`, signerId: "a", createdAt: "2027-01-12T09:00:00Z", documents, review });
    }
    adapters.store = store;
  });

  it("shows the signer's own name for it, the side and the score", async () => {
    await adapters.store!.renameForSigner("a", "review-renter", "Elm Street flat");
    await openSaved("review-renter");

    expect(screen.getByRole("heading", { level: 1, name: "Elm Street flat" })).toBeVisible();
    expect(screen.getByText("Reviewed as a renter")).toBeVisible();
    const panel = screen.getByRole("region", { name: "Lease Risk Score" });
    expect(panel).toHaveTextContent(/\d+\/100/);
    expect(panel).toHaveTextContent(/Grade [ABCDF]/);
    expect(screen.getByRole("region", { name: "Flagged terms" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Six topics we check" })).toBeVisible();
    expect(screen.queryByRole("region", { name: "Ask about your agreement" })).toBeNull();
    expect(screen.getByRole("textbox", { name: "Your red lines" })).toBeInTheDocument();
  });

  it("renders one report with the landlord label for a landlord review", async () => {
    await openSaved("review-landlord");
    expect(screen.getByText("Reviewed as a landlord")).toBeVisible();
    expect(screen.queryByText("Reviewed as a renter")).toBeNull();
    expect(screen.getAllByRole("region", { name: "Lease Risk Score" })).toHaveLength(1);
  });
});

it("still renders a legacy review saved without a role or title, with no score", async () => {
  const review = await runGeneralReview({ role: "renter", packet: { documents }, model: createFixtureModelClient() });
  const legacy: StoredReview = {
    id: "legacy",
    signerId: "a",
    createdAt: "2026-06-01T09:00:00Z",
    savedAt: null,
    expiresAt: "2099-01-01T00:00:00Z",
    documents,
    title: legacyReviewTitle(documents),
    review: { ...review, role: undefined },
  };
  adapters.store = {
    save: async () => { throw new Error("unused"); },
    retainForSigner: async () => null,
    findForSigner: async (signerId, reviewId) => (signerId === "a" && reviewId === "legacy" ? legacy : null),
    listForSigner: async () => [],
    renameForSigner: async () => null,
  };

  await openSaved("legacy");

  expect(screen.getByRole("heading", { level: 1, name: "Residential Lease Agreement" })).toBeVisible();
  expect(screen.queryByText(/Reviewed as/)).toBeNull();
  const panel = screen.getByRole("region", { name: "Lease Risk Score" });
  expect(within(panel).getByText(SCORE_UNAVAILABLE_LABEL)).toBeVisible();
  expect(within(panel).getByText(UNAVAILABLE_EXPLANATIONS["legacy-review"])).toBeVisible();
  expect(within(screen.getByRole("region", { name: "Flagged terms" })).getAllByRole("article").length).toBeGreaterThan(0);
});
