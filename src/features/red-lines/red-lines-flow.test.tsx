import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAnalysisRoute } from "@/features/analysis/server/route";
import { InMemoryReviewStore } from "@/features/library/memory-store";
import { DocumentIntake } from "@/features/review/components/DocumentIntake";
import { ReviewResult } from "@/features/review/components/ReviewResult";
import { renderReviewFlow, textPdf } from "@/features/review/session/testing";

vi.mock("@/features/packet/extract/pdf", async (original) =>
  (await import("@/features/review/session/testing")).withTextPdfs(await original()),
);
import { createFixtureModelClient } from "~tests/support/fixture-model-client";
import { loadFixture } from "~tests/fixtures/index";
import { installRouteFetch } from "~tests/support/route-fetch";
import { createRedLineRoutes } from "./routes";
import type { RedLineStore } from "./store";

let restore = () => {};
afterEach(() => { restore(); cleanup(); });

describe("personalizing a reviewed lease", () => {
  it("shows general flags first, then saves and edits separate preference matches", async () => {
    const fixture = loadFixture("adhesion-lease");
    const model = createFixtureModelClient();
    const reviews = new InMemoryReviewStore();
    const values = new Map<string, readonly string[]>();
    const preferences: RedLineStore = { async read(id) { return values.get(id) ?? []; }, async save(id, lines) { values.set(id, [...lines]); } };
    const accounts = async () => ({ kind: "signed-in" as const, signer: { id: "signer-a", email: null } });
    const redLines = createRedLineRoutes({ model, accounts, reviews: async () => reviews, preferences: async () => preferences });
    restore = installRouteFetch({
      "/api/analysis": createAnalysisRoute({ model, accounts, store: async () => reviews, now: () => new Date(), newReviewId: () => "review-1" }),
      "/api/red-lines": redLines.preferences, "/api/red-lines/matches": redLines.matches,
    });
    const user = userEvent.setup();
    // A kept review opens on its own page; this stands in for that page's report.
    renderReviewFlow(<DocumentIntake persists />, {
      savedReview: async (reviewId) => {
        const saved = await reviews.findForSigner("signer-a", reviewId);
        return <ReviewResult review={saved!.review} documents={saved!.documents} reviewId={saved!.id} />;
      },
    });
    expect(screen.queryByRole("textbox", { name: "Your red lines" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "I’m a renter" }));
    await user.upload(screen.getByLabelText("Choose file for your lease"), textPdf("lease.pdf", fixture.text));
    await screen.findByText("lease.pdf · 1 page");
    await user.click(screen.getByRole("button", { name: "Read my lease" }));
    const heading = await screen.findByRole("heading", { name: /terms to look at/i });
    const flagsSection = heading.closest("section")!;
    const originalFlags = flagsSection.textContent;
    const editor = await screen.findByRole("textbox", { name: "Your red lines" });
    const action = screen.getByRole("button", { name: "Save and check red lines" });
    await user.click(editor);
    await user.paste(fixture.sidecar.redLines[0].redLine);
    await user.click(action);
    const section = await screen.findByRole("region", { name: "Preference matches" });
    expect(await within(section).findByText(fixture.sidecar.redLines[0].expectedMatchSentence)).toBeInTheDocument();
    expect(within(section).queryByText(/^Severity:/)).toBeNull();
    expect(flagsSection.textContent).toBe(originalFlags);
    expect(await preferences.read("signer-a")).toEqual([fixture.sidecar.redLines[0].redLine]);
    await user.clear(editor);
    await user.paste(fixture.sidecar.redLines[1].redLine);
    await user.click(action);
    const editedSection = await screen.findByRole("region", { name: "Preference matches" });
    expect(await within(editedSection).findByText(fixture.sidecar.redLines[1].expectedMatchSentence)).toBeInTheDocument();
    expect(within(editedSection).queryByText(fixture.sidecar.redLines[0].expectedMatchSentence)).toBeNull();
    expect(flagsSection.textContent).toBe(originalFlags);
    expect(await preferences.read("signer-a")).toEqual([fixture.sidecar.redLines[1].redLine]);
    cleanup();
    const stored = await reviews.findForSigner("signer-a", "review-1");
    render(<ReviewResult review={stored!.review} documents={stored!.documents} reviewId={stored!.id} />);
    expect(await screen.findByDisplayValue(fixture.sidecar.redLines[1].redLine)).toBeInTheDocument();
    const restoredEditor = screen.getByRole("textbox", { name: "Your red lines" });
    await user.clear(restoredEditor);
    await user.click(screen.getByRole("button", { name: "Save and check red lines" }));
    expect(await screen.findByText("No preference matches found for your saved red lines.")).toBeInTheDocument();
    expect(await preferences.read("signer-a")).toEqual([]);
  });
});
