import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import type { AccountsState } from "@/features/auth/session";
import type { ReviewStore } from "@/features/library/store";

const adapters = vi.hoisted(() => ({
  accounts: { kind: "signed-in", signer: { id: "a", email: "a@example.test" } } as AccountsState,
  store: null as ReviewStore | null,
}));

vi.mock("@/features/auth/session", () => ({ getAccountsState: async () => adapters.accounts }));
vi.mock("@/features/library/supabase-store", () => ({ openReviewStore: async () => adapters.store }));

import ReviewPage from "@/app/(app)/review/page";
import { runGeneralReview } from "@/features/analysis/review";
import { renderReviewFlow } from "@/features/review/session/testing";
import { loadFixture } from "~tests/fixtures/index";
import { createFixtureModelClient } from "~tests/support/fixture-model-client";
import { installRouteFetch } from "~tests/support/route-fetch";

import { InMemoryReviewStore } from "./memory-store";
import { createRenameRoute } from "./rename-route";

let restore = () => {};

beforeEach(async () => {
  const store = new InMemoryReviewStore(() => new Date("2027-01-13T09:00:00Z"));
  const documents = [{ id: "pasted-lease", title: "Residential Lease Agreement", text: loadFixture("clean-lease").text }];
  const review = await runGeneralReview({ role: "renter", packet: { documents }, model: createFixtureModelClient() });
  await store.save({ id: "review-a", signerId: "a", createdAt: "2027-01-12T09:00:00Z", documents, review });
  adapters.store = store;
  restore = installRouteFetch({
    "/api/library/rename": createRenameRoute({ accounts: async () => adapters.accounts, store: async () => adapters.store }),
  });
});

afterEach(() => {
  restore();
  cleanup();
});

it("renames a review from the library and keeps the name after a reload", async () => {
  const user = userEvent.setup();
  renderReviewFlow(await ReviewPage());
  const library = screen.getByRole("region", { name: "Your reviews" });

  await user.click(within(library).getByRole("button", { name: "Rename Residential Lease Agreement" }));
  const input = within(library).getByLabelText("New name for Residential Lease Agreement");
  expect(input).toHaveFocus();
  await user.clear(input);
  await user.click(within(library).getByRole("button", { name: "Save name" }));
  expect(within(library).getByRole("alert")).toHaveTextContent("Use 1 to 80 characters.");

  await user.type(input, "  Elm Street renewal ");
  await user.click(within(library).getByRole("button", { name: "Save name" }));
  expect(await within(library).findByRole("link", { name: "Elm Street renewal" })).toHaveAttribute("href", "/review/review-a");

  cleanup();
  renderReviewFlow(await ReviewPage());
  expect(within(screen.getByRole("region", { name: "Your reviews" })).getByRole("link", { name: "Elm Street renewal" })).toBeInTheDocument();
});

it("keeps the old name and says why when the rename is refused", async () => {
  vi.spyOn(adapters.store!, "renameForSigner").mockResolvedValueOnce(null);
  const user = userEvent.setup();
  renderReviewFlow(await ReviewPage());
  const library = screen.getByRole("region", { name: "Your reviews" });
  await user.click(within(library).getByRole("button", { name: "Rename Residential Lease Agreement" }));
  await user.type(within(library).getByLabelText(/New name for/), " again");
  await user.click(within(library).getByRole("button", { name: "Save name" }));
  expect(await within(library).findByRole("alert")).toHaveTextContent("This review has expired or isn't available.");
  await user.click(within(library).getByRole("button", { name: "Cancel" }));
  expect(within(library).getByRole("link", { name: "Residential Lease Agreement" })).toBeInTheDocument();
});
