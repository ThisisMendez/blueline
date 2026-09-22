import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AccountsState } from "@/features/auth/session";
import type { ReviewStore } from "@/features/library/store";

const adapters = vi.hoisted(() => ({
  accounts: { kind: "signed-out" } as AccountsState,
  store: null as ReviewStore | null,
}));

// The same two adapters the earlier flow tests substitute: who is signed in,
// and where reviews are kept. The checklist, the pipeline, the verifier, the
// route and every screen run unmodified.
vi.mock("@/features/auth/session", () => ({
  getAccountsState: async () => adapters.accounts,
  getSignedInSigner: async () =>
    adapters.accounts.kind === "signed-in" ? adapters.accounts.signer : null,
}));

vi.mock("@/features/library/supabase-store", () => ({
  openReviewStore: async () => adapters.store,
}));

import ReviewPage from "@/app/(app)/review/page";
import { COVERAGE_CHECKLIST } from "@/features/analysis/checklist";
import { createAnalysisRoute } from "@/features/analysis/server/route";
import { InMemoryReviewStore } from "@/features/library/memory-store";

import {
  createFixtureModelClient,
  UNQUOTABLE_SENTENCE,
  type FixtureModelClientOptions,
} from "~tests/support/fixture-model-client";
import { renderScreen } from "~tests/support/render-screen";
import { installRouteFetch } from "~tests/support/route-fetch";
import { loadFixture } from "~tests/fixtures/index";

const SIGNER: AccountsState = {
  kind: "signed-in",
  signer: { id: "signer-a", email: "a@example.test" },
};

const cleanLease = loadFixture("clean-lease");
const adhesionLease = loadFixture("adhesion-lease");

/** Language a not-found item is never allowed to carry, in any casing. */
const LEGAL_CLAIMS = [
  "unlawful",
  "illegal",
  "invalid",
  "non-compliant",
  "noncompliant",
  "must include",
  "should have included",
  "required by law",
  "safe to sign",
  "enforceab",
  "your rights",
  "violat",
];

let restoreFetch: () => void;

function useModel(options: FixtureModelClientOptions = {}) {
  restoreFetch = installRouteFetch({
    "/api/analysis": createAnalysisRoute({
      model: createFixtureModelClient({ behaviour: "correct", ...options }),
      accounts: async () => adapters.accounts,
      store: async () => adapters.store,
      now: () => new Date("2027-02-01T09:00:00.000Z"),
      newReviewId: () => "review-1",
    }),
  });
}

beforeEach(() => {
  adapters.store = new InMemoryReviewStore();
  adapters.accounts = SIGNER;
  restoreFetch = () => {};
});

afterEach(() => {
  restoreFetch();
  cleanup();
});

async function paste(text: string) {
  const user = userEvent.setup();
  renderScreen(await ReviewPage());

  const textarea = screen.getByLabelText("Paste your lease");
  await user.click(textarea);
  await user.paste(text);
  await user.click(screen.getByRole("button", { name: "Read my lease" }));
}

function checklistSection(): HTMLElement {
  return screen.getByRole("region", { name: /six topics/i });
}

describe("a signer reading the coverage checklist", () => {
  it("shows all six published topics, and the sentence covering each one", async () => {
    useModel();
    await paste(adhesionLease.text);
    await screen.findByRole("heading", { name: /terms to look at/i }, { timeout: 10_000 });

    const checklist = checklistSection();

    for (const topic of COVERAGE_CHECKLIST) {
      const heading = within(checklist).getByRole("heading", {
        name: topic.name,
        level: 3,
      });
      expect(heading).toBeInTheDocument();
      // Published means the signer reads what the topic means, too.
      expect(checklist.textContent).toContain(topic.description);
    }

    // Nothing was missing from this agreement, so nothing is marked absent.
    expect(within(checklist).queryAllByText("Not found")).toHaveLength(0);
    expect(within(checklist).getAllByText("Found")).toHaveLength(6);

    for (const topicId of COVERAGE_CHECKLIST.map((topic) => topic.id)) {
      const adjudicated = adhesionLease.sidecar.checklistTopics[topicId];
      if (!adjudicated.present) continue;
      expect(within(checklist).getByText(adjudicated.sourceSentence)).toBeInTheDocument();
    }
  }, 20_000);

  it("marks the two topics a clean lease leaves out, and says only that", async () => {
    useModel();
    await paste(cleanLease.text);
    await screen.findByRole(
      "heading",
      { name: /no material flags found in the text reviewed/i },
      { timeout: 10_000 },
    );

    const checklist = checklistSection();
    const absentLabels = within(checklist).getAllByText("Not found");
    expect(absentLabels).toHaveLength(2);

    const absentCards = absentLabels.map((label) => label.closest("article")!);
    const absentTopics = absentCards.map(
      (card) => within(card).getByRole("heading", { level: 3 }).textContent,
    );
    expect(absentTopics).toEqual(["Repairs", "Dispute routes"]);

    for (const card of absentCards) {
      // No sentence, because there is none: an absence has nothing to quote.
      expect(card.querySelector("blockquote")).toBeNull();
      expect(card.textContent).not.toContain("Source:");

      const said = (card.textContent ?? "").toLowerCase();
      for (const claim of LEGAL_CLAIMS) {
        expect(said, `a not-found item said "${claim}"`).not.toContain(claim);
      }
    }

    // The section as a whole makes no legal claim either.
    const wholeSection = (checklist.textContent ?? "").toLowerCase();
    for (const claim of LEGAL_CLAIMS) {
      expect(wholeSection, `the checklist said "${claim}"`).not.toContain(claim);
    }
  }, 20_000);

  it("keeps a clean review clean, in the wording the product already used", async () => {
    useModel();
    await paste(cleanLease.text);

    const cleanHeading = await screen.findByRole(
      "heading",
      { name: /no material flags found in the text reviewed/i },
      { timeout: 10_000 },
    );
    expect(cleanHeading.textContent).toBe("No material flags found in the text reviewed");

    // Two absences did not turn into two warnings.
    expect(screen.queryAllByText(/^Severity: /)).toHaveLength(0);
    expect(screen.queryByRole("heading", { name: /terms to look at/i })).toBeNull();
    expect(within(checklistSection()).getAllByText("Not found")).toHaveLength(2);
  }, 20_000);

  it("shows an error when a checklist citation cannot be verified", async () => {
    useModel({ topicCitations: { repairs: UNQUOTABLE_SENTENCE } });
    await paste(adhesionLease.text);

    expect(await screen.findByText(/couldn't verify the answer against your document/i)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /six topics/i })).toBeNull();
    expect(screen.queryByText("Not found")).toBeNull();
    expect(screen.queryByRole("heading", { name: /no material flags found/i })).toBeNull();
  }, 20_000);

  it("tells found from not found in words, not by colour or border alone", async () => {
    useModel();
    await paste(cleanLease.text);
    await screen.findByRole(
      "heading",
      { name: /no material flags found in the text reviewed/i },
      { timeout: 10_000 },
    );

    const checklist = checklistSection();
    const cards = within(checklist).getAllByRole("article");
    expect(cards).toHaveLength(6);

    for (const card of cards) {
      const labels = within(card).queryAllByText(/^(Found|Not found)$/);
      expect(labels).toHaveLength(1);
      // Each card is named by its topic, so the list reads in order.
      expect(within(card).getByRole("heading", { level: 3 })).toBeInTheDocument();
    }

    // The section sits under the page's own heading, not above it.
    expect(within(checklist).getByRole("heading", { level: 2 })).toBeInTheDocument();
  }, 20_000);
});
