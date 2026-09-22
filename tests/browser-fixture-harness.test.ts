// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { assertFixtureInvocation, createBrowserFixtureFetch } from "../scripts/browser-fixture-fetch";
import { OpenRouterModelClient } from "../src/features/analysis/model/openrouter";
import { createAnalysisRoute } from "../src/features/analysis/server/route";
import { createQuestionRoute } from "../src/features/questions/route";
import { loadFixture } from "./fixtures";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

function useFixtureTransport() {
  vi.stubEnv("OPENROUTER_API_KEY", "browser-fixture-only");
  vi.stubEnv("OPENROUTER_MODEL", "browser-fixture-only");
  const network = vi.fn<typeof fetch>().mockRejectedValue(new Error("Unexpected network request"));
  vi.stubGlobal("fetch", createBrowserFixtureFetch(network));
  return network;
}

function analysisRoute() {
  return createAnalysisRoute({
    model: new OpenRouterModelClient(), accounts: async () => ({ kind: "unconfigured" }),
    store: async () => { throw new Error("Unexpected persistence"); }, now: () => new Date(),
    newReviewId: () => { throw new Error("Unexpected persisted ID"); },
  });
}

describe("test-only browser fixture transport", () => {
  it("drives the real provider client and analysis route with synthetic planted-risk text", async () => {
    const network = useFixtureTransport();
    const fixture = loadFixture("adhesion-lease");
    const route = createAnalysisRoute({
      model: new OpenRouterModelClient(), accounts: async () => ({ kind: "unconfigured" }),
      store: async () => { throw new Error("Unexpected persistence"); }, now: () => new Date(),
      newReviewId: () => { throw new Error("Unexpected persisted ID"); },
    });
    const response = await route(new Request("http://localhost/api/analysis", {
      method: "POST", body: JSON.stringify({ text: fixture.text }),
    }));
    const outcome = await response.json();
    expect(outcome.status).toBe("reviewed");
    expect(outcome.review.riskFlags).toHaveLength(9);
    expect(outcome.persisted).toBe(false);
    expect(network).not.toHaveBeenCalled();
  });

  it("keeps clean and incomplete fixture outcomes distinct", async () => {
    const network = useFixtureTransport();
    const route = analysisRoute();
    for (const id of ["clean-lease", "referencing-lease"] as const) {
      const response = await route(new Request("http://localhost/api/analysis", {
        method: "POST", body: JSON.stringify({ text: loadFixture(id).text }),
      }));
      const outcome = await response.json();
      expect(outcome.status).toBe(id === "clean-lease" ? "reviewed" : "blocked");
      if (id === "clean-lease") expect(outcome.review.clean).toBe(true);
      else expect(outcome.review).toBeUndefined();
    }
    expect(network).not.toHaveBeenCalled();
  });

  it("rejects unknown text and a known fixture with an extra clause, without a real model request", async () => {
    const network = useFixtureTransport();
    const route = analysisRoute();
    for (const text of ["Unknown lease text.", loadFixture("clean-lease").text + " An additional clause."]) {
      const response = await route(new Request("http://localhost/api/analysis", { method: "POST", body: JSON.stringify({ text }) }));
      expect(await response.json()).toEqual({ status: "failed", reason: "model-unavailable" });
    }
    expect(network).not.toHaveBeenCalled();
  });

  it("drives document-grounded Q&A and not-addressed responses through the real question route", async () => {
    const network = useFixtureTransport();
    const fixture = loadFixture("adhesion-lease");
    const route = createQuestionRoute(new OpenRouterModelClient());
    const ask = async (question: string) => {
      const response = await route(new Request("http://localhost/api/questions", {
        method: "POST", body: JSON.stringify({ question, documents: [{ id: "pasted-lease", title: "Synthetic agreement", text: fixture.text }] }),
      }));
      return response.json();
    };
    const answered = await ask("How much notice does the landlord have to give before coming into my apartment?");
    expect(answered.status).toBe("answered");
    expect(answered.citations[0].sourceSentence).toBe(fixture.sidecar.qa.answerable[0].expectedSourceSentence);
    expect(await ask("Does the lease say anything about renters insurance?")).toEqual({ status: "not-addressed" });
    expect(network).not.toHaveBeenCalled();
  });

  it("passes unrelated fetches through unchanged", async () => {
    const original = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ untouched: true }));
    const fetchFixture = createBrowserFixtureFetch(original);
    const result = await fetchFixture("http://127.0.0.1:3100/assets/font.woff2");
    expect(await result.json()).toEqual({ untouched: true });
    expect(original).toHaveBeenCalledWith("http://127.0.0.1:3100/assets/font.woff2", undefined);
  });

  it("requires explicit fixture mode and refuses public binding or hostname overrides", () => {
    const cli = ["node", "/project/node_modules/next/dist/bin/next"];
    expect(assertFixtureInvocation([...cli, "start", "--hostname", "127.0.0.1", "--port", "3100"], "1")).toBe("start");
    expect(() => assertFixtureInvocation([...cli, "start", "--hostname", "127.0.0.1"], undefined)).toThrow("Use npm run");
    expect(() => assertFixtureInvocation([...cli, "start", "--hostname", "0.0.0.0"], "1")).toThrow("127.0.0.1");
    expect(() => assertFixtureInvocation([...cli, "start", "--hostname", "127.0.0.1", "--hostname", "0.0.0.0"], "1")).toThrow("optional --port");
  });
});
