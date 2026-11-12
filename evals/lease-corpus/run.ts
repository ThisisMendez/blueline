/**
 * End-to-end residential lease run: the development documents of the public
 * lease corpus through the full analysis route (completeness and scope check
 * included), exactly as a signer would be served.
 *
 *   npm run eval:leases                  one pass over the development leases
 *   npm run eval:leases -- --repeat 3    three passes, plus a repeatability summary
 *   npm run eval:leases -- --only L03    one document (id prefix), any repeat count
 *
 * Measures what the gold set can't: whether real leases pass the scope
 * check (false blocks), how often they are stopped as incomplete, whether
 * the missing-document list is the same from run to run (decision 3), and
 * how often a model reply arrives in the wrong shape and is recovered
 * (decision 6). It is not a gold-standard score: nobody has labelled these
 * documents yet. Outputs quote third-party text, so they go to
 * evals/lease-corpus/runs/, which is gitignored.
 *
 * Only the development documents are run (coordination file, 2026-11-11).
 * The holdout is never touched here, whatever manifest.json says is available.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  emptyReplyValidationTally,
  observeReplyValidation,
  recordReplyValidation,
  type ReplyValidationTally,
} from "../../src/features/analysis/model/structured";
import type { AnalysisOutcome } from "../../src/features/analysis/types";
import { runDocument } from "../live-route";

interface ManifestDocument {
  readonly id: string;
  readonly title: string;
  readonly available: boolean;
}

/** The only documents this runner may touch. */
const DEVELOPMENT = [
  "L01-philadelphia-fair-lease",
  "L03-hud-family-model-lease",
  "L07-cu-boulder-grad-family-lease",
  "L08-maine-ag-model-lease",
  "L10-ohio-u-ecohouse-lease",
] as const;

/**
 * The documents each development lease requires and does not include, by
 * the completeness workstream's own reading of the extracted text
 * (2026-11-11). Not adjudicated labels: a working check on the missing list,
 * one pattern per required document, so a run can be scored for wrong,
 * absent and duplicate entries. An empty list means the lease requires no
 * document it does not include, so it should be reviewed.
 */
const EXPECTED_MISSING: Readonly<Record<string, readonly { readonly label: string; readonly pattern: RegExp }[]>> = {
  // "List of Addenda to the Lease" is a blank field; the lead-pipe pamphlet
  // is a notice the tenant is advised to read; "future addenda" don't exist yet.
  "L01-philadelphia-fair-lease": [],
  // Section 43 lists three attachments under "Required:"; Nos. 4 to 10 are "If Applicable".
  "L03-hud-family-model-lease": [
    { label: "Owner's certification (HUD-50059), Attachment 1", pattern: /50059|owner.s certification/i },
    { label: "Unit Inspection Report, Attachment 2", pattern: /inspection report/i },
    { label: "VAWA Lease Addendum (HUD-91067), Attachment 3", pattern: /91067|vawa/i },
  ],
  // Section 15 incorporates four policies by reference and makes them part of
  // the lease. The Occupant Agreement and a weapons addendum are conditional.
  "L07-cu-boulder-grad-family-lease": [
    { label: "Graduate & Family Housing Resident Handbook", pattern: /handbook/i },
    { label: "Student Code of Conduct Policies and Procedures", pattern: /code of conduct/i },
    { label: "OIEC Resolution Procedures", pattern: /institutional equity|resolution procedures/i },
    { label: "Campus Use of University Facilities policy", pattern: /campus use|cuuf/i },
  ],
  // Rules are written into the lease itself.
  "L08-maine-ag-model-lease": [],
  // The tenant must comply with the Student Code of Conduct. The lease
  // application is the tenant's own submission, not a term of the lease.
  "L10-ohio-u-ecohouse-lease": [
    { label: "Ohio University Student Code of Conduct", pattern: /code of conduct/i },
  ],
};

const RATE_LIMIT_WAIT_MS = 30_000;
const RATE_LIMIT_ATTEMPTS = 4;

