/**
 * Builds a reviewer's worksheets for the calibration batch, and an empty
 * review file to fill in, from the local extracted text.
 *
 *   npx tsx evals/lease-corpus/calibration/worksheet.ts --reviewer R1
 *   npx tsx evals/lease-corpus/calibration/worksheet.ts --reviewer R1 --corpus evals/holdout --documents H02-nycha-pact-lease
 *
 * Writes, all gitignored (they quote the lease):
 *   <corpus>/private/worksheets/<reviewer>/<id>.md   every line and sentence with its character offsets
 *   <corpus>/private/reviews/<reviewer>/<id>.json    an empty review: reviewer id set, no items
 *
 * It never overwrites a review file that already exists, and it never puts
 * a label, a model output or a suggestion in either file.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

export interface Span {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

/** Each line of text[start, end) with its offsets in the whole text; blank lines are skipped. */
export function lines(text: string, start = 0, end = text.length): Span[] {
  const out: Span[] = [];
  let at = start;
  for (const line of text.slice(start, end).split("\n")) {
    if (line.trim()) out.push({ start: at, end: at + line.length, text: line });
    at += line.length + 1;
  }
  return out;
}

/**
 * Sentences in text[start, end): split after ".", "?" or "!" followed by
 * whitespace, and at blank lines. A guide for finding your place, not a rule
 * about what a sentence is: quote exactly what you mean from the text file.
 */
export function sentences(text: string, start = 0, end = text.length): Span[] {
  const out: Span[] = [];
  const slice = text.slice(start, end);
  const boundary = /[.?!][”"’)]*(?=\s)|\n\s*\n/g;
  let from = 0;
  let match: RegExpExecArray | null;
  const push = (to: number) => {
    const raw = slice.slice(from, to);
    const lead = raw.length - raw.trimStart().length;
    const body = raw.trim();
    if (body) out.push({ start: start + from + lead, end: start + from + lead + body.length, text: body });
  };
  while ((match = boundary.exec(slice))) {
    const to = match[0].startsWith("\n") ? match.index : match.index + match[0].length;
    push(to);
    from = to;
  }
  push(slice.length);
  return out;
}

export function renderWorksheet(input: { documentId: string; sha256Text: string; reviewerId: string; text: string; start: number; end: number; scopeNote: string }): string {
  const fence = "````";
  const out = [
    `# Worksheet: ${input.documentId}`,
    "",
    `Reviewer: ${input.reviewerId}. Text SHA-256: ${input.sha256Text} (checked against your local copy when this was made).`,
    `Scope: characters ${input.start} to ${input.end}. ${input.scopeNote}`,
    "",
    "Quote from the text exactly. Offsets count characters from the start of the text file, starting at 0; the end is exclusive.",
    "This worksheet holds no labels and no Blueline output. Don't open evals/lease-corpus/runs/ or run the product on this document until you've finished.",
    "",
    "## Lines",
    "",
  ];
  for (const [index, line] of lines(input.text, input.start, input.end).entries()) {
    out.push(`L${index + 1} [${line.start}, ${line.end})`, fence, line.text, fence, "");
  }
  out.push("## Sentences", "");
  for (const [index, sentence] of sentences(input.text, input.start, input.end).entries()) {
    out.push(`S${index + 1} [${sentence.start}, ${sentence.end})`, fence, sentence.text, fence, "");
  }
  return out.join("\n");
}

interface BatchDocument {
  readonly documentId: string;
  readonly sha256Text: string;
  readonly scope: { readonly start: number; readonly end: number };
  readonly why?: string;
}

function argument(name: string): string | undefined {
  const at = process.argv.indexOf(name);
  return at >= 0 ? process.argv[at + 1] : undefined;
}

function main() {
  const reviewerId = argument("--reviewer");
  if (!reviewerId || !/^[A-Za-z0-9_-]+$/.test(reviewerId)) {
    console.error("Give a pseudonymous reviewer id: --reviewer R1");
    process.exitCode = 2;
    return;
  }
  const corpus = path.resolve(argument("--corpus") ?? "evals/lease-corpus");
  let documents: BatchDocument[];
  if (argument("--documents")) {
    const records = argument("--documents")!.split(",").map((id) => JSON.parse(readFileSync(path.join(corpus, "annotations", `${id}.json`), "utf8")) as { documentId: string; sha256Text: string });
    documents = records.map((record) => ({ documentId: record.documentId, sha256Text: record.sha256Text, scope: { start: 0, end: Number.MAX_SAFE_INTEGER } }));
  } else {
    documents = (JSON.parse(readFileSync(path.resolve("evals/lease-corpus/calibration/batch.json"), "utf8")) as { documents: BatchDocument[] }).documents;
  }
  for (const document of documents) {
    const textFile = path.join(corpus, "text", `${document.documentId}.txt`);
    if (!existsSync(textFile)) {
      console.error(`${document.documentId}: no local text at ${textFile}. Extract it first (evals/lease-corpus/README.md).`);
      process.exitCode = 1;
      continue;
    }
    const text = readFileSync(textFile, "utf8");
    if (sha256(text) !== document.sha256Text) {
      console.error(`${document.documentId}: your text doesn't match the recorded hash, so you'd be labelling different bytes. Stop and tell the adjudicator.`);
      process.exitCode = 1;
      continue;
    }
    const end = Math.min(document.scope.end, text.length);
    const worksheetDir = path.join(corpus, "private", "worksheets", reviewerId);
    mkdirSync(worksheetDir, { recursive: true });
    writeFileSync(path.join(worksheetDir, `${document.documentId}.md`), renderWorksheet({
      documentId: document.documentId, sha256Text: document.sha256Text, reviewerId, text, start: document.scope.start, end,
      scopeNote: document.scope.start === 0 && end === text.length ? "The whole document." : "Label only sentences that start inside this range.",
    }));
    const reviewDir = path.join(corpus, "private", "reviews", reviewerId);
    mkdirSync(reviewDir, { recursive: true });
    const reviewFile = path.join(reviewDir, `${document.documentId}.json`);
    if (!existsSync(reviewFile)) {
      writeFileSync(reviewFile, JSON.stringify({ documentId: document.documentId, sha256Text: document.sha256Text, review: { reviewerId, completedBeforeSeeingModelOutput: null, completedOn: null, items: [] } }, null, 2) + "\n");
    }
    console.log(`${document.documentId}: worksheet and review file ready in ${path.relative(process.cwd(), path.join(corpus, "private"))}/`);
  }
}

if (process.argv[1]?.endsWith(path.join("calibration", "worksheet.ts"))) main();
