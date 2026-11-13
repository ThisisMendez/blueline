import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ReviewPage from "@/app/(app)/review/page";
import { createAnalysisRoute } from "@/features/analysis/server/route";
import { getAccountsState } from "@/features/auth/session";
import { InMemoryReviewStore } from "@/features/library/memory-store";
import { openReviewStore } from "@/features/library/supabase-store";

import { createFixtureModelClient } from "~tests/support/fixture-model-client";
import { installRouteFetch } from "~tests/support/route-fetch";
import { loadFixture } from "~tests/fixtures/index";

import { renderReviewFlow, textPdf } from "./session/testing";

// Only the PDF layout is substituted, so the lease text is exactly the fixture's.
vi.mock("@/features/packet/extract/pdf", async (original) =>
  (await import("@/features/review/session/testing")).withTextPdfs(await original()),
);

/**
 * Supabase absent, nothing mocked.
 *
 * With neither variable set, `getAccountsState` and `openReviewStore` answer
 * honestly without ever constructing a client, which is the whole reason the
 * app boots in this configuration. The pasted lease is still reviewed; it is
 * simply not kept.
 */

const { text: cleanText, sidecar } = loadFixture("clean-lease");

let store: InMemoryReviewStore;
let restoreFetch: () => void;

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  store = new InMemoryReviewStore(() => new Date("2027-02-01T09:00:00.000Z"));
  restoreFetch = installRouteFetch({
    "/api/analysis": createAnalysisRoute({
      model: createFixtureModelClient({ behaviour: "correct" }),
      accounts: getAccountsState,
      store: openReviewStore,
      now: () => new Date("2027-02-01T09:00:00.000Z"),
      newReviewId: () => "never-used",
    }),
  });
});

afterEach(() => {
  restoreFetch();
});

describe("the product with accounts unavailable", () => {
  it("says so, offers no library or saving, and still reviews a lease", async () => {
    expect(await getAccountsState()).toEqual({ kind: "unconfigured" });
    expect(await openReviewStore()).toBeNull();

    const user = userEvent.setup();
    const flow = renderReviewFlow(await ReviewPage());
    await user.click(screen.getByRole("button", { name: "I’m a renter" }));

    expect(screen.getByText("Accounts aren't running yet")).toBeInTheDocument();
    expect(screen.getByText("Not saved by Blueline")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /your reviews/i })).toBeNull();

    await user.upload(screen.getByLabelText("Choose file for your lease"), textPdf("lease.pdf", cleanText));
    await screen.findByText("lease.pdf · 1 page");
    await user.click(screen.getByRole("button", { name: "Read my lease" }));
    await waitFor(() => expect(flow.currentPath()).toBe("/review/report"));

    expect(
      await screen.findByRole(
        "heading",
        { name: "No material flags found in the text reviewed" },
        { timeout: 10_000 },
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(sidecar.summary)).toBeInTheDocument();

    // Nothing saved, nothing to open later, and no claim that the lease is fine.
    expect(store.size).toBe(0);
    expect(screen.queryByRole("link", { name: /open this review/i })).toBeNull();

    const page = document.body.textContent?.toLowerCase() ?? "";
    for (const forbidden of [
      "safe to sign",
      "safe-to-sign",
      "enforceab",
      "legally",
      "unlawful",
      "illegal",
      "guarantee",
    ]) {
      expect(page).not.toContain(forbidden);
    }
  }, 20_000);
});
