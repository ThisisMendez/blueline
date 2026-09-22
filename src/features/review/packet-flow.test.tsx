import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AccountsState } from "@/features/auth/session";
import type { ReviewStore } from "@/features/library/store";

const adapters = vi.hoisted(() => ({
  accounts: { kind: "signed-out" } as AccountsState,
  store: null as ReviewStore | null,
}));

// The same two adapters tickets 01 and 02 substitute: who is signed in, and
// where reviews are kept. The completeness gate, the pipeline, the verifier,
// the route and every screen run unmodified.
vi.mock("@/features/auth/session", () => ({
  getAccountsState: async () => adapters.accounts,
  getSignedInSigner: async () =>
    adapters.accounts.kind === "signed-in" ? adapters.accounts.signer : null,
}));

vi.mock("@/features/library/supabase-store", () => ({
  openReviewStore: async () => adapters.store,
}));

import ReviewPage from "@/app/(app)/review/page";
import { COMPLETENESS_SCHEMA_NAME } from "@/features/analysis/model/completeness-schema";
import { createAnalysisRoute } from "@/features/analysis/server/route";
import type { AnalysisOutcome } from "@/features/analysis/types";
import { InMemoryReviewStore } from "@/features/library/memory-store";

import {
  createFixtureModelClient,
  type FixtureModelClient,
  type FixtureModelClientOptions,
} from "~tests/support/fixture-model-client";
import { renderScreen } from "~tests/support/render-screen";
import { installRouteFetch } from "~tests/support/route-fetch";
import { loadFixture } from "~tests/fixtures/index";

const SIGNER: AccountsState = {
  kind: "signed-in",
  signer: { id: "signer-a", email: "a@example.test" },
};

const referencingLease = loadFixture("referencing-lease");
const feeSchedule = loadFixture("fee-schedule");
const petAddendum = loadFixture("pet-addendum");
const adhesionLease = loadFixture("adhesion-lease");

/** The reference sentences the corpus adjudicated, by the name they carry. */
const CITING_SENTENCE = Object.fromEntries(
  (referencingLease.sidecar.references ?? []).map((reference) => [
    reference.name,
    reference.citingSentence,
  ]),
);

/** The cost of leaving early, which lives in the schedule and nowhere else. */
const FEE_SCHEDULE_FLAG = feeSchedule.sidecar.plantedFlags[0];
const PET_ADDENDUM_FLAG = petAddendum.sidecar.plantedFlags[0];

let store: InMemoryReviewStore;
let model: FixtureModelClient;
let restoreFetch: () => void;
let requests: string[];
let outcomes: AnalysisOutcome[];
/** Held open, the route hangs, so the analysing state can be looked at. */
let hold: { readonly promise: Promise<void>; readonly release: () => void } | null;

function useModel(options: FixtureModelClientOptions = {}) {
  model = createFixtureModelClient({ behaviour: "correct", ...options });

  const analysis = createAnalysisRoute({
    model,
    accounts: async () => adapters.accounts,
    store: async () => adapters.store,
    now: () => new Date("2027-05-01T09:00:00.000Z"),
    newReviewId: () => "review-1",
  });

  restoreFetch = installRouteFetch({
    "/api/analysis": async (request: Request) => {
      requests.push(await request.clone().text());
      if (hold) await hold.promise;
      const response = await analysis(request);
      outcomes.push((await response.clone().json()) as AnalysisOutcome);
      return response;
    },
  });
}

function holdTheRoute() {
  let release: () => void = () => {};
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  hold = { promise, release };
}

beforeEach(() => {
  store = new InMemoryReviewStore();
  adapters.store = store;
  adapters.accounts = SIGNER;
  requests = [];
  outcomes = [];
  hold = null;
  restoreFetch = () => {};
});

afterEach(() => {
  hold?.release();
  restoreFetch();
});

type User = ReturnType<typeof userEvent.setup>;

function labels(position: number) {
  return position === 1
    ? { title: "Name for your lease", text: "Paste your lease" }
    : { title: `Name for document ${position}`, text: `Paste document ${position}` };
}

async function fillSlot(user: User, position: number, title: string, text: string) {
  const names = labels(position);
  await user.type(screen.getByLabelText(names.title), title);
  const textarea = screen.getByLabelText(names.text);
  await user.click(textarea);
  await user.paste(text);
}

async function addSlot(user: User) {
  await user.click(screen.getByRole("button", { name: "Add another document" }));
}

function submit(user: User) {
  return user.click(screen.getByRole("button", { name: "Read my lease" }));
}