function argument(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

function isRateLimited(outcome: AnalysisOutcome | null, providerError: string | null): boolean {
  if (outcome?.status === "failed" && outcome.reason === "model-rate-limited") return true;
  if (outcome && outcome.status !== "failed") return false;
  return /rate.?limit|429/i.test(providerError ?? "");
}

/** What a run showed the signer, reduced to something two runs can be compared on. */
function signature(outcome: AnalysisOutcome | null, providerError: string | null): string {
  if (!outcome) return `failed: ${providerError ?? "unknown"}`;
  if (outcome.status === "blocked") return `blocked: ${outcome.completeness.missing.map((item) => item.name).join(" | ")}`;
  if (outcome.status === "failed" || outcome.status === "rejected") return `${outcome.status}: ${outcome.reason}`;
  return outcome.status;
}

interface Accuracy {
  readonly exact: boolean;
  readonly duplicates: number;
  readonly unexpected: readonly string[];
  readonly absent: readonly string[];
}

/** Scores a missing list against the reading above. */
function accuracy(id: string, outcome: AnalysisOutcome | null): Accuracy | null {
  const expected = EXPECTED_MISSING[id];
  if (!expected || !outcome) return null;
  if (outcome.status !== "blocked" && outcome.status !== "reviewed") return null;
  const names = outcome.status === "blocked" ? outcome.completeness.missing.map((item) => item.name) : [];
  const hits = expected.map(() => 0);
  const unexpected: string[] = [];
  for (const name of names) {
    const index = expected.findIndex((entry) => entry.pattern.test(name));
    if (index < 0) unexpected.push(name);
    else hits[index] += 1;
  }
  const duplicates = hits.reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  const absent = expected.filter((_, index) => hits[index] === 0).map((entry) => entry.label);
  return { exact: duplicates === 0 && unexpected.length === 0 && absent.length === 0, duplicates, unexpected, absent };
}

function describe(outcome: AnalysisOutcome, providerError: string | null): string {
  let line: string = outcome.status;
  if (outcome.status === "out-of-scope") line += ` (${outcome.completeness.agreementKind}: ${outcome.completeness.description})  <-- FALSE BLOCK`;
  if (outcome.status === "blocked") line += ` (missing: ${outcome.completeness.missing.map((item) => item.name).join("; ")})`;
  if (outcome.status === "reviewed") line += ` (${outcome.review.riskFlags.length} flags, ${outcome.review.droppedFlagCount} dropped; legal-conclusion texts ${outcome.review.legalClaims?.repaired ?? 0} repaired, ${outcome.review.legalClaims?.withheld ?? 0} withheld)`;
  if (outcome.status === "failed" || outcome.status === "rejected") line += ` (${outcome.reason}${providerError ? `: ${providerError}` : ""})`;
  return line;
}

function tallyLine(tally: ReplyValidationTally): string {
  const bySchema = Object.entries(tally.failuresBySchema).map(([schema, count]) => `${schema} ${count}`).join(", ");
  return `${tally.firstPassFailures} first-pass invalid, ${tally.recovered} recovered by retry, ${tally.unrecovered} still invalid${bySchema ? ` [${bySchema}]` : ""}`;
}

async function main() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL) {
    console.error("OPENROUTER_API_KEY and OPENROUTER_MODEL must be set in .env.local.");
    process.exitCode = 2;
    return;
  }
  const repeat = Math.max(1, Number(argument("--repeat") ?? "1") || 1);
  const only = argument("--only");

  const root = path.resolve("evals/lease-corpus");
  const manifest = JSON.parse(readFileSync(path.join(root, "manifest.json"), "utf8")) as { documents: ManifestDocument[] };
  const documents = manifest.documents.filter((document) =>
    (DEVELOPMENT as readonly string[]).includes(document.id) && (!only || document.id.startsWith(only)));
  const startedAt = new Date().toISOString();

  const runs: { run: number; results: unknown[] }[] = [];
  const signatures = new Map<string, string[]>();
  const overall = emptyReplyValidationTally();
  let attempted = 0;
  let unreadable = 0;
  let rateLimitedLeft = 0;
  let duplicates = 0;

  for (let run = 1; run <= repeat; run += 1) {
    console.log(`\n=== Run ${run} of ${repeat} ===`);
    const results: unknown[] = [];
    const perRun = emptyReplyValidationTally();
    let runAttempted = 0;
    let runUnreadable = 0;
    for (const document of documents) {
      const file = path.join(root, "text", `${document.id}.txt`);
      if (!document.available || !existsSync(file)) {
        results.push({ id: document.id, status: "not-run", reason: "source unavailable or not extracted" });
        console.log(`${document.id}: not run (source unavailable or not extracted)`);
        continue;
      }
      const text = readFileSync(file, "utf8");

      // Rate limiting is the provider's condition, not the model's answer:
      // wait and run the document again rather than count it.
      let attempt = 0;
      let result: Awaited<ReturnType<typeof runDocument>>;
      let tally: ReplyValidationTally;
      for (;;) {
        attempt += 1;
        tally = emptyReplyValidationTally();
        const stop = observeReplyValidation((event) => recordReplyValidation(tally, event));
        try {
          result = await runDocument(text, document.title, false);
        } finally {
          stop();
        }
        if (!isRateLimited(result.outcome, result.providerError) || attempt >= RATE_LIMIT_ATTEMPTS) break;
        console.log(`${document.id}: rate-limited, waiting ${RATE_LIMIT_WAIT_MS / 1000}s and running it again`);
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_WAIT_MS));
      }
      const { outcome, returnedFlags, providerError } = result;

      if (isRateLimited(outcome, providerError)) {
        rateLimitedLeft += 1;
        results.push({ id: document.id, status: "rate-limited", reason: providerError, replyValidation: tally });
        console.log(`${document.id}: rate-limited after ${attempt} attempts (provider condition; not counted)`);
        continue;
      }

      for (const key of ["firstPassFailures", "recovered", "unrecovered"] as const) {
        perRun[key] += tally[key];
        overall[key] += tally[key];
      }
      for (const [schema, count] of Object.entries(tally.failuresBySchema)) {
        perRun.failuresBySchema[schema] = (perRun.failuresBySchema[schema] ?? 0) + count;
        overall.failuresBySchema[schema] = (overall.failuresBySchema[schema] ?? 0) + count;
      }
      runAttempted += 1;
      if (outcome?.status === "failed" && outcome.reason === "model-unreadable") runUnreadable += 1;

      const score = accuracy(document.id, outcome);
      duplicates += score?.duplicates ?? 0;
      const seen = signatures.get(document.id) ?? [];
      seen.push(signature(outcome, providerError));
      signatures.set(document.id, seen);

      results.push({ id: document.id, returnedFlags, outcome, providerError, replyValidation: tally, accuracy: score });
      let line = `${document.id}: ${outcome ? describe(outcome, providerError) : `failed (${providerError})`}`;
      if (tally.firstPassFailures > 0) line += `  [replies: ${tallyLine(tally)}]`;
      if (score && !score.exact) {
        line += `  [vs reading: ${[
          score.duplicates ? `${score.duplicates} duplicate` : "",
          score.unexpected.length ? `unexpected ${score.unexpected.join("; ")}` : "",
          score.absent.length ? `absent ${score.absent.join("; ")}` : "",
        ].filter(Boolean).join(", ")}]`;
      }
      console.log(line);
    }
    attempted += runAttempted;
    unreadable += runUnreadable;
    console.log(`Run ${run}: model-unreadable ${runUnreadable}/${runAttempted}; replies ${tallyLine(perRun)}`);
    runs.push({ run, results });
  }

  const ran = runs.flatMap((entry) => entry.results).filter((result) => typeof result === "object" && result !== null && "outcome" in result) as { outcome: AnalysisOutcome | null }[];
  const falseBlocks = ran.filter((result) => result.outcome?.status === "out-of-scope").length;
  console.log(`\nFalse scope blocks: ${falseBlocks}/${ran.length} lease runs`);
  console.log(`Model-unreadable: ${unreadable}/${attempted} document runs; replies ${tallyLine(overall)}`);
  if (rateLimitedLeft > 0) console.log(`Rate-limited and not counted: ${rateLimitedLeft}`);
  console.log(`Duplicate missing entries across all runs: ${duplicates}`);

  if (repeat > 1) {
    console.log("\nRepeatability (what the signer saw, run by run):");
    let identical = 0;
    let compared = 0;
    for (const [id, seen] of signatures) {
      if (seen.length < 2) continue;
      compared += 1;
      const same = seen.every((value) => value === seen[0]);
      if (same) identical += 1;
      console.log(`  ${same ? "same" : "DIFFERENT"}  ${id}`);
      if (!same) seen.forEach((value, index) => console.log(`      run ${index + 1}: ${value}`));
    }
    console.log(`Identical on every repeat: ${identical}/${compared} documents`);
  }

  mkdirSync(path.join(root, "runs"), { recursive: true });
  const out = path.join(root, "runs", `${startedAt.replace(/[:]/g, "-")}${repeat > 1 ? `-x${repeat}` : ""}.json`);
  writeFileSync(out, JSON.stringify({ startedAt, model: process.env.OPENROUTER_MODEL, repeat, replyValidation: overall, runs }, null, 2) + "\n");
  console.log(`Saved ${path.relative(process.cwd(), out)} (gitignored: quotes third-party text)`);
}

void main();
