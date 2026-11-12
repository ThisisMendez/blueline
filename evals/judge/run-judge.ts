/**
 * Runs the rubric judge repeatedly on the exact same flags with the same
 * configuration, then compares it with the locked human verdicts
 * (decision 5, step 3).
 *
 *   npx tsx evals/judge/run-judge.ts evals/judge/batch-2 [--repeats 3]
 *
 * It refuses to send anything unless:
 * - the human verdicts are locked (<batch>/verdicts.lock.json) and neither
 *   the batch nor the verdicts changed since,
 * - the private selection record exists and matches the batch's hash, and
 * - no flag in the batch comes from a holdout document.
 *
 * The judge sees only the rubric (rubric-v2.md), the reviewer guide and one
 * flag at a time: its document title, severity, quote, consequence and
 * paragraph. Human verdicts are read only after every judge call is done.
 *
 * Model: JUDGE_OPENROUTER_MODEL, or OPENROUTER_MODEL if that isn't set.
 * Never hardcoded. A model judging its own output is a weaker test than an
 * independent judge, and the report says which case applies. The call goes
 * through the product's OpenRouter client, so the provider settings
 * (temperature 0, low reasoning effort, the pinned provider) are the
 * product's; a judge model that provider doesn't serve will fail.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { ModelRequest } from "../../src/features/analysis/model/client";
import { judgeMetrics, renderJudgeMetrics } from "./metrics";
import { checkVerdictLock, humanVerdictsSchema, JUDGE_JSON_SCHEMA, judgeVerdictSchema, sha256, verdictLockSchema, type JudgeVerdict, type Overall } from "./verdicts";

export interface BatchFlag {
  readonly number: number;
  readonly key: string;
  readonly document: string;
  readonly documentTitle: string;
  readonly severity: string;
  readonly quotedSentence: string;
  readonly consequence: string;
  readonly paragraph: string;
}

/** The judge's request for one flag. Only the fields named here reach the model. */
export function buildJudgeRequest(flag: BatchFlag, rubric: string, guide: string): ModelRequest {
  const shown = {
    document: flag.documentTitle,
    severity: flag.severity,
    quotedSentence: flag.quotedSentence,
    consequence: flag.consequence,
    paragraph: flag.paragraph,
  };
  return {
    system: `${rubric.trim()}\n\n---\n\n${guide.trim()}`,
    user: `Judge this flag. Return the six verdicts, the overall verdict and one sentence of rationale.\n\n${JSON.stringify(shown, null, 2)}`,
    schemaName: "flag_verdict",
    jsonSchema: JUDGE_JSON_SCHEMA,
  };
}

export function judgeRefusals(input: {
  lockExists: boolean;
  lockProblems: string[];
  selectionExists: boolean;
  selectionMatches: boolean;
  holdoutDocuments: string[];
  model: string | null;
}): string[] {
  const reasons: string[] = [];
  if (!input.lockExists) reasons.push("human verdicts aren't locked yet: run evals/judge/lock-verdicts.ts after labelling");
  reasons.push(...input.lockProblems);
  if (!input.selectionExists) reasons.push("the private selection record is missing, so controls can't be told from likely failures");
  else if (!input.selectionMatches) reasons.push("the private selection record doesn't match the hash in the batch");
  for (const document of input.holdoutDocuments) reasons.push(`${document} is a holdout document; the judge never runs on the holdout`);
  if (!input.model) reasons.push("no judge model: set JUDGE_OPENROUTER_MODEL (or OPENROUTER_MODEL) in .env.local");
  return reasons;
}

function argument(name: string): string | undefined {
  const at = process.argv.indexOf(name);
  return at >= 0 ? process.argv[at + 1] : undefined;
}

