import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AccountsState } from "@/features/auth/session";
import type { ReviewStore } from "@/features/library/store";

const adapters = vi.hoisted(() => ({
  accounts: { kind: "signed-out" } as AccountsState,
  store: null as ReviewStore | null,
}));

vi.mock("@/features/auth/session", () => ({
  getAccountsState: async () => adapters.accounts,
  getSignedInSigner: async () =>
    adapters.accounts.kind === "signed-in" ? adapters.accounts.signer : null,
}));
vi.mock("@/features/library/supabase-store", () => ({
  openReviewStore: async () => adapters.store,
}));
vi.mock("@/features/packet/extract/pdf", async (original) =>
  (await import("@/features/review/session/testing")).withTextPdfs(await original()),
);

import ReviewPage from "@/app/(app)/review/page";
import { createAnalysisRoute } from "@/features/analysis/server/route";
import { InMemoryReviewStore } from "@/features/library/memory-store";
import { MAXIMUM_PDF_BYTES } from "@/features/packet/extract/file";

import { createFixtureModelClient, type FixtureModelClientOptions } from "~tests/support/fixture-model-client";
import { installRouteFetch } from "~tests/support/route-fetch";
import { loadFixture, loadFixturePdf } from "~tests/fixtures/index";

import { PDF_PROBLEM_MESSAGE } from "./session/messages";
import { lockedPdf, renderReviewFlow, textPdf } from "./session/testing";

const adhesion = loadFixture("adhesion-lease");
const referencing = loadFixture("referencing-lease");
const feeSchedule = loadFixture("fee-schedule");
const petAddendum = loadFixture("pet-addendum");

let requests: string[];
let hold: { promise: Promise<void>; release: () => void } | null;
let restoreFetch: () => void;

function useRoute(options: FixtureModelClientOptions & { failFirst?: boolean } = {}) {
  const { failFirst, ...modelOptions } = options;
  const analysis = createAnalysisRoute({
    model: createFixtureModelClient({ behaviour: "correct", ...modelOptions }),
    accounts: async () => adapters.accounts,
    store: async () => adapters.store,
    now: () => new Date("2027-05-01T09:00:00.000Z"),
    newReviewId: () => "review-1",
  });
  let failures = failFirst ? 1 : 0;
  restoreFetch = installRouteFetch({
    "/api/analysis": async (request) => {
      requests.push(await request.clone().text());
      if (hold) await hold.promise;
      if (failures > 0) {
        failures -= 1;
        return Response.json({ status: "failed", reason: "model-unavailable" }, { status: 502 });
      }
      return analysis(request);
    },
  });
}

function holdTheRoute() {
  let release = () => {};
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  hold = { promise, release };
}

beforeEach(() => {
  adapters.accounts = { kind: "signed-out" };
  adapters.store = null;
  requests = [];
  hold = null;
  restoreFetch = () => {};
});

afterEach(() => {
  hold?.release();
  restoreFetch();
});

type User = ReturnType<typeof userEvent.setup>;

async function chooseLease(user: User, file: File) {
  await user.upload(screen.getByLabelText(/^Choose (a different )?file for your lease$/), file);
}

async function addPdf(user: User, file: File) {
  await user.upload(screen.getByLabelText("Add another PDF"), file);
  await screen.findByText(new RegExp(file.name.replace(".", "\\.")));
}

