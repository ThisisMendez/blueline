import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAnalysisRoute } from "@/features/analysis/server/route";
import { DocumentIntake } from "@/features/review/components/DocumentIntake";
import { renderReviewFlow, textPdf } from "@/features/review/session/testing";

vi.mock("@/features/packet/extract/pdf", async (original) =>
  (await import("@/features/review/session/testing")).withTextPdfs(await original()),
);
import { loadFixture } from "~tests/fixtures/index";
import { createFixtureModelClient } from "~tests/support/fixture-model-client";
import { installRouteFetch } from "~tests/support/route-fetch";
import { createQuestionRoute } from "./route";
import { LOCAL_LAW_NOTE, NOT_ADDRESSED } from "./contract";

let restore = () => {};
afterEach(() => { restore(); cleanup(); });

describe("asking questions after an anonymous review", () => {
  it("shows cited answers and an explicit non-answer for missing information", async () => {
    const model = createFixtureModelClient();
    restore = installRouteFetch({
      "/api/analysis": createAnalysisRoute({ model, accounts: async () => ({ kind: "unconfigured" }), store: async () => null, now: () => new Date(), newReviewId: () => "unused" }),
      "/api/questions": createQuestionRoute(model),
    });
    const lease = loadFixture("adhesion-lease");
    const user = userEvent.setup();
    renderReviewFlow(<DocumentIntake persists={false} />);
    await user.click(screen.getByRole("button", { name: "I’m a renter" }));
    await user.upload(screen.getByLabelText("Choose file for your lease"), textPdf("lease.pdf", lease.text));
    await screen.findByText("lease.pdf · 1 page");
    await user.click(screen.getByRole("button", { name: "Read my lease" }));
    const question = await screen.findByRole("textbox", { name: "Your question" });
    await user.type(question, lease.sidecar.qa.answerable[0].question);
    await user.click(screen.getByRole("button", { name: "Ask about this agreement" }));
    const section = screen.getByRole("region", { name: "Ask about your agreement" });
    expect(await within(section).findByText(lease.sidecar.qa.answerable[0].expectedSourceSentence)).toBeInTheDocument();
    expect(within(section).getByText(/Source: Residential Lease Agreement/)).toBeInTheDocument();
    await user.clear(question);
    await user.type(question, lease.sidecar.qa.unanswerable[0].question);
    await user.click(screen.getByRole("button", { name: "Ask about this agreement" }));
    expect(await within(section).findByText(NOT_ADDRESSED)).toBeInTheDocument();
    expect(within(section).queryByText(lease.sidecar.qa.answerable[0].expectedSourceSentence)).toBeNull();
    expect(within(section).queryByText(LOCAL_LAW_NOTE)).toBeNull();

    // ADR 0014: a question about legality gets the lease's answer plus the local-law note, never a verdict.
    await user.clear(question);
    await user.type(question, "Is it legal for the landlord to keep my whole deposit?");
    await user.click(screen.getByRole("button", { name: "Ask about this agreement" }));
    expect(await within(section).findByText(LOCAL_LAW_NOTE)).toBeInTheDocument();
  });
});