async function main() {
  const dir = path.resolve(process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "evals/judge/batch-2");
  const repeats = Number(argument("--repeats") ?? 3);
  if (!Number.isInteger(repeats) || repeats < 1) throw new Error("--repeats must be a whole number of at least 1");
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");

  const batchRaw = readFileSync(path.join(dir, "batch.json"), "utf8");
  const batch = JSON.parse(batchRaw) as { batch: string; selectionSha256: string; flags: BatchFlag[] };
  const lockPath = path.join(dir, "verdicts.lock.json");
  const verdictsPath = path.join(dir, "verdicts.json");
  const lockExists = existsSync(lockPath) && existsSync(verdictsPath);
  const lockProblems = lockExists ? checkVerdictLock(verdictLockSchema.parse(JSON.parse(readFileSync(lockPath, "utf8"))), batchRaw, readFileSync(verdictsPath, "utf8")) : [];
  const selectionPath = path.resolve("evals/judge/private", `${batch.batch}-selection.json`);
  const selectionRaw = existsSync(selectionPath) ? readFileSync(selectionPath, "utf8") : null;
  const holdoutIds = (JSON.parse(readFileSync("evals/holdout/lock.json", "utf8")) as { documents: { id: string }[] }).documents.map((document) => document.id);
  const judgeModel = process.env.JUDGE_OPENROUTER_MODEL || process.env.OPENROUTER_MODEL || null;
  const reasons = judgeRefusals({
    lockExists,
    lockProblems,
    selectionExists: selectionRaw !== null,
    selectionMatches: selectionRaw !== null && sha256(selectionRaw) === batch.selectionSha256,
    holdoutDocuments: [...new Set(batch.flags.map((flag) => flag.document).filter((document) => holdoutIds.includes(document)))],
    model: judgeModel,
  });
  if (!process.env.OPENROUTER_API_KEY) reasons.push("OPENROUTER_API_KEY isn't set in .env.local");
  if (reasons.length) {
    console.error("Refusing to run the judge:");
    for (const reason of reasons) console.error(`  ${reason}`);
    process.exitCode = 2;
    return;
  }

  const selfJudging = !process.env.JUDGE_OPENROUTER_MODEL || process.env.JUDGE_OPENROUTER_MODEL === process.env.OPENROUTER_MODEL;
  // The product's client reads the model at call time; point it at the judge model for this process only.
  process.env.OPENROUTER_MODEL = judgeModel!;
  const { OpenRouterModelClient } = await import("../../src/features/analysis/model/openrouter");
  const { ModelError } = await import("../../src/features/analysis/model/client");
  const client = new OpenRouterModelClient({ timeoutMs: 60_000 });
  const rubric = readFileSync("evals/judge/rubric-v2.md", "utf8");
  const guide = readFileSync("evals/reviewer-guide.md", "utf8");
  const startedAt = new Date().toISOString();
  const results: { repeat: number; number: number; verdict: JudgeVerdict | null; error: string | null }[] = [];

  for (let repeat = 1; repeat <= repeats; repeat++) {
    for (const flag of batch.flags) {
      let verdict: JudgeVerdict | null = null;
      let error: string | null = null;
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          const parsed = judgeVerdictSchema.safeParse(await client.complete(buildJudgeRequest(flag, rubric, guide)));
          if (parsed.success) { verdict = parsed.data; error = null; } else error = "unreadable: reply didn't match the verdict schema";
          break;
        } catch (caught) {
          const kind = caught instanceof ModelError ? caught.kind : "unavailable";
          error = `${kind}: ${caught instanceof Error ? caught.message : "request failed"}`;
          if (kind !== "rate-limited") break;
          await new Promise((resolve) => setTimeout(resolve, 15_000 * attempt));
        }
      }
      results.push({ repeat, number: flag.number, verdict, error });
      console.log(`repeat ${repeat} flag ${flag.number}: ${verdict?.overall ?? `no verdict (${error})`}`);
    }
  }

  // Only now read the human side.
  const human = humanVerdictsSchema.parse(JSON.parse(readFileSync(verdictsPath, "utf8")));
  const selection = JSON.parse(selectionRaw!) as { flags: { number: number; role: "control" | "likely-fail" }[] };
  const metrics = judgeMetrics({
    human: Object.fromEntries(batch.flags.map((flag) => [flag.number, human.flags[String(flag.number)].overall as Overall])),
    roles: Object.fromEntries(selection.flags.map((flag) => [flag.number, flag.role])),
    repeats: Array.from({ length: repeats }, (_, index) => Object.fromEntries(results.filter((result) => result.repeat === index + 1).map((result) => [result.number, result.verdict?.overall ?? null]))),
  });
  const header = [
    `Judge run on ${batch.batch}, started ${startedAt}`,
    `Judge model ${judgeModel}${selfJudging ? " (the same model that wrote the flags: a weaker test than an independent judge)" : ""}; ${repeats} repeats; rubric-v2.md ${sha256(rubric).slice(0, 12)}; reviewer-guide.md ${sha256(guide).slice(0, 12)}`,
    `Rate-limited calls are retried and, if they never succeed, counted as missing verdicts, not as judge errors.`,
  ];
  const report = renderJudgeMetrics(metrics, header);
  const out = path.join(dir, "judge-runs", `${startedAt.replace(/:/g, "-")}.json`);
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify({ startedAt, batch: batch.batch, judgeModel, selfJudging, repeats, rubricSha256: sha256(rubric), guideSha256: sha256(guide), results, metrics }, null, 2) + "\n");
  console.log(`\n${report}`);
  console.log(`Saved ${path.relative(process.cwd(), out)}`);
}

if (process.argv[1]?.endsWith(path.join("judge", "run-judge.ts"))) void main();
