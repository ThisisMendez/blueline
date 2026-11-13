import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { CLEAN_REVIEW_STATEMENT, type GeneralReview, type RiskFlag } from "@/features/analysis/types";
import {
  HOW_WE_SCORE,
  SCORE_UNAVAILABLE_LABEL,
  UNAVAILABLE_EXPLANATIONS,
  scoreFromOutcome,
  scoreFromStoredReview,
} from "@/features/score";

import { ReviewResult } from "./components/ReviewResult";

const flags: readonly RiskFlag[] = [
  {
    id: "medium-1",
    severity: "medium",
    title: "Daily late fee",
    consequence: "Your bill could grow each day.",
    triggeringCondition: "You pay rent late.",
    counterOffer: "Ask for a one-time charge.",
    residualRisk: "A charge may still apply if you pay late.",
    nextStep: "Ask for a cap on the late fee.",
    sourceDocumentId: "lease",
    sourceSentence: "A fee of $100 applies for each day that rent is late.",
    sourceStart: 71,
    sourceEnd: 124,
  },
  {
    id: "high-1",
    severity: "high",
    title: "Deposit kept on early exit",
    consequence: "You could lose your full deposit.",
    triggeringCondition: "You move before the lease ends.",
    counterOffer: "Ask to pay only the cost of repairs you caused.",
    residualRisk: "You may still pay for repairs.",
    sourceDocumentId: "lease",
    sourceSentence: "The landlord shall keep the entire balance if the tenant leaves early.",
    sourceStart: 0,
    sourceEnd: 70,
  },
  {
    id: "medium-2",
    severity: "medium",
    title: "Pipe repairs",
    consequence: "You may have to replace old pipes.",
    triggeringCondition: "A pipe breaks.",
    counterOffer: "Ask the landlord to cover repairs from wear.",
    residualRisk: "You may still pay for damage you cause.",
    sourceDocumentId: "lease",
    sourceSentence: "The tenant shall pay for all pipe repairs.",
    sourceStart: 125,
    sourceEnd: 167,
    relatedCitations: [
      {
        sourceDocumentId: "rules",
        sourceSentence: "The landlord repairs plumbing within ten days.",
        sourceStart: 0,
        sourceEnd: 46,
      },
    ],
  },
];

const documents = [
  { id: "lease", title: "Sample lease", text: flags.map((flag) => flag.sourceSentence).join(" ") },
  { id: "rules", title: "House rules", text: "The landlord repairs plumbing within ten days." },
];

const review: GeneralReview = {
  role: "renter",
  summary:
    "The lease covers a one-year rental of an apartment. Rent is due on the first of each month. The tenant handles minor repairs.",
  riskFlags: flags,
  coverage: {
    items: [
      { status: "not-found", topicId: "access-to-the-home" },
      {
        status: "found",
        topicId: "repairs",
        sourceSentence: "The tenant shall pay for all pipe repairs.",
        sourceDocumentId: "lease",
        sourceStart: 125,
        sourceEnd: 167,
      },
    ],
  },
  clean: false,
  cleanStatement: null,
  droppedFlagCount: 0,
};

function renderReport(overrides: Partial<GeneralReview> = {}, title = "Sample lease") {
  const next = { ...review, ...overrides };
  return render(
    <ReviewResult review={next} documents={documents} title={title} score={scoreFromStoredReview({ review: next })} />,
  );
}

afterEach(cleanup);

describe("the report header", () => {
  it("shows the title, the side and the first two sentences of the summary", () => {
    renderReport();
    expect(screen.getByRole("heading", { level: 1, name: "Sample lease" })).toBeVisible();
    expect(screen.getByText("Reviewed as a renter")).toBeVisible();
    const about = screen.getByRole("region", { name: "About this agreement" });
    expect(about).toHaveTextContent(
      "The lease covers a one-year rental of an apartment. Rent is due on the first of each month.",
    );
    expect(about).not.toHaveTextContent("minor repairs");
  });

  it.each([
    ["renter", "Reviewed as a renter", "Reviewed as a landlord"],
    ["landlord", "Reviewed as a landlord", "Reviewed as a renter"],
  ] as const)("renders one report for a %s", (role, shown, hidden) => {
    renderReport({ role });
    expect(screen.getByText(shown)).toBeVisible();
    expect(screen.queryByText(hidden)).toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("region", { name: "Flagged terms" })).toHaveLength(1);
  });
});

