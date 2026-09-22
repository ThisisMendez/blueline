import assert from "node:assert/strict";
import { existsSync } from "node:fs";

import { OpenRouterModelClient } from "../src/features/analysis/model/openrouter";
import type { ModelClient } from "../src/features/analysis/model/client";
import { createAnalysisRoute } from "../src/features/analysis/server/route";
import type { AnalysisOutcome } from "../src/features/analysis/types";
import type { ExtractedDocument } from "../src/features/packet/types";
import { loadFixture, type LeaseFixtureId } from "../tests/fixtures";
import { createFixtureModelClient } from "../tests/support/fixture-model-client";

async function main() {
  const live = process.argv.includes("--live");
  if (live && existsSync(".env.local")) process.loadEnvFile(".env.local");
  console.log(`Smoke mode: ${live ? "LIVE OpenRouter (synthetic fixture, bounded)" : "OFFLINE deterministic model boundary"}`);
  if (live && (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL)) {
    throw new Error("Live smoke requires OPENROUTER_API_KEY and OPENROUTER_MODEL. No request sent.");
  }
  const cases: LeaseFixtureId[] = live
    ? ["adhesion-lease"]
    : ["adhesion-lease", "clean-lease", "referencing-lease"];
  for (const id of cases) {
    const fixture = loadFixture(id);
    const client = live ? new OpenRouterModelClient({ timeoutMs: 30_000 }) : createFixtureModelClient();
    let calls = 0;
    let returnedFlags = 0;
    let providerError: string | null = null;
    const started = Date.now();
    const model: ModelClient = {
      async complete(request) {
        if (++calls > 6 || Date.now() - started > 120_000) throw new Error("Live smoke budget exceeded.");
        let result: unknown;
        try {
          result = await client.complete(request);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Provider request failed";
          providerError = process.env.OPENROUTER_API_KEY
            ? message.replaceAll(process.env.OPENROUTER_API_KEY, "[redacted]")
            : message;
          throw error;
        }
        if (result && typeof result === "object" && "flags" in result && Array.isArray(result.flags)) {
          returnedFlags += result.flags.length;
        }
        return result;
      },
    };
    const route = createAnalysisRoute({
      model,
      accounts: async () => ({ kind: "unconfigured" }),
      store: async () => { throw new Error("Anonymous smoke must never access persistence."); },
      now: () => new Date("2027-02-01T09:00:00Z"),
      newReviewId: () => { throw new Error("Anonymous smoke must never invent an owner or saved review."); },
    });
    const response = await route(new Request("http://localhost/api/analysis", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: fixture.text, title: fixture.sidecar.title }),
    }));
    const outcome = await response.json() as AnalysisOutcome;
    console.log(`Case: ${id}; status: ${outcome.status}; calls: ${calls}; returned flags (all attempts): ${returnedFlags}`);
    if (outcome.status === "failed" || outcome.status === "rejected") {
      console.log(`Verified flags: 0; dropped flags: unavailable; provider/pipeline error: ${outcome.reason}`);
      if (providerError) console.log(`Provider detail: ${providerError}`);
      throw new Error(`Smoke failed: ${outcome.reason}`);
    }
    if (outcome.status === "blocked") {
      console.log(`Verified flags: 0; dropped flags: 0; missing: ${outcome.completeness.missing.map(item => item.name).join(", ")}`);
      if (!live) assert.equal(id, "referencing-lease");
      continue;
    }
    assert.equal(outcome.persisted, false);
    assert.equal(outcome.reviewId, null);
    console.log(`Verified flags: ${outcome.review.riskFlags.length}; dropped flags: ${outcome.review.droppedFlagCount}; clean: ${outcome.review.clean}`);
    for (const flag of outcome.review.riskFlags) {
      const source: ExtractedDocument | undefined = outcome.documents.find(document => document.id === flag.sourceDocumentId);
      assert.ok(source);
      assert.equal(source.text.slice(flag.sourceStart, flag.sourceEnd), flag.sourceSentence);
      assert.ok(source.text.includes(flag.sourceSentence));
      console.log(`[${flag.severity}] ${flag.sourceDocumentId}: ${flag.sourceSentence}`);
    }
    console.log(`Coverage: ${outcome.review.coverage.items.map(item => `${item.topicId}=${item.status}`).join(", ")}`);
    if (!live) {
      assert.notEqual(id, "referencing-lease", "Incomplete packet must block review");
      assert.equal(outcome.review.riskFlags.length, fixture.sidecar.plantedFlags.length);
      assert.equal(outcome.review.clean, id === "clean-lease");
      assert.equal(outcome.review.droppedFlagCount, 0);
    }
  }
  console.log("Smoke passed. This checks pipeline behavior, not independent model quality or deployed database policies.");
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : "Smoke failed.");
  process.exitCode = 1;
});
