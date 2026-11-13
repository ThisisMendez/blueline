import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

import SavedReviewPage from "@/app/(app)/review/[reviewId]/page";
import ReviewPage from "@/app/(app)/review/page";
import { createAnalysisRoute } from "@/features/analysis/server/route";
import { InMemoryReviewStore } from "@/features/library/memory-store";
import { createRedLineRoutes } from "@/features/red-lines/routes";
import { access, addendum, cap, lateFee, lease, repairRedLine, repairs, roleFixtureModel as model } from "~tests/support/role-fixture-model";
import { renderScreen } from "~tests/support/render-screen";
import { installRouteFetch } from "~tests/support/route-fetch";

import { renderReviewFlow, textPdf } from "./session/testing";

const { accounts, store } = vi.hoisted(() => ({
  accounts: { kind: "signed-in", signer: { id: "owner", email: "owner@example.test" } } as const,
  store: { current: null as InMemoryReviewStore | null },
}));
vi.mock("@/features/auth/session", () => ({ getAccountsState: async () => accounts }));
vi.mock("@/features/library/supabase-store", () => ({ openReviewStore: async () => store.current }));
// Only the PDF layout is substituted, so the lease text is exactly the fixture's.
vi.mock("@/features/packet/extract/pdf", async (original) =>
  (await import("@/features/review/session/testing")).withTextPdfs(await original()),
);


let restore: (() => void) | undefined;
afterEach(() => restore?.());

