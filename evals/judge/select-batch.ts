/**
 * Builds the failure-enriched judge batch (decision 5, step 1).
 *
 *   npx tsx evals/judge/select-batch.ts
 *
 * Draws only on development material: the gold-set run records in
 * evals/gold-set/runs/. Development-lease outputs exist only for L01 and
 * L08, the calibration documents, and reviewers must never see model output
 * for a document they label, so they are left out.
 *
 * Writes two files:
 * - evals/judge/batch-2/batch.json: what the human reviewer and the judge
 *   see. Each flag's document, severity, quote, consequence and paragraph.
 *   No selection reason, no planted-clause match, no verdict.
 * - evals/judge/private/batch-2-selection.json (gitignored): why each flag
 *   was picked. The batch records this file's hash, so it can be checked
 *   later without the reviewer seeing it before they finish.
 *
 * "Likely to fail" is a selection heuristic, never a label. Every verdict
 * comes from the human reviewer.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { loadGoldSet, type GoldDocument } from "../gold-set/corpus";

export const SOURCE_RUNS = [
  "evals/gold-set/runs/2026-11-11T19-22-55.421Z-ungated.json",
  "evals/gold-set/runs/2026-11-11T19-26-35.335Z-ungated.json",
  "evals/gold-set/runs/2026-11-11T19-30-15.073Z-ungated.json",
  "evals/gold-set/runs/2026-11-11T19-41-25.597Z-ungated.json",
] as const;
const PREVIOUSLY_LABELLED = "evals/labels/flags.json";
const BATCH_PATH = "evals/judge/batch-2/batch.json";
const SELECTION_PATH = "evals/judge/private/batch-2-selection.json";
const SEED = 20261111;
export const LIKELY_FAIL_TARGET = 12;
export const CONTROL_TARGET = 6;

export type Reason =
  | "on a clean document"
  | "on an unusual-but-harmless sentence"
  | "ordinary payment, matches no planted clause"
  | "matches no planted clause"
  | "control: matches a planted in-scope clause graded critical or high";

export interface PoolFlag {
  readonly key: string;
  readonly document: string;
  readonly documentTitle: string;
  readonly severity: string;
  readonly quotedSentence: string;
  readonly consequence: string;
  readonly paragraph: string;
  readonly position: number;
  readonly sourceRun: string;
  readonly reason: Reason | null;
}

const PAYMENT = /\b(pay|pays|paid|payable|payment|fee|fees|dues|charge|charges|charged|price|tuition|rent|deposit|bill|billed)\b/i;

export function flagKey(document: string, sentence: string): string {
  return createHash("sha256").update(`${document}\n${sentence}`).digest("hex").slice(0, 16);
}

function overlaps(a: [number, number], b: [number, number]): boolean {
  return a[0] < b[1] && b[0] < a[1];
}

function spanIn(text: string, sentence: string): [number, number] | null {
  const at = text.indexOf(sentence);
  return at < 0 ? null : [at, at + sentence.length];
}

const BAND_RANK: Record<string, number> = { critical: 3, high: 2, moderate: 1 };

/** Why a flag might be picked, from the gold set's own inventory; null when it's neither a candidate nor a control. */
export function classify(document: GoldDocument, sentence: string): Reason | null {
  const at = spanIn(document.text, sentence);
  if (!at) return null;
  if (document.benign) return "on a clean document";
  if (document.unusualButHarmless.some((harmless) => { const span = spanIn(document.text, harmless); return span !== null && overlaps(span, at); })) {
    return "on an unusual-but-harmless sentence";
  }
  const planted = document.plantedClauses.filter((clause) => { const span = spanIn(document.text, clause.sourceSentence); return span !== null && overlaps(span, at); });
  if (planted.length === 0) return PAYMENT.test(sentence) ? "ordinary payment, matches no planted clause" : "matches no planted clause";
  const inScope = planted.filter((clause) => !["non-compete", "limitation-of-liability", "indemnification"].includes(clause.clauseType));
  if (inScope.some((clause) => (BAND_RANK[clause.expectedSeverityBand] ?? 0) >= 2)) return "control: matches a planted in-scope clause graded critical or high";
  return null;
}

/** Mulberry32: a small seeded generator, so the order is the same every time. */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Takes up to `count`, one per document per pass (documents alphabetical, earliest position first). */
export function spread(flags: readonly PoolFlag[], count: number): PoolFlag[] {
  const byDocument = new Map<string, PoolFlag[]>();
  for (const flag of [...flags].sort((a, b) => a.document.localeCompare(b.document) || a.position - b.position)) {
    byDocument.set(flag.document, [...(byDocument.get(flag.document) ?? []), flag]);
  }
  const out: PoolFlag[] = [];
  while (out.length < count && [...byDocument.values()].some((list) => list.length)) {
    for (const list of byDocument.values()) {
      const next = list.shift();
      if (next && out.length < count) out.push(next);
    }
  }
  return out;
}

