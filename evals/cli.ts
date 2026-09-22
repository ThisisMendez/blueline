import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { OpenRouterModelClient } from "../src/features/analysis/model/openrouter";
import { runCorpus } from "./run";
import { corpusSchema, recordsSchema, scoreEvaluation, type EvaluationReport } from "./score";

const args = process.argv.slice(2);
function option(name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}
async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}
function markdown(report: EvaluationReport): string {
  const lines = ["# Lease quality evaluation", "", `Expansion decision: ${report.gate}.`, "",
    "This report contains case IDs and counts. Private source text and raw outputs remain in the restricted evidence directory.", "",
    "| Case | Run | Outcome | Verified flags | Serious misses | Unsupported citations | Unsupported claims | Plausible false alarms | Dropped |",
    "| --- | --- | --- | ---: | --- | --- | --- | --- | ---: |"];
  for (const run of report.runs) lines.push(`| ${run.caseId} | ${run.run} | ${run.status} | ${run.verifiedFlags} | ${run.seriousMisses.join(", ") || "none"} | ${run.unsupportedCitations.join(", ") || "none"} | ${run.unsupportedClaims.join(", ") || "none"} | ${run.plausibleFalseAlarms.join(", ") || "none"} | ${run.droppedFlags} |`);
  lines.push("", "## Blocking findings", "", ...(report.reasons.length ? report.reasons.map((reason) => `- ${reason}`) : ["None observed in the supplied evidence."]), "",
    "## Missing evidence", "", ...(report.pending.length ? report.pending.map((reason) => `- ${reason}`) : ["None."]));
  return `${lines.join("\n")}\n`;
}

async function main(): Promise<void> {
  const corpusPath = option("--corpus");
  const corpus = corpusSchema.parse(corpusPath ? await readJson(corpusPath) : { id: "not-supplied", partition: "release", locked: false, cases: [] });
  const outcomesPath = option("--outcomes");
  let records = outcomesPath ? recordsSchema.parse(await readJson(outcomesPath)) : [];
  if (args.includes("--live")) {
    if (!corpusPath || outcomesPath) throw new Error("Live evaluation requires --corpus and cannot take --outcomes.");
    if (!process.env.OPENROUTER_MODEL || !process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_MODEL and OPENROUTER_API_KEY are required.");
    const privateDirectory = option("--private-output");
    const revision = option("--revision");
    if (!privateDirectory || !revision) throw new Error("Live evaluation requires --private-output (existing directory outside this checkout) and --revision.");
    const realDirectory = await realpath(resolve(privateDirectory));
    const relativeDirectory = relative(await realpath(process.cwd()), realDirectory);
    if (!relativeDirectory.startsWith("..") && !isAbsolute(relativeDirectory)) throw new Error("Raw outputs must stay outside the repository.");
    records = (await runCorpus(corpus, new OpenRouterModelClient())).map((record) => ({
      ...record, provenance: { mode: "live", model: process.env.OPENROUTER_MODEL!, revision },
    }));
    await writeFile(resolve(realDirectory, `outcomes-${Date.now()}.json`), JSON.stringify(records, null, 2), { mode: 0o600, flag: "wx" });
  }
  const report = scoreEvaluation(corpus, records);
  const baselinePath = option("--baseline");
  let baseline: unknown = null;
  if (baselinePath) {
    const previous = await readJson(baselinePath) as EvaluationReport;
    if (previous.corpusId !== report.corpusId || !Array.isArray(previous.runs)) throw new Error("Baseline must use the same fixed corpus ID.");
    baseline = { previousGate: previous.gate, previousRuns: previous.runs, currentRuns: report.runs };
  }
  const directory = resolve("evals/runs", new Date().toISOString().replaceAll(":", "-") + `-${process.pid}`);
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, "report.json"), JSON.stringify({ ...report, baseline }, null, 2), { flag: "wx" });
  await writeFile(resolve(directory, "report.md"), markdown(report), { flag: "wx" });
  console.log(`Mode: ${args.includes("--live") ? "live" : outcomesPath ? "score captured outcomes" : "prerequisite check"}`);
  console.log(`Expansion decision: ${report.gate}. Recorded runs: ${report.runs.length}.`);
  console.log(`Report: ${relative(process.cwd(), directory)}`);
  for (const reason of [...report.reasons, ...report.pending]) console.log(reason);
  process.exitCode = report.gate === "passed" ? 0 : report.gate === "blocked" ? 1 : 2;
}

main().catch(() => {
  // Validation details may contain private input. Keep diagnostics off public logs.
  console.error("Evaluation could not run. Check the input schemas, adjudications, environment variables and output directory. No pass was recorded.");
  process.exitCode = 2;
});
