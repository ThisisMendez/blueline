/**
 * Compares every holdout document against every development lease, every
 * gold-set document and every other holdout document, and prints the
 * result as numbers only (no lease text).
 *
 *   npx tsx evals/holdout/check-duplicates.ts
 *
 * Needs the local, gitignored text in evals/holdout/text/ and
 * evals/lease-corpus/text/. Exits 1 when any pair is a duplicate.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { compare, type Comparison } from "./duplicates";

const holdoutManifest = JSON.parse(readFileSync("evals/holdout/manifest.json", "utf8")) as { documents: { id: string }[] };
const developmentManifest = JSON.parse(readFileSync("evals/lease-corpus/manifest.json", "utf8")) as { documents: { id: string; available: boolean }[] };

const others: { id: string; text: string }[] = [];
for (const document of developmentManifest.documents.filter((entry) => entry.available)) {
  const file = path.join("evals/lease-corpus/text", `${document.id}.txt`);
  if (!existsSync(file)) throw new Error(`Development text missing: ${file}. Run npx tsx evals/lease-corpus/extract.ts first.`);
  others.push({ id: `development:${document.id}`, text: readFileSync(file, "utf8") });
}
for (const dir of ["evals/gold-set/corpus/documents", "evals/gold-set/fixtures"]) {
  for (const name of readdirSync(dir).filter((entry) => entry.endsWith(".txt")).sort()) {
    others.push({ id: `gold-set:${name.replace(/\.txt$/, "")}`, text: readFileSync(path.join(dir, name), "utf8") });
  }
}
const holdout = holdoutManifest.documents.map((document) => {
  const file = path.join("evals/holdout/text", `${document.id}.txt`);
  if (!existsSync(file)) throw new Error(`Holdout text missing: ${file}. Run npx tsx evals/lease-corpus/extract.ts --corpus evals/holdout first.`);
  return { id: document.id, text: readFileSync(file, "utf8") };
});

let duplicates = 0;
const results: Record<string, Comparison[]> = {};
for (const candidate of holdout) {
  const pool = [...others, ...holdout.filter((entry) => entry.id !== candidate.id).map((entry) => ({ id: `holdout:${entry.id}`, text: entry.text }))];
  const comparisons = pool.map((other) => compare(candidate.text, other.id, other.text));
  results[candidate.id] = comparisons;
  const flagged = comparisons.filter((entry) => entry.verdict !== "distinct");
  const highest = comparisons.reduce((max, entry) => Math.max(max, entry.candidateInOther, entry.otherInCandidate), 0);
  console.log(`${candidate.id}: compared with ${comparisons.length}; highest overlap ${highest}`);
  for (const entry of flagged) {
    if (entry.verdict === "duplicate") duplicates++;
    console.log(`  ${entry.verdict.toUpperCase()} ${entry.against}: ${entry.candidateInOther} of the candidate's wording in it, ${entry.otherInCandidate} of its wording in the candidate${entry.sameText ? " (identical text)" : ""}`);
  }
}
if (process.argv.includes("--json")) console.log(JSON.stringify(results, null, 2));
process.exitCode = duplicates > 0 ? 1 : 0;
