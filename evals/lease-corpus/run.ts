/**
 * End-to-end residential lease run: every available document in the public
 * lease corpus through the full analysis route (completeness and scope check
 * included), exactly as a signer would be served.
 *
 *   npm run eval:leases
 *
 * Measures what the gold set can't: whether real leases pass the scope
 * check (false blocks), how often they are stopped as incomplete, and what
 * the review returns on real lease language. It is not a gold-standard
 * score: nobody has labelled these documents yet. Outputs quote third-party
 * text, so they go to evals/lease-corpus/runs/, which is gitignored.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { runDocument } from "../live-route";

interface ManifestDocument {
  readonly id: string;
  readonly title: string;
  readonly available: boolean;
}

async function main() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL) {
    console.error("OPENROUTER_API_KEY and OPENROUTER_MODEL must be set in .env.local.");
    process.exitCode = 2;
    return;
  }
  const root = path.resolve("evals/lease-corpus");
  const manifest = JSON.parse(readFileSync(path.join(root, "manifest.json"), "utf8")) as { documents: ManifestDocument[] };
  const startedAt = new Date().toISOString();
  const results = [];
  for (const document of manifest.documents) {
    const file = path.join(root, "text", `${document.id}.txt`);
    if (!document.available || !existsSync(file)) {
      results.push({ id: document.id, status: "not-run", reason: "source unavailable or not extracted" });
      console.log(`${document.id}: not run (source unavailable or not extracted)`);
      continue;
    }
    const text = readFileSync(file, "utf8");
    const { outcome, returnedFlags, providerError } = await runDocument(text, document.title, false);
    if (!outcome) {
      results.push({ id: document.id, status: "failed", reason: providerError });
      console.log(`${document.id}: failed (${providerError})`);
      continue;
    }
    results.push({ id: document.id, returnedFlags, outcome });
    let line = `${document.id}: ${outcome.status}`;
    if (outcome.status === "out-of-scope") line += ` (${outcome.completeness.agreementKind}: ${outcome.completeness.description})  <-- FALSE BLOCK`;
    if (outcome.status === "blocked") line += ` (missing: ${outcome.completeness.missing.map((item) => item.name).join("; ")})`;
    if (outcome.status === "reviewed") line += ` (${outcome.review.riskFlags.length} flags, ${outcome.review.droppedFlagCount} dropped)`;
    if (outcome.status === "failed" || outcome.status === "rejected") line += ` (${outcome.reason}${providerError ? `: ${providerError}` : ""})`;
    console.log(line);
  }
  const ran = results.filter((result) => "outcome" in result);
  const falseBlocks = ran.filter((result) => "outcome" in result && result.outcome?.status === "out-of-scope").length;
  console.log(`\nFalse scope blocks: ${falseBlocks}/${ran.length} leases that ran`);
  mkdirSync(path.join(root, "runs"), { recursive: true });
  const out = path.join(root, "runs", `${startedAt.replace(/[:]/g, "-")}.json`);
  writeFileSync(out, JSON.stringify({ startedAt, model: process.env.OPENROUTER_MODEL, results }, null, 2) + "\n");
  console.log(`Saved ${path.relative(process.cwd(), out)} (gitignored: quotes third-party text)`);
}

void main();
