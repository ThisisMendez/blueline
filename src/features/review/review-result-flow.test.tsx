import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";

import { CLEAN_REVIEW_STATEMENT, type GeneralReview, type RiskFlag } from "@/features/analysis/types";

import { ReviewResult } from "./components/ReviewResult";

const flags: readonly RiskFlag[] = [
  {
    id: "high-1",
    severity: "high",
    consequence: "You could lose your full deposit.",
    triggeringCondition: "You move before the lease ends.",
    counterOffer: "Ask to pay only the cost of repairs you caused.",
    residualRisk: "You may still pay for repairs.",
    sourceDocumentId: "lease",
    sourceSentence: "The landlord shall keep the entire deposit if the tenant leaves early.",
    sourceStart: 0,
    sourceEnd: 70,
  },
  {
    id: "medium-1",
    severity: "medium",
    consequence: "Your bill could grow each day.",
    triggeringCondition: "You pay rent late.",
    counterOffer: "Ask for a one-time charge.",
    residualRisk: "A charge may still apply if you pay late.",
    sourceDocumentId: "lease",
    sourceSentence: "A fee of $100 applies for each day that rent is late.",
    sourceStart: 71,
    sourceEnd: 124,
  },
  {
    id: "medium-2",
    severity: "medium",
    consequence: "You may have to replace old pipes.",
    triggeringCondition: "A pipe breaks.",
    counterOffer: "Ask the landlord to cover repairs from wear.",
    residualRisk: "You may still pay for damage you cause.",
    sourceDocumentId: "lease",
    sourceSentence: "The tenant shall pay for all pipe repairs.",
    sourceStart: 125,
    sourceEnd: 167,
  },
];

const documents = [{ id: "lease", title: "Sample lease", text: flags.map((flag) => flag.sourceSentence).join(" ") }];
const review: GeneralReview = {
  summary: "The lease covers a one-year rental.",
  riskFlags: flags,
  coverage: { items: [{ status: "not-found", topicId: "access-to-the-home" }] },
  clean: false,
  cleanStatement: null,
  droppedFlagCount: 1,
};

afterEach(cleanup);

it("counts verified flags and filters them in report order using the keyboard", async () => {
  const user = userEvent.setup();
  render(<ReviewResult review={review} documents={documents} />);

  const summary = screen.getByRole("list", { name: "Flags by severity" });
  expect(within(summary).getAllByRole("listitem").map((item) => item.textContent?.trim())).toEqual([
    "1 High", "2 Medium", "0 Low",
  ]);
  expect(screen.getByText("We left out one flag because its quote did not match your lease text.")).toBeVisible();

  const findings = screen.getByRole("region", { name: "Terms to look at" });
  const cards = () => within(findings).getAllByRole("article");
  expect(cards().map((card) => within(card).getByRole("blockquote").textContent)).toEqual(
    flags.map((flag) => flag.sourceSentence),
  );
  expect(within(cards()[0]).getByText(flags[0].consequence)).toBeVisible();
  expect(within(cards()[0]).getByText("Sample lease, characters 0 to 70")).toBeVisible();

  const medium = within(findings).getByRole("button", { name: "Medium" });
  medium.focus();
  await user.keyboard("{Enter}");
  expect(medium).toHaveAttribute("aria-pressed", "true");
  expect(cards().map((card) => within(card).getByRole("blockquote").textContent)).toEqual(
    flags.slice(1).map((flag) => flag.sourceSentence),
  );
  expect(within(findings).getByRole("status")).toHaveTextContent("Showing 2 of 3 flags.");

  await user.click(within(findings).getByRole("button", { name: "Mentions fees or charges" }));
  expect(cards()).toHaveLength(1);
  expect(within(cards()[0]).getByText(flags[1].sourceSentence)).toBeVisible();

  await user.click(within(findings).getByRole("button", { name: "Low" }));
  expect(within(findings).queryAllByRole("article")).toHaveLength(0);
  expect(within(findings).getByRole("status")).toHaveTextContent("No flags match this filter.");
  expect(summary).toHaveTextContent("2 Medium");
});

it("keeps the clean review wording and hides the severity controls", () => {
  render(
    <ReviewResult
      review={{ ...review, riskFlags: [], clean: true, cleanStatement: CLEAN_REVIEW_STATEMENT, droppedFlagCount: 0 }}
      documents={documents}
    />,
  );

  expect(screen.getByRole("heading", { name: CLEAN_REVIEW_STATEMENT })).toBeVisible();
  expect(screen.queryByRole("list", { name: "Flags by severity" })).not.toBeInTheDocument();
  expect(screen.queryByRole("group", { name: "Filter flags" })).not.toBeInTheDocument();
});
