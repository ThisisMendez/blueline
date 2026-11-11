/**
 * Checks every annotation record and prints where the corpus stands.
 *
 *   npx tsx evals/lease-corpus/validate.ts
 *   npx tsx evals/lease-corpus/validate.ts --corpus evals/holdout
 *
 * For the holdout, it also checks the private label records in
 * evals/holdout/private/labels/ when they exist (gitignored: they quote the
 * leases).
 *
 * Quotes are checked against the local extracted text when it exists
 * (evals/lease-corpus/text/, gitignored). Without it, only the record
 * structure is checked. Exits 1 when any record has a problem.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { annotationRecordSchema, readiness, validateRecord } from "./annotation";

const corpusAt = process.argv.indexOf("--corpus");
const root = path.resolve(corpusAt >= 0 && process.argv[corpusAt + 1] ? process.argv[corpusAt + 1] : "evals/lease-corpus");
const recordDirs = [path.join(root, "annotations"), path.join(root, "private", "labels")].filter((dir) => existsSync(dir));
let failed = false;
for (const file of recordDirs.flatMap((dir) => readdirSync(dir).filter((name) => name.endsWith(".json")).sort().map((name) => path.join(dir, name)))) {
  const parsed = annotationRecordSchema.safeParse(JSON.parse(readFileSync(file, "utf8")));
  if (!parsed.success) {
    failed = true;
    console.log(`${path.relative(process.cwd(), file)}: INVALID ${parsed.error.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`).join("; ")}`);
    continue;
  }
  const record = parsed.data;
  const textFile = path.join(root, "text", `${record.documentId}.txt`);
  const text = existsSync(textFile) ? readFileSync(textFile, "utf8") : null;
  const problems = validateRecord(record, text);
  if (problems.length) failed = true;
  const split = record.available ? ` [${record.proposedSplit}]` : "";
  console.log(`${record.documentId}${split}: ${readiness(record)}${text === null && record.available ? " (text not extracted here; quotes unchecked)" : ""}`);
  for (const problem of problems) console.log(`  PROBLEM ${problem}`);
}
process.exitCode = failed ? 1 : 0;
