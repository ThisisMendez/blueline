import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { createAnalysisRoute } from "@/features/analysis/server/route";
import { createFixtureModelClient } from "~tests/support/fixture-model-client";
import { loadFixture } from "~tests/fixtures/index";
import { installRouteFetch } from "~tests/support/route-fetch";
import { DocumentIntake } from "./components/DocumentIntake";

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
    render(<DocumentIntake persists={false} />);
    await user.click(screen.getByLabelText("Paste your lease"));
    await user.paste(fixture.text);
    await user.click(screen.getByRole("button", { name: "Read my lease" }));
    await screen.findByRole("heading", { name: /terms to look at/i });
    const flags = screen.getAllByRole("article", { name: /^Risk flag/ });
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
      await user.click(within(flag).getByRole("button", { name: "Hide explanation" }));
      expect(within(flag).queryByText(expected.counterOffer)).toBeNull();
      expect(within(flag).queryByText(expected.residualRisk)).toBeNull();
    }
  });
});
