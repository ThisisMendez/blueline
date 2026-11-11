/**
 * Checks every annotation record and prints where the corpus stands.
 *
 *   npx tsx evals/lease-corpus/validate.ts
 *
 * Quotes are checked against the local extracted text when it exists
 * (evals/lease-corpus/text/, gitignored). Without it, only the record
 * structure is checked. Exits 1 when any record has a problem.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { annotationRecordSchema, readiness, validateRecord } from "./annotation";

const root = path.resolve("evals/lease-corpus");
let failed = false;
for (const file of readdirSync(path.join(root, "annotations")).filter((name) => name.endsWith(".json")).sort()) {
  const parsed = annotationRecordSchema.safeParse(JSON.parse(readFileSync(path.join(root, "annotations", file), "utf8")));
  if (!parsed.success) {
    failed = true;
    console.log(`${file}: INVALID ${parsed.error.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`).join("; ")}`);
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
