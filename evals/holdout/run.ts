/**
 * Runs the candidate product on the holdout and scores it against the frozen
 * adjudicated labels (decision 1, step 7).
 *
 *   npx tsx evals/holdout/run.ts
 *
 * It refuses to send anything unless:
 * - the lock is intact (every holdout text matches its locked hash, and no
 *   holdout document appears in a development list),
 * - evals/holdout/private/frozen-labels.json exists, and
 * - its hash matches evals/holdout/frozen-labels.seal.json and the lock.
 *
 * Each document goes through the full route, gated, exactly as a signer is
 * served (evals/live-route.ts). One document at a time; a rate-limited
 * document is retried after a wait and, if it stays rate-limited, counted as
 * rate-limited, never as model-unreadable. Output quotes the leases, so it
 * goes to evals/holdout/runs/, which is gitignored.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { AnalysisOutcome } from "../../src/features/analysis/types";
import { verifyFrozen, type FrozenLabels } from "./freeze";
import { checkLock } from "./lock";
import { renderHoldoutReport, scoreHoldout, type CandidateDocument } from "./score";

export function refusalReasons(input: { lockProblems: string[]; frozenExists: boolean; sealExists: boolean; frozenProblems: string[] }): string[] {
  const reasons = [...input.lockProblems];
  if (!input.frozenExists) reasons.push("no frozen labels: real-lease performance stays not measured until adjudicated labels are frozen");
  if (!input.sealExists) reasons.push("no committed seal for the frozen labels");
  reasons.push(...input.frozenProblems);
  return reasons;
}

export function toCandidate(id: string, outcome: AnalysisOutcome | null, providerError: string | null): CandidateDocument {
  if (!outcome) {
    const limited = providerError?.includes("rate-limited") || providerError?.includes("429");
    return { documentId: id, status: limited ? "rate-limited" : "failed", reason: providerError ?? "route threw" };
  }
  switch (outcome.status) {
    case "reviewed": {
      const lease = outcome.documents.find((document) => document.id === "pasted-lease");
      return {
        documentId: id,
        status: "reviewed",
        reviewedText: lease?.text ?? "",
        flags: outcome.review.riskFlags.map(({ severity, sourceSentence, sourceStart, sourceEnd }) => ({ severity, sourceSentence, sourceStart, sourceEnd })),
      };
    }
    case "blocked":
      return { documentId: id, status: "blocked", reason: outcome.completeness.missing.map((item) => item.name).join("; ") };
    case "out-of-scope":
      return { documentId: id, status: "out-of-scope", reason: `${outcome.completeness.agreementKind}: ${outcome.completeness.description}` };
    case "unverified":
      return { documentId: id, status: "unverified", reason: "completeness could not be verified" };
    default: {
      const reason = `${outcome.reason}${providerError ? `: ${providerError}` : ""}`;
      if (outcome.reason === "model-rate-limited") return { documentId: id, status: "rate-limited", reason };
      if (outcome.reason === "model-unreadable") return { documentId: id, status: "model-unreadable", reason };
      return { documentId: id, status: "failed", reason };
    }
  }
}

async function main() {
  const files = await import("./files");
  const lock = files.readLock();
  const lockProblems = checkLock(lock, files.localTextHashes(), files.developmentLists());
  for (const document of lock.documents) {
    if (!existsSync(files.holdoutTextPath(document.id))) lockProblems.push(`${document.id}: text not on this machine`);
  }
  const frozenExists = existsSync(files.FROZEN_PATH);
  const sealExists = existsSync(files.SEAL_PATH);
  const frozenRaw = frozenExists ? readFileSync(files.FROZEN_PATH, "utf8") : null;
  const frozenProblems = frozenRaw && sealExists ? verifyFrozen(frozenRaw, readFileSync(files.SEAL_PATH, "utf8"), lock) : [];
  const reasons = refusalReasons({ lockProblems, frozenExists, sealExists, frozenProblems });
  if (reasons.length) {
    console.error("Refusing to run the product on the holdout:");
    for (const reason of reasons) console.error(`  ${reason}`);
    process.exitCode = 2;
    return;
  }
  const labels = JSON.parse(frozenRaw!) as FrozenLabels;

  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL) {
    console.error("OPENROUTER_API_KEY and OPENROUTER_MODEL must be set in .env.local. No request sent.");
    process.exitCode = 2;
    return;
  }
  const { runDocument } = await import("../live-route");
  const manifest = JSON.parse(readFileSync(files.MANIFEST_PATH, "utf8")) as { documents: { id: string; title: string }[] };
  const startedAt = new Date().toISOString();
  const run: CandidateDocument[] = [];
  for (const document of manifest.documents) {
    const text = readFileSync(files.holdoutTextPath(document.id), "utf8");
    let candidate: CandidateDocument = { documentId: document.id, status: "failed", reason: "not run" };
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { outcome, providerError } = await runDocument(text, document.title, false);
      candidate = toCandidate(document.id, outcome, providerError);
      if (candidate.status !== "rate-limited") break;
      console.log(`${document.id}: rate-limited, waiting before attempt ${attempt + 1}`);
      await new Promise((resolve) => setTimeout(resolve, 30_000 * attempt));
    }
    console.log(`${document.id}: ${candidate.status}`);
    run.push(candidate);
  }
  const report = scoreHoldout(labels, run);
  const out = path.join(files.HOLDOUT_DIR, "runs", `${startedAt.replace(/:/g, "-")}.json`);
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify({ startedAt, model: process.env.OPENROUTER_MODEL, frozenLabels: labels.contentSha256, run, report }, null, 2) + "\n");
  console.log(`\nModel ${process.env.OPENROUTER_MODEL}; frozen labels ${labels.contentSha256}\n`);
  console.log(renderHoldoutReport(report));
  console.log(`Saved ${path.relative(process.cwd(), out)} (gitignored: quotes the leases)`);
}

if (process.argv[1]?.endsWith(path.join("holdout", "run.ts"))) void main();
