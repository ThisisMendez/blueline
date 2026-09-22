import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AccountsState } from "@/features/auth/session";
import type { ReviewStore } from "@/features/library/store";

const adapters = vi.hoisted(() => ({
  accounts: { kind: "signed-out" } as AccountsState,
  store: null as ReviewStore | null,
}));

// The same two adapters ticket 01's flow test substitutes: who is signed in,
// and where reviews are kept. The PDF reader, the pipeline, the verifier, the
// route and the screen all run unmodified.
vi.mock("@/features/auth/session", () => ({
  getAccountsState: async () => adapters.accounts,
  getSignedInSigner: async () =>
    adapters.accounts.kind === "signed-in" ? adapters.accounts.signer : null,
}));

vi.mock("@/features/library/supabase-store", () => ({
  openReviewStore: async () => adapters.store,
}));

import ReviewPage from "@/app/(app)/review/page";
import { createAnalysisRoute } from "@/features/analysis/server/route";
import { InMemoryReviewStore } from "@/features/library/memory-store";
import { extractPdfText } from "@/features/packet/extract/pdf";
import { normalizeText } from "@/features/packet/normalize";

import { createFixtureModelClient } from "~tests/support/fixture-model-client";
import { renderScreen } from "~tests/support/render-screen";
import { installRouteFetch } from "~tests/support/route-fetch";
import { loadFixture, loadFixturePdf } from "~tests/fixtures/index";

const SIGNER: AccountsState = {
  kind: "signed-in",
  signer: { id: "signer-a", email: "a@example.test" },
};

const { text: pastedLeaseText, sidecar } = loadFixture("adhesion-lease");

/** The bytes of the selectable-text fixture, and the text really inside it. */
const selectablePdfBytes = loadFixturePdf("adhesion-lease");
const textlessPdfBytes = loadFixturePdf("textless-lease");

let pdfText: string;

let store: InMemoryReviewStore;
let restoreFetch: () => void;
let requests: { readonly path: string; readonly body: string }[];

function pdfFile(name: string, bytes: ArrayBuffer): File {
  return new File([bytes], name, { type: "application/pdf" });
}

beforeEach(async () => {
  const extraction = await extractPdfText(selectablePdfBytes.slice(0));
  if (extraction.kind !== "text") throw new Error("the PDF fixture stopped extracting");
  pdfText = extraction.text;

  store = new InMemoryReviewStore(() => new Date("2027-02-01T09:00:00.000Z"));
  adapters.store = store;
  adapters.accounts = SIGNER;
  requests = [];

  const analysis = createAnalysisRoute({
    model: createFixtureModelClient({ behaviour: "correct" }),
    accounts: async () => adapters.accounts,
    store: async () => adapters.store,
    now: () => new Date("2027-02-01T09:00:00.000Z"),
    newReviewId: () => "review-1",
  });

  restoreFetch = installRouteFetch({
    // Records what crossed the wire, then runs the real handler on it.
    "/api/analysis": async (request: Request) => {
      const body = await request.clone().text();
      requests.push({ path: "/api/analysis", body });
      return analysis(request);
    },
  });
});

afterEach(() => {
  restoreFetch();
});