/** Fills the likely-fail quota in the order of the reasons, each spread across documents. */
export function pickLikelyFail(pool: readonly PoolFlag[], target: number): PoolFlag[] {
  const order: Reason[] = ["on a clean document", "on an unusual-but-harmless sentence", "ordinary payment, matches no planted clause", "matches no planted clause"];
  const caps: Record<string, number> = { "on a clean document": 4, "on an unusual-but-harmless sentence": 3, "ordinary payment, matches no planted clause": 3 };
  const out: PoolFlag[] = [];
  for (const reason of order) {
    const room = target - out.length;
    if (room <= 0) break;
    out.push(...spread(pool.filter((flag) => flag.reason === reason), Math.min(room, caps[reason] ?? room)));
  }
  return out;
}

function main() {
  const gold = loadGoldSet();
  const documents = new Map(gold.documents.map((document) => [document.id, document]));
  const labelled = new Set((JSON.parse(readFileSync(PREVIOUSLY_LABELLED, "utf8")) as { flags: { document: string; quotedSentence: string }[] }).flags.map((flag) => flagKey(flag.document, flag.quotedSentence)));
  const pool = new Map<string, PoolFlag>();
  for (const runPath of SOURCE_RUNS) {
    const run = JSON.parse(readFileSync(runPath, "utf8")) as { runs: { documentId: string; status: string; flags?: { severity: string; sourceSentence: string; consequence: string }[] }[] };
    for (const result of run.runs) {
      if (result.status !== "reviewed" || !result.flags) continue;
      const document = documents.get(result.documentId);
      if (!document) continue;
      for (const flag of result.flags) {
        const key = flagKey(document.id, flag.sourceSentence);
        const position = document.text.indexOf(flag.sourceSentence);
        if (position < 0 || pool.has(key) || labelled.has(key)) continue;
        const paragraph = document.text.split("\n").find((line) => line.includes(flag.sourceSentence)) ?? flag.sourceSentence;
        pool.set(key, {
          key, document: document.id, documentTitle: document.title, severity: flag.severity, quotedSentence: flag.sourceSentence,
          consequence: flag.consequence, paragraph, position, sourceRun: runPath, reason: classify(document, flag.sourceSentence),
        });
      }
    }
  }
  const all = [...pool.values()];
  const likelyFail = pickLikelyFail(all, LIKELY_FAIL_TARGET);
  const controls = spread(all.filter((flag) => flag.reason?.startsWith("control")), CONTROL_TARGET);
  const chosen = seededShuffle([...likelyFail, ...controls], SEED);

  const selection = {
    batch: "batch-2",
    note: "Private. Why each flag was picked. A selection heuristic, not a label: the human reviewer decides every verdict. Don't show this to the reviewer before their verdicts are locked.",
    seed: SEED,
    sourceRuns: SOURCE_RUNS,
    poolSize: all.length,
    excludedAsPreviouslyLabelled: labelled.size,
    flags: chosen.map((flag, index) => ({ number: index + 1, key: flag.key, document: flag.document, sourceRun: flag.sourceRun, reason: flag.reason, role: flag.reason?.startsWith("control") ? "control" : "likely-fail" })),
  };
  const selectionText = JSON.stringify(selection, null, 2) + "\n";
  const batch = {
    batch: "batch-2",
    form: "six-part",
    title: "Failure-enriched judge batch",
    createdOn: new Date().toISOString().slice(0, 10),
    source: "Flags from four ungated gold-set runs (development material only). The gold-set documents aren't leases; see evals/judge/README.md for how to treat scope.",
    model: "z-ai/glm-5.3-flash",
    selectionSha256: createHash("sha256").update(selectionText).digest("hex"),
    flags: chosen.map((flag, index) => ({
      number: index + 1, key: flag.key, document: flag.document, documentTitle: flag.documentTitle, severity: flag.severity,
      quotedSentence: flag.quotedSentence, consequence: flag.consequence, paragraph: flag.paragraph,
    })),
  };
  if (existsSync(BATCH_PATH) && !process.argv.includes("--force")) {
    console.error(`${BATCH_PATH} exists. The batch is fixed once a reviewer may have seen it; pass --force only before anyone has.`);
    process.exitCode = 1;
    return;
  }
  mkdirSync(path.dirname(BATCH_PATH), { recursive: true });
  mkdirSync(path.dirname(SELECTION_PATH), { recursive: true });
  writeFileSync(BATCH_PATH, JSON.stringify(batch, null, 2) + "\n");
  writeFileSync(SELECTION_PATH, selectionText);
  console.log(`Pool ${all.length} flags (after leaving out the ${labelled.size} labelled before). Picked ${likelyFail.length} likely to fail and ${controls.length} controls.`);
  console.log(`Wrote ${BATCH_PATH} and ${SELECTION_PATH} (private).`);
}

if (process.argv[1]?.endsWith(path.join("judge", "select-batch.ts"))) main();
