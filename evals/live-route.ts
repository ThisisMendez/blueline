/**
 * Runs one document through the analysis route exactly as
 * `npm run smoke -- --live` does: the same OpenRouterModelClient with a 30
 * second timeout, the same call budget (7 calls, 120 s; 6 before the legal-claim repair call, ticket 14), the same anonymous
 * route wiring and request body. Shared by the gold-set eval and the public
 * lease corpus so both measure the same pipeline.
 */
import { OpenRouterModelClient } from "../src/features/analysis/model/openrouter";
import { ModelError, type ModelClient } from "../src/features/analysis/model/client";
import { runGeneralReview } from "../src/features/analysis/review";
import { createAnalysisRoute } from "../src/features/analysis/server/route";
import type { AnalysisOutcome } from "../src/features/analysis/types";

export async function runDocument(text: string, title: string, ungated: boolean): Promise<{ outcome: AnalysisOutcome | null; returnedFlags: number; providerError: string | null }> {
  const client = new OpenRouterModelClient({ timeoutMs: 30_000 });
  let calls = 0;
  let shapeRetries = 0;
  let returnedFlags = 0;
  let providerError: string | null = null;
  const started = Date.now();
  const model: ModelClient = {
    async complete(request) {
      // A retry after a malformed reply (structured.ts, ticket 22) has its own
      // allowance, so a recovered reply can't push a document over 7 calls.
      const overBudget = request.retryAfterInvalidReply ? ++shapeRetries > 2 : ++calls > 7;
      if (overBudget || Date.now() - started > 150_000) throw new Error("Live smoke budget exceeded.");
      let result: unknown;
      try {
        result = await client.complete(request);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Provider request failed";
        providerError = process.env.OPENROUTER_API_KEY ? message.replaceAll(process.env.OPENROUTER_API_KEY, "[redacted]") : message;
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
    store: async () => { throw new Error("Anonymous eval must never access persistence."); },
    now: () => new Date("2027-02-01T09:00:00Z"),
    newReviewId: () => { throw new Error("Anonymous eval must never invent an owner or saved review."); },
  });
  if (ungated) {
    const documents = [{ id: "pasted-lease", title, text }];
    try {
      const review = await runGeneralReview({ packet: { documents }, model });
      return {
        outcome: {
          status: "reviewed", reviewId: null, persisted: false, retention: null, persistenceFailed: false,
          documents, completeness: { kind: "complete", references: [] } as never, review,
        },
        returnedFlags,
        providerError,
      };
    } catch (error) {
      if (!(error instanceof ModelError)) throw error;
      return { outcome: null, returnedFlags, providerError: `${error.kind}: ${providerError ?? error.message}` };
    }
  }
  try {
    const response = await route(new Request("http://localhost/api/analysis", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, title }),
    }));
    return { outcome: (await response.json()) as AnalysisOutcome, returnedFlags, providerError };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Route threw";
    return { outcome: null, returnedFlags, providerError: providerError ?? message };
  }
}
