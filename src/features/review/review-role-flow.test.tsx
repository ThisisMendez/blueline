import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

import SavedReviewPage from "@/app/(app)/review/[reviewId]/page";
import ReviewPage from "@/app/(app)/review/page";
import { createAnalysisRoute } from "@/features/analysis/server/route";
import { InMemoryReviewStore } from "@/features/library/memory-store";
import { createQuestionRoute } from "@/features/questions/route";
import { createRedLineRoutes } from "@/features/red-lines/routes";
import { access, addendum, cap, lateFee, lease, repairRedLine, repairs, roleFixtureModel as model } from "~tests/support/role-fixture-model";
import { renderScreen } from "~tests/support/render-screen";
import { installRouteFetch } from "~tests/support/route-fetch";

const { accounts, store } = vi.hoisted(() => ({
  accounts: { kind: "signed-in", signer: { id: "owner", email: "owner@example.test" } } as const,
  store: { current: null as InMemoryReviewStore | null },
}));
vi.mock("@/features/auth/session", () => ({ getAccountsState: async () => accounts }));
vi.mock("@/features/library/supabase-store", () => ({ openReviewStore: async () => store.current }));


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
    "/api/questions": createQuestionRoute(model),
    "/api/red-lines": redLines.preferences,
    "/api/red-lines/matches": redLines.matches,
  });

  const user = userEvent.setup();
  renderScreen(await ReviewPage());
  await user.click(screen.getByRole("button", { name: "I’m a landlord" }));
  await user.click(screen.getByLabelText("Paste your lease"));
  await user.paste(lease);
  await user.click(screen.getByRole("button", { name: "Read my lease" }));
  await screen.findByRole("heading", { name: /points at a document that isn.t here/i });
  expect(screen.getByText("Reviewing as a landlord")).toBeInTheDocument();

  async function supplyAddendum() {
    await user.click(screen.getByRole("button", { name: "Add another document" }));
    await user.type(screen.getByLabelText("Name for document 2"), "Fee Addendum");
    await user.click(screen.getByLabelText("Paste document 2"));
    await user.paste(addendum);
    await user.click(screen.getByRole("button", { name: "Read my lease" }));
  }

  async function askAboutMyDeadline() {
    await user.type(screen.getByRole("textbox", { name: "Your question" }), "What is my deadline?");
    await user.click(screen.getByRole("button", { name: "Ask about this agreement" }));
    return within(screen.getByRole("region", { name: "Ask about your agreement" }));
  }

  await supplyAddendum();
  await screen.findByRole("heading", { name: "Landlord review" });
  const roleReport = () => screen.getByRole("heading", { name: /terms to look at/i }).closest("section")!;
  expect(within(roleReport()).getAllByRole("heading", { level: 3 }).map((node) => node.textContent)).toEqual([
    "Repair and access timelines conflict", "Narrow notice window", "Daily late charge",
  ]);
  const landlordFee = within(roleReport()).getByRole("article", { name: "Daily late charge" });
  expect(within(landlordFee).getByText("Severity: Low")).toBeInTheDocument();
  expect(within(landlordFee).getByText(/simplify collections/)).toBeInTheDocument();
  expect(within(landlordFee).getByText(lateFee)).toBeInTheDocument();
  expect(within(landlordFee).getByText(cap)).toBeInTheDocument();
  expect(within(landlordFee).getByText(/Fee Addendum, characters/)).toBeInTheDocument();
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
  expect(within(accessCoverage).getByText(/Fee Addendum, characters/)).toBeInTheDocument();
  const depositCoverage = screen.getByRole("article", { name: "Deposit deductions and return" });
  expect(within(depositCoverage).getByText("Not found", { exact: true })).toBeInTheDocument();
  expect(within(depositCoverage).getByText(/what deductions will we document/i)).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Renter review" })).not.toBeInTheDocument();

  cleanup();
  renderScreen(await SavedReviewPage({ params: Promise.resolve({ reviewId: "review-1" }), searchParams: Promise.resolve({}) }));
  expect(screen.getByRole("heading", { name: "Landlord review" })).toBeInTheDocument();
  expect(within(roleReport()).getByText(cap)).toBeInTheDocument();
  expect(await (await askAboutMyDeadline()).findByText(repairs)).toBeInTheDocument();
  const redLineInput = screen.getByRole("textbox", { name: "Your red lines" });
  await waitFor(() => expect(redLineInput).toBeEnabled());
  await user.type(redLineInput, repairRedLine);
  await user.click(screen.getByRole("button", { name: "Save and check red lines" }));
  expect(await screen.findByText("The lease gives you one day to make repairs.")).toBeInTheDocument();
  expect(within(roleReport()).getByText("Severity: High")).toBeInTheDocument();

  cleanup();
  renderScreen(await ReviewPage());
  expect(screen.queryByLabelText("Paste your lease")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "I’m a renter" }));
  await user.click(screen.getByLabelText("Paste your lease"));
  await user.paste(lease);
  await supplyAddendum();
  await screen.findByRole("heading", { name: "Renter review" });
  expect(screen.queryByRole("heading", { name: "Landlord review" })).not.toBeInTheDocument();
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
  expect(await (await askAboutMyDeadline()).findByText(access)).toBeInTheDocument();
});