describe("the Lease Risk Score", () => {
  it("shows the score, grade, label and verified totals, with how we score", async () => {
    const user = userEvent.setup();
    renderReport();
    const panel = screen.getByRole("region", { name: "Lease Risk Score" });
    // One high and two medium: 100 - 16 - 14 = 70, held at 69 by the one-High band.
    expect(panel).toHaveTextContent("69/100");
    expect(panel).toHaveTextContent("Grade D");
    // The label sits beside the grade; the bands table repeats it, folded away.
    expect(within(panel).getAllByText("High-risk concerns")[0]).toBeVisible();
    const totals = within(panel).getByRole("list", { name: "Verified issues by severity" });
    expect(within(totals).getAllByRole("listitem").map((item) => item.textContent?.trim())).toEqual([
      "1 High", "2 Medium", "0 Low",
    ]);

    const disclosure = within(panel).getByText(HOW_WE_SCORE.title);
    expect(within(panel).getByText(HOW_WE_SCORE.paragraphs[0])).not.toBeVisible();
    await user.click(disclosure);
    expect(within(panel).getByText(HOW_WE_SCORE.paragraphs[0])).toBeVisible();
    expect(within(panel).getByRole("table")).toHaveTextContent("Severe concerns found");
    expect(panel.textContent).not.toMatch(/safe to sign|approved|guarantee|probability|legally/i);
  });

  it("is withheld when a flag was dropped, and the verified flags and notice stay", () => {
    renderReport({ droppedFlagCount: 1 });
    const panel = screen.getByRole("region", { name: "Lease Risk Score" });
    expect(within(panel).getByText(SCORE_UNAVAILABLE_LABEL)).toBeVisible();
    expect(within(panel).getByText(UNAVAILABLE_EXPLANATIONS["unverified-flags"])).toBeVisible();
    expect(panel).not.toHaveTextContent("/100");
    expect(within(panel).getByText("We left out one flag because its quote did not match your lease text.")).toBeVisible();
    expect(within(panel).getByRole("list", { name: "Verified issues by severity" })).toHaveTextContent("1 High");
    expect(within(screen.getByRole("region", { name: "Flagged terms" })).getAllByRole("article")).toHaveLength(3);
  });

  it("is withheld for a legacy saved review with no role, which still renders", () => {
    const legacy: GeneralReview = { ...review, role: undefined, droppedFlagCount: 0 };
    render(
      <ReviewResult
        review={legacy}
        documents={documents}
        title="Residential Lease Agreement"
        score={scoreFromStoredReview({ review: legacy })}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Residential Lease Agreement" })).toBeVisible();
    expect(screen.queryByText(/Reviewed as/)).toBeNull();
    expect(screen.getByText(UNAVAILABLE_EXPLANATIONS["legacy-review"])).toBeVisible();
    expect(within(screen.getByRole("region", { name: "Flagged terms" })).getAllByRole("article")).toHaveLength(3);
  });

  it.each([
    ["blocked", "incomplete-packet"],
    ["out-of-scope", "out-of-scope"],
    ["unverified", "completeness-unverified"],
    ["failed", "review-failed"],
  ] as const)("gives no score for a %s outcome", (status, reason) => {
    const outcome = status === "failed"
      ? ({ status, reason: "model-timeout" } as const)
      : ({ status, documents: [], completeness: {} } as unknown as Parameters<typeof scoreFromOutcome>[0]);
    const score = scoreFromOutcome(outcome);
    expect(score.available).toBe(false);
    if (!score.available) expect(score.reason).toBe(reason);
  });
});

describe("flagged terms and the six topics", () => {
  it("leads with the most serious flag and shows its quote, location and next step", () => {
    renderReport();
    const findings = screen.getByRole("region", { name: "Flagged terms" });
    const cards = within(findings).getAllByRole("article");
    expect(cards.map((card) => within(card).getByRole("heading", { level: 3 }).textContent)).toEqual([
      "Deposit kept on early exit", "Daily late fee", "Pipe repairs",
    ]);
    expect(within(cards[0]).getByText("Severity: High")).toBeVisible();
    expect(within(cards[0]).getByText(flags[1].consequence)).toBeVisible();
    expect(within(cards[0]).getByText("From Sample lease")).toBeVisible();
    expect(within(cards[1]).getByText("Ask for a cap on the late fee.")).toBeVisible();
    // A conflict cites every passage involved, each with its own location.
    expect(within(cards[2]).getAllByRole("blockquote").map((quote) => quote.textContent)).toEqual([
      "The tenant shall pay for all pipe repairs.",
      "The landlord repairs plumbing within ten days.",
    ]);
    expect(within(cards[2]).getByText("From House rules")).toBeVisible();
  });

  it("filters with the keyboard, keeps the order and matches the counts", async () => {
    const user = userEvent.setup();
    renderReport();
    const findings = screen.getByRole("region", { name: "Flagged terms" });
    const visibleTitles = () =>
      within(findings).getAllByRole("article").map((card) => within(card).getByRole("heading", { level: 3 }).textContent);

    const medium = within(findings).getByRole("button", { name: "Medium" });
    expect(medium).toHaveTextContent("Medium2");
    medium.focus();
    await user.keyboard("{Enter}");
    expect(medium).toHaveAttribute("aria-pressed", "true");
    expect(within(findings).getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "false");
    expect(visibleTitles()).toEqual(["Daily late fee", "Pipe repairs"]);
    expect(within(findings).getByRole("status")).toHaveTextContent("Showing 2 of 3 flags.");

    const fees = within(findings).getByRole("button", { name: "Mentions fees or charges" });
    expect(fees).toHaveTextContent("1");
    await user.click(fees);
    expect(visibleTitles()).toEqual(["Daily late fee"]);

    await user.click(within(findings).getByRole("button", { name: "Low" }));
    expect(within(findings).queryAllByRole("article")).toHaveLength(0);
    expect(within(findings).getByRole("status")).toHaveTextContent("No low-severity flags.");

    await user.click(within(findings).getByRole("button", { name: "All" }));
    expect(visibleTitles()).toEqual(["Deposit kept on early exit", "Daily late fee", "Pipe repairs"]);
  });

  it("says a missing topic was not found in the text reviewed, never as a flag", () => {
    renderReport();
    const topics = screen.getByRole("region", { name: "Six topics we check" });
    const access = within(topics).getByRole("article", { name: "Access to the home" });
    expect(within(access).getByText("Not found in the text reviewed")).toBeVisible();
    expect(within(access).queryByText(/^Severity/)).toBeNull();
    expect(access.querySelector("blockquote")).toBeNull();
    expect(within(access).getByText(/How much notice will I get/)).toBeVisible();
    const repairs = within(topics).getByRole("article", { name: "Repairs" });
    expect(within(repairs).getByText("Found")).toBeVisible();
    expect(within(repairs).getByText("From Sample lease")).toBeVisible();
  });

  it("keeps the clean review wording and hides the filters", () => {
    renderReport({ riskFlags: [], clean: true, cleanStatement: CLEAN_REVIEW_STATEMENT });
    expect(screen.getByRole("heading", { name: CLEAN_REVIEW_STATEMENT })).toBeVisible();
    expect(screen.queryByRole("group", { name: "Filter flags" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Lease Risk Score" })).toHaveTextContent("100/100");
  });

  it("never offers to answer questions about the agreement", () => {
    const { container } = renderReport();
    expect(screen.queryByRole("region", { name: "Ask about your agreement" })).toBeNull();
    expect(screen.queryByRole("textbox", { name: "Your question" })).toBeNull();
    expect(container.textContent).not.toMatch(/ask about (your|this) agreement/i);
  });
});