/** Puts the referencing lease in, plus whichever referenced documents are named. */
async function buildPacket(
  user: User,
  supply: readonly ("fee-schedule" | "pet-addendum")[],
) {
  await fillSlot(user, 1, "marlowe-lease.pdf", referencingLease.text);

  let position = 1;
  for (const id of supply) {
    position += 1;
    await addSlot(user);
    if (id === "fee-schedule") {
      await fillSlot(user, position, "fees.pdf", feeSchedule.text);
    } else {
      await fillSlot(user, position, "pets.pdf", petAddendum.text);
    }
  }
}

const REVIEW_HEADING = /terms to look at/i;
const BLOCKED_HEADING = /points at .*(isn't|aren't) here/i;

describe("a packet that holds the whole agreement", () => {
  it("passes the gate and flags a term that is only in a referenced document", async () => {
    useModel();
    const user = userEvent.setup();
    renderScreen(await ReviewPage());

    await buildPacket(user, ["fee-schedule", "pet-addendum"]);
    await submit(user);

    expect(
      await screen.findByRole("heading", { name: REVIEW_HEADING }, { timeout: 10_000 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: BLOCKED_HEADING })).toBeNull();

    // The completeness check ran first, and only then the review.
    expect(model.completenessRequests).toHaveLength(1);
    expect(model.analysisRequests).toHaveLength(1);
    expect(model.requests[0].schemaName).toBe(COMPLETENESS_SCHEMA_NAME);

    const stored = await store.findForSigner("signer-a", "review-1");
    expect(stored).not.toBeNull();

    // The point of ADR 0005: a flag whose sentence is in the schedule, not
    // in the lease. Reviewing the lease alone could not have produced it.
    const fromSchedule = stored!.review.riskFlags.filter(
      (flag) => flag.sourceDocumentId === "supplied-2",
    );
    expect(fromSchedule.length).toBeGreaterThan(0);
    expect(
      fromSchedule.map((flag) => flag.sourceSentence),
    ).toContain(FEE_SCHEDULE_FLAG.sourceSentence);
    expect(referencingLease.text).not.toContain(FEE_SCHEDULE_FLAG.sourceSentence);
    expect(feeSchedule.text).toContain(FEE_SCHEDULE_FLAG.sourceSentence);
    expect(screen.getByText(FEE_SCHEDULE_FLAG.sourceSentence)).toBeInTheDocument();

    // And the pet addendum was read too, so all three documents were reviewed.
    expect(screen.getByText(PET_ADDENDUM_FLAG.sourceSentence)).toBeInTheDocument();
  }, 30_000);

  it("accepts several referenced documents and shows what each one answered", async () => {
    useModel();
    const user = userEvent.setup();
    renderScreen(await ReviewPage());

    await buildPacket(user, ["fee-schedule", "pet-addendum"]);
    await submit(user);

    await screen.findByRole("heading", { name: REVIEW_HEADING }, { timeout: 10_000 });

    const outcome = outcomes[0];
    expect(outcome.status).toBe("reviewed");
    if (outcome.status !== "reviewed") return;
    expect(outcome.completeness.kind).toBe("complete");
    expect(outcome.completeness.matches).toHaveLength(2);
    expect(
      outcome.completeness.matches.map((match) => match.reference.name).sort(),
    ).toEqual(["Pet Addendum", "Schedule of Resident Fees"]);
    expect(outcome.completeness.matches.map((match) => match.documentId).sort()).toEqual([
      "supplied-2",
      "supplied-3",
    ]);

    const ledger = screen.getByRole("region", { name: /what your lease points at/i });
    expect(within(ledger).getByText("Schedule of Resident Fees")).toBeInTheDocument();
    expect(within(ledger).getByText("Pet Addendum")).toBeInTheDocument();
    expect(within(ledger).getByText(/covered by fees\.pdf/i)).toBeInTheDocument();
    expect(within(ledger).getByText(/covered by pets\.pdf/i)).toBeInTheDocument();
  }, 30_000);

  it("keeps only extracted text for every document in the packet", async () => {
    useModel();
    const user = userEvent.setup();
    renderScreen(await ReviewPage());

    await buildPacket(user, ["fee-schedule", "pet-addendum"]);
    await submit(user);
    await screen.findByRole("heading", { name: REVIEW_HEADING }, { timeout: 10_000 });

    const stored = await store.findForSigner("signer-a", "review-1");
    expect(stored!.documents).toEqual([
      { id: "pasted-lease", title: "marlowe-lease.pdf", text: referencingLease.text },
      { id: "supplied-2", title: "fees.pdf", text: feeSchedule.text },
      { id: "supplied-3", title: "pets.pdf", text: petAddendum.text },
    ]);
    for (const document of stored!.documents) {
      expect(Object.keys(document).sort()).toEqual(["id", "text", "title"]);
    }

    // Nothing on the wire could have carried a file, for any of the three.
    const body = JSON.parse(requests[0]) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(["referenced", "text", "title"]);
    for (const supplied of body.referenced as Record<string, unknown>[]) {
      expect(Object.keys(supplied).sort()).toEqual(["text", "title"]);
    }
    expect(requests[0]).not.toContain("%PDF-");
    expect(requests[0]).not.toContain("JVBERi0");
  }, 30_000);
});

