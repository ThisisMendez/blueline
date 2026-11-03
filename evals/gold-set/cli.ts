import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { OpenRouterModelClient } from "../../src/features/analysis/model/openrouter";
import type { ModelClient } from "../../src/features/analysis/model/client";
import { createAnalysisRoute } from "../../src/features/analysis/server/route";
import type { AnalysisOutcome } from "../../src/features/analysis/types";
import { loadGoldSet } from "./corpus";
import { renderGoldReport, scoreGoldRun, type DocumentRun } from "./score";

/**
 * npm run eval:gold. Sends every document in the gold-set manifest through
 * the analysis route exactly as `npm run smoke -- --live` does: the same
 * OpenRouterModelClient with a 30 second timeout, the same counting wrapper
 * and per-document budget, the same anonymous route wiring, and the same
 * request body. Only the documents differ.
 */

const RUNS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "runs");

async function runDocument(text: string, title: string): Promise<{ outcome: AnalysisOutcome | null; returnedFlags: number; providerError: string | null }> {
  const client = new OpenRouterModelClient({ timeoutMs: 30_000 });
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

function toRun(id: string, outcome: AnalysisOutcome | null, returnedFlags: number, providerError: string | null): DocumentRun {
  if (!outcome) return { documentId: id, status: "failed", reason: providerError ?? "route threw" };
  switch (outcome.status) {
    case "reviewed": {
      const lease = outcome.documents.find((document) => document.id === "pasted-lease");
      return {
        documentId: id,
        status: "reviewed",
        reviewedText: lease?.text ?? "",
        flags: outcome.review.riskFlags.map(({ severity, sourceDocumentId, sourceSentence, sourceStart, sourceEnd, consequence }) => ({
          severity, sourceDocumentId, sourceSentence, sourceStart, sourceEnd, consequence,
        })),
        droppedFlagCount: outcome.review.droppedFlagCount,
        returnedFlagsAllAttempts: returnedFlags,
      };
    }
    case "blocked":
      return { documentId: id, status: "blocked", missing: outcome.completeness.missing.map((item) => item.name) };
    default:
      return { documentId: id, status: "failed", reason: `${outcome.reason}${providerError ? `: ${providerError}` : ""}` };
  }
}

async function main() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL) {
    throw new Error("The gold-set eval requires OPENROUTER_API_KEY and OPENROUTER_MODEL. No request sent.");
  }
  const startedAt = new Date();
  const goldSet = loadGoldSet();
  const runs: DocumentRun[] = [];
  for (const document of goldSet.documents) {
    const { outcome, returnedFlags, providerError } = await runDocument(document.text, document.title);
    const run = toRun(document.id, outcome, returnedFlags, providerError);
    console.log(`${document.id}: ${run.status}${run.status === "reviewed" ? `, ${run.flags.length} flag(s), ${run.droppedFlagCount} dropped` : ""}`);
    runs.push(run);
  }
  const report = scoreGoldRun(goldSet, runs);
  const header = [
    `Gold-set eval, ${goldSet.corpus} v${goldSet.version}`,
    `Started: ${startedAt.toISOString()}`,
    `Model: ${process.env.OPENROUTER_MODEL}`,
    "Pipeline: the analysis route as npm run smoke -- --live wires it (anonymous, not persisted).",
  ];
  const text = renderGoldReport(report, header);
  mkdirSync(RUNS_DIR, { recursive: true });
  const stamp = startedAt.toISOString().replaceAll(":", "-");
  writeFileSync(resolve(RUNS_DIR, `${stamp}.txt`), text);
  writeFileSync(resolve(RUNS_DIR, `${stamp}.json`), `${JSON.stringify({
    corpus: goldSet.corpus,
    version: goldSet.version,
    startedAt: startedAt.toISOString(),
    model: process.env.OPENROUTER_MODEL,
    runs: runs.map((run) => (run.status === "reviewed" ? { ...run, reviewedText: undefined } : run)),
    report,
  }, null, 2)}\n`);
  console.log(`\n${text}`);
  console.log(`Saved evals/gold-set/runs/${stamp}.txt and .json`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Gold-set eval failed.");
  process.exitCode = 1;
});