it("uses one selected role through missing documents and reopening, with different risks and the same contract terms", async () => {
  const now = () => new Date("2027-02-01T09:00:00Z");
  store.current = new InMemoryReviewStore(now);
  let nextId = 0;
  let preferences: readonly string[] = [];
  const redLines = createRedLineRoutes({
    model,
    accounts: async () => accounts,
    reviews: async () => store.current,
    preferences: async () => ({
      async read() { return preferences; },
      async save(_signerId, lines) { preferences = lines; },
    }),
  });
  restore = installRouteFetch({
    "/api/analysis": createAnalysisRoute({
      model, now, accounts: async () => accounts, store: async () => store.current,
      newReviewId: () => `review-${++nextId}`,
    }),
    "/api/red-lines": redLines.preferences,
    "/api/red-lines/matches": redLines.matches,
  });

  const user = userEvent.setup();
  const renderFlow = async () => renderReviewFlow(await ReviewPage(), {
    savedReview: (reviewId) =>
      SavedReviewPage({ params: Promise.resolve({ reviewId }), searchParams: Promise.resolve({}) }),
  });
  await renderFlow();
  await user.click(screen.getByRole("button", { name: "I’m a landlord" }));
  await user.upload(screen.getByLabelText("Choose file for your lease"), textPdf("lease.pdf", lease));
  await screen.findByText("lease.pdf · 1 page");
  await user.click(screen.getByRole("button", { name: "Read my lease" }));
  await screen.findByRole("heading", { name: /points at a document that isn.t here/i });
  await user.click(screen.getByRole("button", { name: "Add the missing document" }));
  expect(screen.getByText("Reviewing as a landlord")).toBeInTheDocument();

  async function supplyAddendum() {
    await user.upload(screen.getByLabelText("Add another PDF"), textPdf("Fee Addendum.pdf", addendum));
    await screen.findByText("Fee Addendum.pdf · 1 page");
    await user.click(screen.getByRole("button", { name: "Read my lease" }));
  }

  // Q&A is out of the beta: no report offers to answer questions.
  function expectNoQuestionPanel() {
    expect(screen.queryByRole("region", { name: "Ask about your agreement" })).toBeNull();
    expect(screen.queryByRole("textbox", { name: "Your question" })).toBeNull();
  }

  await supplyAddendum();
  await screen.findByText("Reviewed as a landlord");
  const roleReport = () => screen.getByRole("heading", { name: /flagged terms/i }).closest("section")!;
  expect(within(roleReport()).getAllByRole("heading", { level: 3 }).map((node) => node.textContent)).toEqual([
    "Repair and access timelines conflict", "Narrow notice window", "Daily late charge",
  ]);
  const landlordFee = within(roleReport()).getByRole("article", { name: "Daily late charge" });
  expect(within(landlordFee).getByText("Severity: Low")).toBeInTheDocument();
  expect(within(landlordFee).getByText(/simplify collections/)).toBeInTheDocument();
  expect(within(landlordFee).getByText(lateFee)).toBeInTheDocument();
  expect(within(landlordFee).getByText(cap)).toBeInTheDocument();
  expect(within(landlordFee).getByText("From Fee Addendum")).toBeInTheDocument();
  await user.click(within(landlordFee).getByRole("button", { name: "Read explanation" }));
  expect(within(landlordFee).getByText(/harder to collect/)).toBeInTheDocument();
  const conflict = within(roleReport()).getByRole("article", { name: "Repair and access timelines conflict" });
  expect(within(conflict).getByText(repairs)).toBeInTheDocument();
  expect(within(conflict).getByText(access)).toBeInTheDocument();
  await user.click(within(conflict).getByRole("button", { name: "Read explanation" }));
  expect(within(conflict).getByText(/unclear which deadline takes priority/)).toBeInTheDocument();
  const repairCoverage = screen.getByRole("article", { name: "Repairs" });
  expect(within(repairCoverage).getByText("Found", { exact: true })).toBeInTheDocument();
  const accessCoverage = screen.getByRole("article", { name: "Access to the home" });
  expect(within(accessCoverage).getByText(access)).toBeInTheDocument();
  expect(within(accessCoverage).getByText("From Fee Addendum")).toBeInTheDocument();
  const depositCoverage = screen.getByRole("article", { name: "Deposit deductions and return" });
  expect(within(depositCoverage).getByText("Not found in the text reviewed", { exact: true })).toBeInTheDocument();
  expect(within(depositCoverage).getByText(/what deductions will we document/i)).toBeInTheDocument();
  expect(screen.queryByText("Reviewed as a renter")).not.toBeInTheDocument();
  expectNoQuestionPanel();

  cleanup();
  renderScreen(await SavedReviewPage({ params: Promise.resolve({ reviewId: "review-1" }), searchParams: Promise.resolve({}) }));
  expect(screen.getByText("Reviewed as a landlord")).toBeInTheDocument();
  expect(within(roleReport()).getByText(cap)).toBeInTheDocument();
  expectNoQuestionPanel();
  const redLineInput = screen.getByRole("textbox", { name: "Your red lines" });
  await waitFor(() => expect(redLineInput).toBeEnabled());
  await user.type(redLineInput, repairRedLine);
  await user.click(screen.getByRole("button", { name: "Save and check red lines" }));
  expect(await screen.findByText("The lease gives you one day to make repairs.")).toBeInTheDocument();
  expect(within(roleReport()).getByText("Severity: High")).toBeInTheDocument();

  cleanup();
  await renderFlow();
  expect(screen.queryByLabelText(/Choose file/)).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "I’m a renter" }));
  await user.upload(screen.getByLabelText("Choose file for your lease"), textPdf("lease.pdf", lease));
  await screen.findByText("lease.pdf · 1 page");
  await supplyAddendum();
  await screen.findByText("Reviewed as a renter");
  expect(screen.queryByText("Reviewed as a landlord")).not.toBeInTheDocument();
  expect(within(roleReport()).getAllByRole("heading", { level: 3 }).map((node) => node.textContent)).toEqual([
    "Early-exit payment", "Daily late charge", "Narrow notice window",
  ]);
  const renterFee = within(roleReport()).getByRole("article", { name: "Daily late charge" });
  expect(within(renterFee).getByText("Severity: Medium")).toBeInTheDocument();
  expect(within(renterFee).getByText(/smaller one-time fee/)).toBeInTheDocument();
  expect(within(renterFee).getByText(lateFee)).toBeInTheDocument();
  expect(within(renterFee).getByText(cap)).toBeInTheDocument();
  await user.click(within(renterFee).getByRole("button", { name: "Read explanation" }));
  expect(within(renterFee).getByText("You could owe $300 after three late days.")).toBeInTheDocument();
  expect(screen.getByText("Rent carries a $100 daily late fee with a $300 monthly cap.")).toBeInTheDocument();
  expect(screen.getByText(/haven’t checked them against local law|haven't checked them against local law/)).toBeInTheDocument();
  expectNoQuestionPanel();
});