describe("a packet missing a document the lease points at", () => {
  it("is blocked, names what is missing, and carries no review of any kind", async () => {
    useModel();
    const user = userEvent.setup();
    renderScreen(await ReviewPage());

    await buildPacket(user, ["fee-schedule"]);
    await submit(user);

    const blocked = await screen.findByRole(
      "region",
      { name: BLOCKED_HEADING },
      { timeout: 10_000 },
    );

    // Named, with the sentence in the signer's own lease that names it.
    expect(within(blocked).getByText("Pet Addendum")).toBeInTheDocument();
    expect(
      within(blocked).getByText(CITING_SENTENCE["Pet Addendum"]),
    ).toBeInTheDocument();
    expect(within(blocked).getByText(/still to come/i)).toBeInTheDocument();

    // No summary, no flags, no clean review, nothing partial on the screen.
    expect(screen.queryByRole("heading", { name: REVIEW_HEADING })).toBeNull();
    expect(screen.queryByText("What this agreement says")).toBeNull();
    expect(screen.queryByText(referencingLease.sidecar.summary)).toBeNull();
    expect(screen.queryByText(FEE_SCHEDULE_FLAG.sourceSentence)).toBeNull();
    expect(screen.queryByText(/^Severity: /)).toBeNull();
    expect(
      screen.queryByRole("heading", { name: /no material flags found/i }),
    ).toBeNull();

    // Structurally, not just visually: the answer has no review in it, the
    // pipeline was never asked, and nothing was persisted.
    const outcome = outcomes[0];
    expect(outcome.status).toBe("blocked");
    expect(Object.keys(outcome).sort()).toEqual([
      "completeness",
      "documents",
      "status",
    ]);
    expect("review" in outcome).toBe(false);
    expect("summary" in outcome).toBe(false);
    expect("riskFlags" in outcome).toBe(false);
    expect(JSON.stringify(outcome)).not.toContain("severity");
    expect(model.analysisRequests).toHaveLength(0);
    expect(store.size).toBe(0);

    if (outcome.status !== "blocked") return;
    expect(outcome.completeness.missing.map((reference) => reference.name)).toEqual([
      "Pet Addendum",
    ]);

    // The compiler refuses one too: there is no field to put a review in.
    // @ts-expect-error a blocked outcome cannot carry a review
    const impossible: AnalysisOutcome = { ...outcome, review: { summary: "" } };
    void impossible;
  }, 30_000);

  it("moves the signer to the blocked state and lets them read it as a request", async () => {
    useModel();
    const user = userEvent.setup();
    renderScreen(await ReviewPage());

    await buildPacket(user, ["fee-schedule"]);
    await submit(user);

    const heading = await screen.findByRole(
      "heading",
      { name: BLOCKED_HEADING },
      { timeout: 10_000 },
    );
    await waitFor(() => expect(heading).toHaveFocus());
  }, 30_000);
});

