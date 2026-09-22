import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

vi.mock("@/features/auth/session", () => ({ getAccountsState: async () => ({ kind: "signed-out" }) }));
vi.mock("@/features/library/supabase-store", () => ({ openReviewStore: async () => { throw new Error("Anonymous visitor cannot open persistence"); } }));

import ReviewPage from "@/app/(app)/review/page";
import { createAnalysisRoute } from "@/features/analysis/server/route";
import { createFixtureModelClient } from "~tests/support/fixture-model-client";
import { installRouteFetch } from "~tests/support/route-fetch";
import { renderScreen } from "~tests/support/render-screen";
import { loadFixture } from "~tests/fixtures";

let restore: (() => void) | undefined;
afterEach(() => restore?.());

it("lets a visitor review without signing in even when accounts exist", async () => {
  restore = installRouteFetch({ "/api/analysis": createAnalysisRoute({
    model: createFixtureModelClient(),
    accounts: async () => ({ kind: "signed-out" }),
    store: async () => { throw new Error("Anonymous text must never persist"); },
    now: () => new Date("2027-02-01T00:00:00Z"),
    newReviewId: () => { throw new Error("Anonymous review must not get stored identity"); },
  }) });
  renderScreen(await ReviewPage());
  expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
  expect(screen.queryByText("Accounts aren't running yet")).toBeNull();
  const user = userEvent.setup();
  await user.click(screen.getByLabelText("Paste your lease"));
  await user.paste(loadFixture("clean-lease").text);
  await user.click(screen.getByRole("button", { name: "Read my lease" }));
  expect(await screen.findByRole("heading", { name: "No material flags found in the text reviewed" })).toBeInTheDocument();
  expect(screen.queryByRole("region", { name: /your reviews/i })).toBeNull();
  expect(screen.queryByRole("link", { name: /open this review/i })).toBeNull();
});
