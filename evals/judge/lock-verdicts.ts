/**
 * Locks a reviewer's six-part verdicts on a judge batch before any judge run.
 *
 *   npx tsx evals/judge/lock-verdicts.ts evals/judge/batch-2
 *
 * Refuses until every flag has all six verdicts, an overall verdict and a
 * rationale, and refuses to lock twice. Writes <batch>/verdicts.lock.json
 * with the hashes of the batch and the verdicts. Once it exists, the
 * labelling page stops saving, and the judge runner checks both hashes.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { humanVerdictsSchema, incompleteVerdicts, sha256, type VerdictLock } from "./verdicts";

function main() {
  const dir = path.resolve(process.argv[2] ?? "evals/judge/batch-2");
  const batchPath = path.join(dir, "batch.json");
  const verdictsPath = path.join(dir, "verdicts.json");
  const lockPath = path.join(dir, "verdicts.lock.json");
  if (existsSync(lockPath)) {
    console.error(`${path.relative(process.cwd(), lockPath)} exists. Locked verdicts can't be changed.`);
    process.exitCode = 1;
    return;
  }
  if (!existsSync(verdictsPath)) {
    console.error(`No verdicts yet at ${path.relative(process.cwd(), verdictsPath)}. Label the batch first: npm run label -- --batch ${path.relative(process.cwd(), dir)}`);
    process.exitCode = 1;
    return;
  }
  const batchRaw = readFileSync(batchPath, "utf8");
  const verdictsRaw = readFileSync(verdictsPath, "utf8");
  const batch = JSON.parse(batchRaw) as { batch: string; flags: { number: number }[] };
  const verdicts = humanVerdictsSchema.parse(JSON.parse(verdictsRaw));
  const problems = incompleteVerdicts(verdicts, batch.flags.map((flag) => flag.number));
  if (problems.length) {
    console.error("Not locked:");
    for (const problem of problems) console.error(`  ${problem}`);
    process.exitCode = 1;
    return;
  }
  const lock: VerdictLock = {
    batch: batch.batch,
    batchSha256: sha256(batchRaw),
    verdictsSha256: sha256(verdictsRaw),
    reviewerId: verdicts.reviewerId,
    flagCount: batch.flags.length,
    lockedAt: new Date().toISOString(),
    note: "Human verdicts locked before any judge run. The judge runner refuses if either hash stops matching.",
  };
  writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n", { flag: "wx" });
  console.log(`Locked ${batch.flags.length} verdicts by ${verdicts.reviewerId}. Commit ${path.relative(process.cwd(), lockPath)} and verdicts.json together.`);
}

main();