describe("the two waits", () => {
  it("shows reading and waiting-on-you as different states, never at once", async () => {
    useModel();
    holdTheRoute();
    const user = userEvent.setup();
    renderScreen(await ReviewPage());

    await buildPacket(user, ["fee-schedule"]);
    await submit(user);

    // Wait one: we are reading. No question is being asked of the signer.
    expect(await screen.findByText("Reading your agreement")).toBeInTheDocument();
    expect(screen.getByText(/don't have to do anything/i)).toBeInTheDocument();
    expect(screen.queryByText("Waiting on your documents")).toBeNull();
    expect(screen.queryByRole("region", { name: BLOCKED_HEADING })).toBeNull();
    expect(screen.getByRole("button", { name: "Reading your lease" })).toBeDisabled();

    hold!.release();

    // Wait two: we are asking. No spinner, and something to do.
    const blocked = await screen.findByRole(
      "region",
      { name: BLOCKED_HEADING },
      { timeout: 10_000 },
    );
    expect(within(blocked).getByText("Waiting on your documents")).toBeInTheDocument();
    expect(
      within(blocked).getByRole("button", { name: "Check the packet again" }),
    ).toBeEnabled();
    expect(screen.queryByText("Reading your agreement")).toBeNull();
    expect(screen.queryByText(/don't have to do anything/i)).toBeNull();
  }, 30_000);
});

describe("a lease that points at nothing", () => {
  it("goes straight to its review, with no extra step for the signer", async () => {
    useModel();
    const user = userEvent.setup();
    renderScreen(await ReviewPage());

    const textarea = screen.getByLabelText("Paste your lease");
    await user.click(textarea);
    await user.paste(adhesionLease.text);
    await submit(user);

    expect(
      await screen.findByRole("heading", { name: REVIEW_HEADING }, { timeout: 10_000 }),
    ).toBeInTheDocument();

    // One send, one answer, nothing asked of the signer in between.
    expect(requests).toHaveLength(1);
    expect(JSON.parse(requests[0])).toEqual({ text: adhesionLease.text });
    expect(screen.queryByRole("region", { name: BLOCKED_HEADING })).toBeNull();
    expect(screen.queryByRole("region", { name: /what your lease points at/i })).toBeNull();

    const outcome = outcomes[0];
    expect(outcome.status).toBe("reviewed");
    if (outcome.status !== "reviewed") return;
    expect(outcome.completeness).toEqual({
      kind: "complete",
      matches: [],
      droppedReferenceCount: 0,
    });
  }, 30_000);
});

describe("a reference whose sentence cannot be found", () => {
  it("fails verification after one retry without issuing a partial review", async () => {
    useModel({ unquotableReferences: ["Pet Addendum"] });
    const user = userEvent.setup();
    renderScreen(await ReviewPage());

    await buildPacket(user, ["fee-schedule"]);
    await submit(user);

    expect(
      await screen.findByText(/couldn't verify the answer against your document/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: BLOCKED_HEADING })).toBeNull();

    // Asked twice, exactly as a flag with a bad quotation is asked twice.
    expect(model.completenessRequests).toHaveLength(2);

    const outcome = outcomes[0];
    expect(outcome).toEqual({ status: "failed", reason: "model-verification-failed" });
    expect(model.analysisRequests).toHaveLength(0);
    expect(store.size).toBe(0);
    expect(screen.queryByRole("heading", { name: REVIEW_HEADING })).toBeNull();
  }, 30_000);
});

describe("a match the signer disagrees with", () => {
  it("can be overridden with a document already in the packet, and then proceeds", async () => {
    // The model does not recognise the addendum under the name the signer
    // gave the file, so it reports the reference as unanswered.
    useModel({ mismatchedReferences: { "Pet Addendum": null } });
    const user = userEvent.setup();
    renderScreen(await ReviewPage());

    await buildPacket(user, ["fee-schedule", "pet-addendum"]);
    await submit(user);

    const blocked = await screen.findByRole(
      "region",
      { name: BLOCKED_HEADING },
      { timeout: 10_000 },
    );

    // One control, one answer, no re-upload: the document is already here.
    const petRow = within(blocked)
      .getAllByRole("combobox", { name: "Which document is this?" })
      .find((select) =>
        select.closest("li")?.textContent?.includes("Pet Addendum"),
      );
    expect(petRow).toBeDefined();
    await user.selectOptions(petRow!, "supplied-3");

    await user.click(
      within(blocked).getByRole("button", { name: "Check the packet again" }),
    );

    expect(
      await screen.findByRole("heading", { name: REVIEW_HEADING }, { timeout: 10_000 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: BLOCKED_HEADING })).toBeNull();
    expect(screen.getByText(PET_ADDENDUM_FLAG.sourceSentence)).toBeInTheDocument();

    const resent = JSON.parse(requests[1]) as {
      resolutions: { referenceId: string; documentId: string | null }[];
    };
    expect(resent.resolutions).toHaveLength(1);
    expect(resent.resolutions[0].documentId).toBe("supplied-3");

    const outcome = outcomes[1];
    expect(outcome.status).toBe("reviewed");
    if (outcome.status !== "reviewed") return;
    const pet = outcome.completeness.matches.find(
      (match) => match.reference.name === "Pet Addendum",
    );
    expect(pet?.matchedBy).toBe("signer");
    expect(pet?.documentId).toBe("supplied-3");
  }, 30_000);

  it("can be taken back, and the packet is blocked again", async () => {
    useModel();
    const user = userEvent.setup();
    renderScreen(await ReviewPage());

    await buildPacket(user, ["fee-schedule", "pet-addendum"]);
    await submit(user);
    await screen.findByRole("heading", { name: REVIEW_HEADING }, { timeout: 10_000 });

    const ledger = screen.getByRole("region", { name: /what your lease points at/i });
    const petRow = within(ledger)
      .getAllByRole("combobox", { name: "Which document is this?" })
      .find((select) =>
        select.closest("li")?.textContent?.includes("Pet Addendum"),
      );
    expect(petRow).toBeDefined();
    await user.selectOptions(petRow!, "");

    await user.click(
      within(ledger).getByRole("button", { name: "Check the packet again" }),
    );

    const blocked = await screen.findByRole(
      "region",
      { name: BLOCKED_HEADING },
      { timeout: 10_000 },
    );
    expect(within(blocked).getByText("Pet Addendum")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: REVIEW_HEADING })).toBeNull();
  }, 30_000);
});
