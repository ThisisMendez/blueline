import { cleanup, screen, waitFor, within } from "@testing-library/react";
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
import { createRetentionRoute } from "@/features/library/retention-route";
import { createRedLineRoutes } from "@/features/red-lines/routes";

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
let time: number;
const DAY = 86_400_000;

beforeEach(() => {
  time = Date.parse("2027-02-01T09:00:00.000Z");
  store = new InMemoryReviewStore(() => new Date(time));
  adapters.store = store;
  adapters.accounts = SIGNER_A;
  const model = createFixtureModelClient({ behaviour: "correct" });
  const preferences = new Map<string, readonly string[]>();
  const redLineRoutes = createRedLineRoutes({
    model,
    accounts: async () => adapters.accounts,
    reviews: async () => adapters.store,
    preferences: async () => ({
      async read(signerId) { return preferences.get(signerId) ?? []; },
      async save(signerId, lines) { preferences.set(signerId, [...lines]); },
    }),
  });

  restoreFetch = installRouteFetch({
    "/api/library/save": createRetentionRoute({ accounts: async () => adapters.accounts, store: async () => adapters.store }),
    "/api/red-lines": redLineRoutes.preferences,
    "/api/analysis": createAnalysisRoute({
      model,
      accounts: async () => adapters.accounts,
      store: async () => adapters.store,
      now: () => new Date(time),
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
  await waitFor(() => expect(screen.getByRole("textbox", { name: "Your red lines" })).toBeEnabled());
}

describe("a signed-in signer pasting a lease", () => {
  it("explains a library load failure without losing the analysis entry point", async () => {
    vi.spyOn(store, "listForSigner").mockRejectedValueOnce(new Error("Database unavailable"));
    renderScreen(await ReviewPage());
    expect(screen.getByRole("alert")).toHaveTextContent("Your library could not be loaded.");
    expect(screen.getByLabelText("Paste your lease")).toBeEnabled();
    expect(screen.queryByText(/No reviews in your library/)).not.toBeInTheDocument();
  });
  it("shows automatic expiry, extends from a later save, and removes the expired review and text", async () => {
    await pasteAndSubmit();
    expect(screen.getByText("Mar 3, 2027, 09:00 AM UTC")).toHaveAttribute("dateTime", "2027-03-03T09:00:00.000Z");
    time += 12 * DAY;
    await userEvent.click(screen.getByRole("button", { name: "Save for 90 days from now" }));
    await screen.findByText("Saved. The expiry above has been updated.");
    const expiresAt = new Date(time + 90 * DAY).toISOString();
    expect(screen.getByText("May 14, 2027, 09:00 AM UTC")).toHaveAttribute("dateTime", expiresAt);
    cleanup();
    renderScreen(await ReviewPage());
    expect(within(screen.getByRole("region", { name: "Your reviews" })).getByText("May 14, 2027, 09:00 AM UTC")).toBeInTheDocument();
    cleanup();
    time += 90 * DAY;
    renderScreen(await ReviewPage());
    expect(screen.getByText(/No reviews in your library/)).toBeInTheDocument();
    expect(await store.findForSigner("signer-a", "review-1")).toBeNull();
    expect(store.size).toBe(0);
    await expect(SavedReviewPage({ params: Promise.resolve({ reviewId: "review-1" }) } as PageProps<"/review/[reviewId]">)).rejects.toThrow();
  });

  it("keeps the previous expiry visible when an explicit save fails", async () => {
    await pasteAndSubmit();
    vi.spyOn(store, "retainForSigner").mockRejectedValueOnce(new Error("Database unavailable"));
    await userEvent.click(screen.getByRole("button", { name: "Save for 90 days from now" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("The review was not saved for longer.");
    expect(screen.getByText("Mar 3, 2027, 09:00 AM UTC")).toBeInTheDocument();
    expect(screen.queryByText("Saved. The expiry above has been updated.")).not.toBeInTheDocument();
  });

  it("does not claim library persistence when completing the review could not be stored", async () => {
    vi.spyOn(store, "save").mockRejectedValueOnce(new Error("Database unavailable"));
    // There is no trusted review id, so personal red lines are unavailable too.
    const user = userEvent.setup();
    renderScreen(await ReviewPage());
    await user.click(screen.getByLabelText("Paste your lease"));
    await user.paste(adhesionText);
    await user.click(screen.getByRole("button", { name: "Read my lease" }));
    await screen.findByRole("heading", { name: /terms to look at/i });
    expect(screen.getByRole("alert")).toHaveTextContent("This review was not saved to your library.");
    expect(screen.queryByRole("link", { name: /open this review on its own page/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save for 90 days from now" })).not.toBeInTheDocument();
    expect(store.size).toBe(0);
  });

  it("reads the ranked flags on screen and finds the review again after a reload", async () => {
    await pasteAndSubmit();

    const flagsHeading = await screen.findByRole(
      "heading",
      { name: /terms to look at/i },
      { timeout: 10_000 },
    );
    expect(flagsHeading).toBeInTheDocument();

    // The summary, then every flag, quoting the signer's own text. The
    // lookup is scoped to the flag list because one sentence can be both a
    // flag and the sentence covering a checklist topic.
    const flagsSection = flagsHeading.closest("section")!;
    expect(screen.getByText(sidecar.summary)).toBeInTheDocument();
    for (const planted of sidecar.plantedFlags) {
      expect(within(flagsSection).getByText(planted.sourceSentence)).toBeInTheDocument();
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
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Your red lines" })).toBeEnabled());

    expect(screen.getByText(sidecar.summary)).toBeInTheDocument();
    const reloadedFlags = screen
      .getByRole("heading", { name: /terms to look at/i })
      .closest("section")!;
    for (const planted of sidecar.plantedFlags) {
      expect(within(reloadedFlags).getByText(planted.sourceSentence)).toBeInTheDocument();
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
    expect(screen.getByText(/No reviews in your library/)).toBeInTheDocument();
  }, 20_000);
});
