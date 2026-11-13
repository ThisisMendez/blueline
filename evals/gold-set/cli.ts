import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { runDocument } from "../live-route";
import { emptyReplyValidationTally, observeReplyValidation, recordReplyValidation } from "../../src/features/analysis/model/structured";
import type { AnalysisOutcome } from "../../src/features/analysis/types";
import { loadGoldSet } from "./corpus";
import { loadLabelOverlay, overlayProblems } from "./label-overlay";
import { renderGoldReport, scoreGoldRun, type DocumentRun } from "./score";

/**
 * npm run eval (ungated) and npm run eval:gated. Sends every document in the gold-set manifest through
 * the analysis route exactly as `npm run smoke -- --live` does: the same
 * OpenRouterModelClient with a 30 second timeout, the same counting wrapper
 * and per-document budget, the same anonymous route wiring, and the same
 * request body. Only the documents differ.
 *
 * `--ungated` skips one step: the completeness check. Each document goes
 * straight to runGeneralReview, the same review stage the route calls once a
 * packet is complete, with the same packet shape, model client and budget.
 * It exists because most gold-set documents refer to schedules the set does
 * not include, and the gate correctly stops those before review. An ungated
 * run is not how a signer is served; its report says so in the header.
 */

const RUNS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "runs");

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
        legalClaims: outcome.review.legalClaims,
        returnedFlagsAllAttempts: returnedFlags,
      };
    }
    case "blocked":
      return { documentId: id, status: "blocked", missing: outcome.completeness.missing.map((item) => item.name) };
    case "out-of-scope":
      return { documentId: id, status: "out-of-scope", agreementKind: outcome.completeness.agreementKind, description: outcome.completeness.description };
    case "unverified":
      return { documentId: id, status: "unverified" };
    default:
      return { documentId: id, status: "failed", reason: `${outcome.reason}${providerError ? `: ${providerError}` : ""}` };
  }
}

async function main() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL) {
    throw new Error("The gold-set eval requires OPENROUTER_API_KEY and OPENROUTER_MODEL. No request sent.");
  }
  const ungated = process.argv.includes("--ungated");
  const startedAt = new Date();
  const goldSet = loadGoldSet();
  const { overlay, sha256: overlaySha256 } = loadLabelOverlay();
  const problems = overlayProblems(goldSet, overlay);
  if (problems.length) throw new Error(`label-corrections.json does not check out:\n${problems.join("\n")}`);
  const runs: DocumentRun[] = [];
  // Malformed-reply counts (ticket 22): first-pass validation failures, retry recoveries, still invalid.
  const replies = emptyReplyValidationTally();
  for (const document of goldSet.documents) {
    const tally = emptyReplyValidationTally();
    const stop = observeReplyValidation((event) => { recordReplyValidation(tally, event); recordReplyValidation(replies, event); });
    const { outcome, returnedFlags, providerError } = await runDocument(document.text, document.title, ungated);
    stop();
    const run = toRun(document.id, outcome, returnedFlags, providerError);
    const replyNote = tally.firstPassFailures > 0 ? `  [replies: ${tally.firstPassFailures} first-pass invalid, ${tally.recovered} recovered]` : "";
    console.log(`${document.id}: ${run.status}${run.status === "reviewed" ? `, ${run.flags.length} flag(s), ${run.droppedFlagCount} dropped` : ""}${replyNote}`);
    runs.push(run);
  }
  const unreadable = runs.filter((run) => run.status === "failed" && /unreadable/.test(run.reason)).length;
  const replyLine = `Malformed replies: ${replies.firstPassFailures} first-pass invalid, ${replies.recovered} recovered by retry, ${replies.unrecovered} still invalid; model-unreadable: ${unreadable}/${runs.length} documents`;
  const report = scoreGoldRun(goldSet, runs, overlay);
  const header = [
    `Gold-set eval, ${goldSet.corpus} v${goldSet.version}`,
    `Started: ${startedAt.toISOString()}`,
    `Model: ${process.env.OPENROUTER_MODEL}`,
    `Label overlay: label-corrections.json, SHA-256 ${overlaySha256} (uses the approved Low forfeiture rule)`,
    ungated
      ? "Pipeline: UNGATED. The completeness check was skipped and each document went straight to runGeneralReview. This is not how a signer is served."
      : "Pipeline: the analysis route as npm run smoke -- --live wires it (anonymous, not persisted).",
    replyLine,
  ];
  const text = renderGoldReport(report, header);
  mkdirSync(RUNS_DIR, { recursive: true });
  const stamp = `${startedAt.toISOString().replaceAll(":", "-")}${ungated ? "-ungated" : ""}`;
  writeFileSync(resolve(RUNS_DIR, `${stamp}.txt`), text);
  writeFileSync(resolve(RUNS_DIR, `${stamp}.json`), `${JSON.stringify({
    corpus: goldSet.corpus,
    version: goldSet.version,
    startedAt: startedAt.toISOString(),
    model: process.env.OPENROUTER_MODEL,
    ungated,
    labelOverlaySha256: overlaySha256,
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