describe("choosing a side and a lease", () => {
  it("hands the role and files to processing, then shows the report in this tab", async () => {
    useRoute();
    const user = userEvent.setup();
    const flow = renderReviewFlow(await ReviewPage());

    expect(screen.getByRole("heading", { name: "Which side of the lease are you on?" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Choose file/)).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();

    await user.click(screen.getByRole("button", { name: "I’m a landlord" }));
    expect(screen.getByRole("button", { name: "I’m a landlord" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Read my lease" })).toBeDisabled();
    expect(screen.getByText(/This review stays in this tab\./)).toHaveTextContent(
      "This review stays in this tab. Sign in to keep reviews in your library and set personal red lines.",
    );
    expect(screen.getByText(/may keep them or use them for training/)).toBeInTheDocument();

    await chooseLease(user, textPdf("harrowgate-lease.pdf", adhesion.text));
    expect(await screen.findByText("Residential Lease Agreement")).toBeInTheDocument();
    expect(screen.getByText("harrowgate-lease.pdf · 1 page")).toBeInTheDocument();
    // Choosing a file only prepares. Nothing has been sent.
    expect(requests).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Read my lease" }));
    expect(flow.navigations[0]).toEqual({ kind: "push", href: "/review/processing" });

    await waitFor(() => expect(flow.currentPath()).toBe("/review/report"));
    expect(flow.navigations[1]).toEqual({ kind: "replace", href: "/review/report" });
    expect(await screen.findByRole("heading", { level: 1, name: "Residential Lease Agreement" })).toBeInTheDocument();
    expect(screen.getByText(/Reviewed as a landlord/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /terms to look at/i })).toBeInTheDocument();

    expect(requests).toHaveLength(1);
    expect(JSON.parse(requests[0])).toEqual({ role: "landlord", title: "Residential Lease Agreement", text: adhesion.text });
  }, 20_000);

  it("sends once however often the button is pressed, and shows real progress while it runs", async () => {
    useRoute();
    holdTheRoute();
    const user = userEvent.setup();
    const flow = renderReviewFlow(await ReviewPage());
    await user.click(screen.getByRole("button", { name: "I’m a renter" }));
    await chooseLease(user, textPdf("lease.pdf", adhesion.text));
    await screen.findByText("Residential Lease Agreement");

    const button = screen.getByRole("button", { name: "Read my lease" });
    await user.dblClick(button);
    void flow.store.actions.start();

    expect(await screen.findByRole("heading", { name: "Reading your agreement" })).toBeInTheDocument();
    expect(screen.getByText("Read 1 PDF in your browser")).toBeInTheDocument();
    expect(screen.getByText("Working")).toBeInTheDocument();

    // Back to the intake while it runs: the button stays off.
    await flow.goTo("/review");
    expect(screen.getByRole("button", { name: "Read my lease" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Check progress" })).toHaveAttribute("href", "/review/processing");
    await flow.goTo("/review/processing");

    hold!.release();
    await waitFor(() => expect(flow.currentPath()).toBe("/review/report"));
    expect(requests).toHaveLength(1);

    // Returning to processing afterwards reopens the report rather than reading again.
    await flow.goTo("/review/processing");
    await waitFor(() => expect(flow.currentPath()).toBe("/review/report"));
    expect(requests).toHaveLength(1);
  }, 20_000);
});

describe("a tab that no longer holds the review", () => {
  it.each(["/review/processing", "/review/report"])("offers a fresh start on %s", async (path) => {
    useRoute();
    const user = userEvent.setup();
    const flow = renderReviewFlow(await ReviewPage(), { initialPath: path });
    expect(screen.getByRole("heading", { name: "This tab doesn't have a review open" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start again" }));
    expect(flow.currentPath()).toBe("/review");
    expect(requests).toHaveLength(0);
  });
});

describe("a review that fails", () => {
  it("keeps the side and the documents, and tries the same packet again", async () => {
    useRoute({ failFirst: true });
    const user = userEvent.setup();
    const flow = renderReviewFlow(await ReviewPage());
    await user.click(screen.getByRole("button", { name: "I’m a renter" }));
    await chooseLease(user, textPdf("lease.pdf", adhesion.text));
    await screen.findByText("Residential Lease Agreement");
    await user.click(screen.getByRole("button", { name: "Read my lease" }));

    expect(await screen.findByRole("heading", { name: "We couldn't finish this review" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("The reading service didn't answer.");

    await user.click(screen.getByRole("button", { name: "Change documents" }));
    expect(flow.currentPath()).toBe("/review");
    expect(screen.getByRole("button", { name: "I’m a renter" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("lease.pdf · 1 page")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Read my lease" }));
    await waitFor(() => expect(flow.currentPath()).toBe("/review/report"));
    expect(requests).toHaveLength(2);
    expect(requests[1]).toBe(requests[0]);
  }, 20_000);

  it("retries from the processing page without going back", async () => {
    useRoute({ failFirst: true });
    const user = userEvent.setup();
    const flow = renderReviewFlow(await ReviewPage());
    await user.click(screen.getByRole("button", { name: "I’m a renter" }));
    await chooseLease(user, textPdf("lease.pdf", adhesion.text));
    await screen.findByText("Residential Lease Agreement");
    await user.click(screen.getByRole("button", { name: "Read my lease" }));
    await user.click(await screen.findByRole("button", { name: "Try again" }));
    await waitFor(() => expect(flow.currentPath()).toBe("/review/report"));
    expect(requests).toHaveLength(2);
  }, 20_000);
});

describe("a PDF that can't be used", () => {
  it.each([
    ["scanned", () => new File([loadFixturePdf("textless-lease")], "scan.pdf", { type: "application/pdf" })],
    ["encrypted", () => lockedPdf("locked.pdf")],
    ["empty", () => new File([], "empty.pdf", { type: "application/pdf" })],
    ["invalid", () => new File(["just some words"], "notes.pdf", { type: "application/pdf" })],
    ["oversized", () => new File([new Uint8Array(MAXIMUM_PDF_BYTES + 1)], "huge.pdf", { type: "application/pdf" })],
  ] as const)("explains a %s file and how to fix it, and sends nothing", async (problem, make) => {
    useRoute();
    const user = userEvent.setup();
    renderReviewFlow(await ReviewPage());
    await user.click(screen.getByRole("button", { name: "I’m a renter" }));
    const file = make();
    await chooseLease(user, file);

    expect(await screen.findByText(`Can't use ${file.name}`)).toBeInTheDocument();
    expect(screen.getByText(PDF_PROBLEM_MESSAGE[problem])).toBeInTheDocument();
    const input = screen.getByLabelText("Choose file for your lease");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const described = (input.getAttribute("aria-describedby") ?? "")
      .split(" ")
      .map((id) => document.getElementById(id)?.textContent ?? "")
      .join(" ");
    expect(described).toContain(PDF_PROBLEM_MESSAGE[problem]);
    expect(screen.getByRole("button", { name: "Read my lease" })).toBeDisabled();
    expect(requests).toHaveLength(0);
  }, 20_000);

  it("shows a supporting file's problem beside it without touching the lease", async () => {
    useRoute();
    const user = userEvent.setup();
    renderReviewFlow(await ReviewPage());
    await user.click(screen.getByRole("button", { name: "I’m a renter" }));
    await chooseLease(user, textPdf("lease.pdf", adhesion.text));
    await screen.findByText("Residential Lease Agreement");
    await user.upload(screen.getByLabelText("Add another PDF"), lockedPdf("rules.pdf"));
    expect(await screen.findByText(PDF_PROBLEM_MESSAGE.encrypted)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Read my lease" })).toBeEnabled();
  });
});

describe("a lease that names a document that isn't here", () => {
  it("names it, then lets the signer add it without rebuilding the packet", async () => {
    useRoute();
    const user = userEvent.setup();
    const flow = renderReviewFlow(await ReviewPage());
    await user.click(screen.getByRole("button", { name: "I’m a renter" }));
    await chooseLease(user, textPdf("marlowe-lease.pdf", referencing.text));
    await screen.findByText("Residential Lease Agreement");
    await addPdf(user, textPdf("fees.pdf", feeSchedule.text));
    await user.click(screen.getByRole("button", { name: "Read my lease" }));

    const blocked = await screen.findByRole("region", { name: /points at a document that isn.t here/i });
    expect(within(blocked).getByText("Pet Addendum")).toBeInTheDocument();

    await user.click(within(blocked).getByRole("button", { name: "Add the missing document" }));
    expect(flow.currentPath()).toBe("/review");
    expect(screen.getByRole("button", { name: "I’m a renter" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("marlowe-lease.pdf · 1 page")).toBeInTheDocument();
    expect(screen.getByText("fees.pdf · 1 page")).toBeInTheDocument();

    await addPdf(user, textPdf("pets.pdf", petAddendum.text));
    await user.click(screen.getByRole("button", { name: "Read my lease" }));
    await waitFor(() => expect(flow.currentPath()).toBe("/review/report"));
    expect(await screen.findByRole("heading", { name: /terms to look at/i })).toBeInTheDocument();
    expect(JSON.parse(requests[1]).referenced.map((document: { title: string }) => document.title)).toEqual(["fees", "pets"]);
  }, 30_000);
});

describe("a signed-in signer", () => {
  it("goes to the saved review's own page when the review was kept", async () => {
    adapters.accounts = { kind: "signed-in", signer: { id: "signer-a", email: "a@example.test" } };
    const store = new InMemoryReviewStore(() => new Date("2027-05-01T09:00:00.000Z"));
    adapters.store = store;
    useRoute();
    const user = userEvent.setup();
    const flow = renderReviewFlow(await ReviewPage());
    expect(screen.queryByText(/This review stays in this tab/)).toBeNull();
    await user.click(screen.getByRole("button", { name: "I’m a renter" }));
    expect(screen.getByText("Saved to your library")).toBeInTheDocument();
    await chooseLease(user, textPdf("lease.pdf", adhesion.text));
    await screen.findByText("Residential Lease Agreement");
    await user.click(screen.getByRole("button", { name: "Read my lease" }));
    await waitFor(() => expect(flow.currentPath()).toBe("/review/review-1"));
    expect(flow.navigations.at(-1)).toEqual({ kind: "replace", href: "/review/review-1" });
    expect((await store.listForSigner("signer-a"))[0].title).toBe("Residential Lease Agreement");
  }, 20_000);
});
