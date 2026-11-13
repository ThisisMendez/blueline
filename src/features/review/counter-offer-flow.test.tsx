import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAnalysisRoute } from "@/features/analysis/server/route";
import { createFixtureModelClient } from "~tests/support/fixture-model-client";
import { loadFixture } from "~tests/fixtures/index";
import { installRouteFetch } from "~tests/support/route-fetch";
import { DocumentIntake } from "./components/DocumentIntake";
import { renderReviewFlow, textPdf } from "./session/testing";

vi.mock("@/features/packet/extract/pdf", async (original) =>
  (await import("@/features/review/session/testing")).withTextPdfs(await original()),
);

let restore = () => {};
afterEach(() => { restore(); cleanup(); });

describe("a counter-offer behind a flag's explanation", () => {
  it("reveals the proposed edit and residual risk only after both disclosure actions", async () => {
    const fixture = loadFixture("adhesion-lease");
    restore = installRouteFetch({ "/api/analysis": createAnalysisRoute({
      model: createFixtureModelClient(), accounts: async () => ({ kind: "unconfigured" }), store: async () => null,
      now: () => new Date(), newReviewId: () => "unused",
    }) });
    const user = userEvent.setup();
    renderReviewFlow(<DocumentIntake persists={false} />);
    await user.click(screen.getByRole("button", { name: "I’m a renter" }));
    await user.upload(screen.getByLabelText("Choose file for your lease"), textPdf("lease.pdf", fixture.text));
    await screen.findByText("lease.pdf · 1 page");
    await user.click(screen.getByRole("button", { name: "Read my lease" }));
    await screen.findByRole("heading", { name: /terms to look at/i });
    expect(screen.getByText(/haven’t checked them against local law|haven't checked them against local law/)).toBeInTheDocument();
    const flags = within(screen.getByRole("region", { name: /terms to look at/i })).getAllByRole("article");
    for (const flag of flags) {
      expect(within(flag).queryByRole("button", { name: "See proposed edit" })).toBeNull();
    }
    for (const expected of fixture.sidecar.plantedFlags) {
      const flag = flags.find((card) => card.textContent?.includes(expected.sourceSentence))!;
      expect(within(flag).queryByText(expected.counterOffer)).toBeNull();
      const explanation = within(flag).getByRole("button", { name: "Read explanation" });
      explanation.focus();
      await user.keyboard("{Enter}");
      expect(explanation).toHaveAttribute("aria-expanded", "true");
      expect(within(flag).getByText(expected.consequence)).toBeVisible();
      expect(within(flag).queryByText(expected.counterOffer)).toBeNull();
      await user.click(within(flag).getByRole("button", { name: "See proposed edit" }));
      expect(within(flag).getByText(expected.counterOffer)).toBeVisible();
      expect(within(flag).getByText(expected.residualRisk)).toBeVisible();
      expect(within(flag).getByText(/Any change needs the other party's agreement/)).toBeVisible();
      await user.click(within(flag).getByRole("button", { name: "Hide explanation" }));
      expect(within(flag).queryByText(expected.counterOffer)).toBeNull();
      expect(within(flag).queryByText(expected.residualRisk)).toBeNull();
    }
  });
});