describe("a signer who has a PDF rather than text to paste", () => {
  it("reads the flags cited from the text inside their own file", async () => {
    const user = userEvent.setup();
    renderScreen(await ReviewPage());

    await user.upload(
      screen.getByLabelText("Open a PDF instead"),
      pdfFile("harrowgate-lease.pdf", selectablePdfBytes),
    );

    expect(
      await screen.findByText(/read 5 pages of harrowgate-lease\.pdf/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Read my lease" }));

    const flagsHeading = await screen.findByRole(
      "heading",
      { name: /terms to look at/i },
      { timeout: 10_000 },
    );
    expect(flagsHeading).toBeInTheDocument();
    expect(screen.getByText(sidecar.summary)).toBeInTheDocument();

    // A sentence can be both a flag and the sentence covering a checklist
    // topic, so the flag assertions below look inside the flag list.
    const flagsSection = flagsHeading.closest("section")!;

    // Every flag quotes the file: the sentence on screen is a slice of the
    // text that came out of the PDF, not of the .txt the fixture was cut from.
    const stored = await store.findForSigner("signer-a", "review-1");
    expect(stored).not.toBeNull();
    expect(stored!.documents).toEqual([
      { id: "pasted-lease", title: "harrowgate-lease.pdf", text: pdfText },
    ]);
    expect(stored!.review.riskFlags.length).toBe(sidecar.plantedFlags.length);

    expect(
      stored!.review.riskFlags.map((flag) => normalizeText(flag.sourceSentence)).sort(),
    ).toEqual(
      sidecar.plantedFlags.map((planted) => normalizeText(planted.sourceSentence)).sort(),
    );

    for (const flag of stored!.review.riskFlags) {
      expect(pdfText.includes(flag.sourceSentence)).toBe(true);
      expect(pdfText.slice(flag.sourceStart, flag.sourceEnd)).toBe(flag.sourceSentence);
      expect(
        within(flagsSection).getByText(normalizeText(flag.sourceSentence)),
      ).toBeInTheDocument();
    }
  }, 20_000);

  it("sends the extracted text and never the file", async () => {
    const user = userEvent.setup();
    renderScreen(await ReviewPage());

    await user.upload(
      screen.getByLabelText("Open a PDF instead"),
      pdfFile("harrowgate-lease.pdf", selectablePdfBytes),
    );
    await screen.findByText(/read 5 pages of harrowgate-lease\.pdf/i);
    await user.click(screen.getByRole("button", { name: "Read my lease" }));
    await screen.findByRole("heading", { name: /terms to look at/i }, { timeout: 10_000 });

    expect(requests).toHaveLength(1);
    const body = JSON.parse(requests[0].body) as Record<string, unknown>;

    // Text and a name for it. There is no third field, and no room for one:
    // the route's schema is strict, so a file field would be a 400.
    expect(Object.keys(body).sort()).toEqual(["text", "title"]);
    expect(body.text).toBe(pdfText);
    expect(body.title).toBe("harrowgate-lease.pdf");

    // What was sent is the PDF's text, not the pasted fixture it was made
    // from, and carries no trace of the bytes themselves.
    expect(body.text).not.toBe(pastedLeaseText);
    expect(normalizeText(body.text as string)).toContain(normalizeText(pastedLeaseText));
    expect(requests[0].body).not.toContain("JVBERi0");
    expect(requests[0].body).not.toContain("%PDF-");

    const stored = await store.findForSigner("signer-a", "review-1");
    expect(Object.keys(stored!.documents[0]).sort()).toEqual(["id", "text", "title"]);
    expect(stored!.documents[0].text).toBe(pdfText);
  }, 20_000);
});

describe("a signer whose PDF is a scan", () => {
  it("is told the file cannot be read, and gets no review at all", async () => {
    const user = userEvent.setup();
    renderScreen(await ReviewPage());

    await user.upload(
      screen.getByLabelText("Open a PDF instead"),
      pdfFile("scanned-lease.pdf", textlessPdfBytes),
    );

    expect(
      await screen.findByText(/nothing to read in scanned-lease\.pdf/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/probably a scan or a photo/i)).toBeInTheDocument();

    // The rejection is its own outcome. No summary, no flags, no clean
    // review, and nothing that could be read as "this lease is fine".
    expect(screen.queryByRole("heading", { name: /terms to look at/i })).toBeNull();
    expect(
      screen.queryByRole("heading", { name: /no material flags found/i }),
    ).toBeNull();
    expect(screen.queryByText("What this agreement says")).toBeNull();

    // Nothing was sent, so nothing was kept.
    expect(requests).toEqual([]);
    expect(store.size).toBe(0);

    // And the control the signer used says so itself.
    const input = screen.getByLabelText("Open a PDF instead");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const describedBy = input.getAttribute("aria-describedby")?.split(" ") ?? [];
    const described = describedBy
      .map((id) => document.getElementById(id)?.textContent ?? "")
      .join(" ");
    expect(described).toMatch(/probably a scan or a photo/i);
  }, 20_000);

  it("leaves the signer able to paste the lease instead", async () => {
    const user = userEvent.setup();
    renderScreen(await ReviewPage());

    await user.upload(
      screen.getByLabelText("Open a PDF instead"),
      pdfFile("scanned-lease.pdf", textlessPdfBytes),
    );
    await screen.findByText(/nothing to read in scanned-lease\.pdf/i);

    const textarea = screen.getByLabelText("Paste your lease");
    await user.click(textarea);
    await user.paste(pastedLeaseText);
    await user.click(screen.getByRole("button", { name: "Read my lease" }));

    expect(
      await screen.findByRole("heading", { name: /terms to look at/i }, { timeout: 10_000 }),
    ).toBeInTheDocument();

    const body = JSON.parse(requests[0].body) as Record<string, unknown>;
    expect(Object.keys(body)).toEqual(["text"]);
    expect(body.text).toBe(pastedLeaseText);
  }, 20_000);
});
