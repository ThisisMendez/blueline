import { createHash } from "node:crypto";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ResourcesPage from "@/app/(marketing)/resources/page";
import RhodeIslandResourcesPage from "@/app/(marketing)/resources/rhode-island/page";

import sourceRegister from "../../../docs/legal/rhode-island-sources.json";
import { availableRhodeIslandReferences, type RhodeIslandRegister } from "./rhode-island-references";
import { checkSource } from "./rhode-island-source-check.mjs";

vi.mock("next/server", async (importOriginal) => ({
  ...await importOriginal<typeof import("next/server")>(),
  connection: vi.fn(async () => undefined),
}));
vi.mock("next/navigation", async (importOriginal) => ({
  ...await importOriginal<typeof import("next/navigation")>(),
  notFound: () => { throw new Error("404"); },
}));

const now = new Date("2026-11-15T12:00:00Z");
const baseline = "<html><body>Reviewed state source</body></html>";
const approved = {
  reviewedOn: "2026-11-13",
  reviewBy: "2026-12-13",
  reviewer: "Fixture reviewer",
  sha256: createHash("sha256").update(baseline).digest("hex"),
};
const register: RhodeIslandRegister = {
  ...sourceRegister,
  sources: sourceRegister.sources.map((source) => ({ ...source, ...approved })),
};
const expectedSections = ["34-18-15", "34-18-16.1", "34-18-17", "34-18-19", "34-18-22", "34-18-26", "34-18-37"];

function officialPage(body = baseline) {
  return new Response(body, { headers: { "content-type": "text/html; charset=utf-8" } });
}

afterEach(() => vi.unstubAllEnvs());

describe("Rhode Island reference publication", () => {
  it("loads only the approved sections when all verified baselines match", async () => {
    const fetchSource = vi.fn<typeof fetch>(async () => officialPage());
    const references = await availableRhodeIslandReferences(register, now, fetchSource);
    expect(references.map(({ section }) => section)).toEqual(expectedSections);
    expect(references.every(({ reviewedOn }) => reviewedOn === approved.reviewedOn)).toBe(true);
    expect(fetchSource).toHaveBeenCalledTimes(register.sources.length);
  });

  it("hides the affected section after source drift, redirect, unavailability or expiry", async () => {
    const expiredRegister: RhodeIslandRegister = {
      ...register,
      sources: register.sources.map((source) => source.section === "34-18-22"
        ? { ...source, reviewBy: "2026-11-15" } : source),
    };
    const fetchSource = vi.fn<typeof fetch>(async (input, init) => {
      expect(init).toMatchObject({ cache: "no-store", redirect: "manual" });
      const url = String(input);
      if (url.endsWith("34-18-15.htm")) return officialPage("New statute page");
      if (url.endsWith("34-18-16.1.htm")) return Response.redirect("https://example.com", 302);
      if (url.endsWith("34-18-17.htm")) throw new Error("Timed out");
      return officialPage();
    });
    const references = await availableRhodeIslandReferences(expiredRegister, now, fetchSource);
    expect(references.map(({ section }) => section)).toEqual(["34-18-19", "34-18-26", "34-18-37"]);
    expect(fetchSource.mock.calls.some(([url]) => String(url).endsWith("34-18-22.htm"))).toBe(false);
  });

  it("holds only the affected section when a tracked amendment takes effect", async () => {
    const amendedRegister: RhodeIslandRegister = {
      ...register,
      sources: register.sources.map((source) => source.section === "34-18-19"
        ? { ...source, amendmentEffectiveOn: "2026-11-15" } : source),
    };
    const fetchSource = vi.fn<typeof fetch>(async () => officialPage());
    const references = await availableRhodeIslandReferences(amendedRegister, now, fetchSource);
    expect(references.map(({ section }) => section)).toEqual(expectedSections.filter((section) => section !== "34-18-19"));
  });

  it("withholds the list when the annual enactments index changes", async () => {
    const fetchSource = vi.fn<typeof fetch>(async (input) =>
      String(input).endsWith("/pl2026sub.htm") ? officialPage("New laws") : officialPage(),
    );
    await expect(availableRhodeIslandReferences(register, now, fetchSource)).resolves.toEqual([]);
  });

  it("keeps pending baselines and a stale calendar year off the page without fetching", async () => {
    const fetchSource = vi.fn<typeof fetch>(async () => officialPage());
    await expect(availableRhodeIslandReferences(sourceRegister, now, fetchSource)).resolves.toEqual([]);
    await expect(availableRhodeIslandReferences(register, new Date("2027-01-01T00:00:00Z"), fetchSource)).resolves.toEqual([]);
    expect(fetchSource).not.toHaveBeenCalled();
  });

  it("rejects nonofficial links before fetching", async () => {
    const fetchSource = vi.fn<typeof fetch>(async () => officialPage());
    const issues = await checkSource({ id: "untrusted", url: "https://webserver.rilegislature.gov.example.com/fake", ...approved }, now.getTime(), fetchSource);
    expect(issues).toEqual(["Source URL is outside the official Rhode Island allowlist"]);
    expect(fetchSource).not.toHaveBeenCalled();
  });

  it("requires release activation for both the hub link and the route", async () => {
    vi.stubEnv("RHODE_ISLAND_RESOURCES_ENABLED", "");
    const hub = render(<ResourcesPage />);
    expect(screen.queryByRole("link", { name: /official state rental law/ })).toBeNull();
    await expect(RhodeIslandResourcesPage()).rejects.toThrow("404");

    vi.stubEnv("RHODE_ISLAND_RESOURCES_ENABLED", "true");
    hub.rerender(<ResourcesPage />);
    expect(screen.getByRole("link", { name: /official state rental law/ })).toHaveAttribute("href", "/resources/rhode-island");
    render(await RhodeIslandResourcesPage());
    expect(screen.getByText(/these links are under review/i)).toBeVisible();
    expect(screen.getByText(/Providence and other cities and towns/)).toBeVisible();
    expect(screen.getByText(/before the state updates its statute pages/)).toBeVisible();
    expect(screen.getByText(/lease review and score use only the documents/)).toBeVisible();
    expect(screen.queryByRole("link", { name: "Security deposits" })).toBeNull();
  });
});
