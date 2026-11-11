/**
 * Turns each downloaded lease source into the plain text Blueline would read.
 *
 *   npx tsx evals/lease-corpus/extract.ts                       # development corpus
 *   npx tsx evals/lease-corpus/extract.ts --corpus evals/holdout  # holdout (evaluation workstream only)
 *
 * Sources live in <corpus>/sources/<id>/ and the text it writes goes to
 * <corpus>/text/<id>.txt. Both folders are gitignored: the repository is
 * public and these are third-party documents. The manifest records each
 * file's SHA-256 so a reviewer can confirm they hold the same bytes.
 *
 * The holdout has its own manifest (evals/holdout/manifest.json) so that
 * `npm run eval:leases`, which runs every available document in this
 * folder's manifest, can never pick a holdout document up.
 *
 * PDFs go through the product's own extractor, so quotation behaves exactly
 * as it does for a signer. Word files go through macOS `textutil`, and web
 * pages through a fixed cut between two markers. Both of those are derived
 * copies and the manifest says so.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

import { extractPdfText } from "../../src/features/packet/extract/pdf";

interface ManifestDocument {
  readonly id: string;
  readonly available: boolean;
  readonly original: string | null;
  readonly extraction: { readonly method: "pdf" | "docx-textutil" | "html-cut"; readonly start?: string; readonly end?: string } | null;
}

export function sha256(bytes: Buffer | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function htmlToText(html: string): string {
  const stripped = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  const decoded = stripped
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&rsquo;/g, "’").replace(/&lsquo;/g, "‘")
    .replace(/&ldquo;/g, "“").replace(/&rdquo;/g, "”").replace(/&ndash;/g, "–").replace(/&mdash;/g, "—");
  return decoded.split("\n").map((line) => line.replace(/[ \t]+/g, " ").trim()).filter(Boolean).join("\n");
}

/** The text for one source file, or the reason there is none. */
export async function extractText(file: string, extraction: NonNullable<ManifestDocument["extraction"]>): Promise<{ text: string } | { problem: string }> {
  const bytes = readFileSync(file);
  if (extraction.method === "pdf") {
    const result = await extractPdfText(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    if (result.kind !== "text") return { problem: `PDF gave ${result.kind}` };
    return { text: result.text };
  }
  if (extraction.method === "docx-textutil") {
    return { text: execFileSync("textutil", ["-convert", "txt", "-stdout", file], { encoding: "utf8" }) };
  }
  const full = htmlToText(bytes.toString("utf8"));
  const start = full.indexOf(extraction.start ?? "");
  const endAt = full.indexOf(extraction.end ?? "", start);
  if (start < 0 || endAt < 0) return { problem: "markers not found" };
  return { text: full.slice(start, endAt).trim() };
}

function corpusRoot(argv: readonly string[]): string {
  const at = argv.indexOf("--corpus");
  return path.resolve(at >= 0 && argv[at + 1] ? argv[at + 1] : "evals/lease-corpus");
}

async function main() {
  const root = corpusRoot(process.argv.slice(2));
  const manifest = JSON.parse(readFileSync(path.join(root, "manifest.json"), "utf8")) as { documents: ManifestDocument[] };
  mkdirSync(path.join(root, "text"), { recursive: true });
  for (const document of manifest.documents) {
    if (!document.available || !document.original || !document.extraction) {
      console.log(`${document.id}: skipped (not available)`);
      continue;
    }
    const file = path.join(root, "sources", document.id, document.original);
    if (!existsSync(file)) {
      console.log(`${document.id}: MISSING ${file}`);
      continue;
    }
    const result = await extractText(file, document.extraction);
    if ("problem" in result) {
      console.log(`${document.id}: ${result.problem}`);
      continue;
    }
    writeFileSync(path.join(root, "text", `${document.id}.txt`), result.text);
    console.log(`${document.id}: original sha256 ${sha256(readFileSync(file))}; text sha256 ${sha256(result.text)}; ${result.text.length} characters`);
  }
}

// Run only from the command line, so tests can import the helpers.
if (process.argv[1]?.endsWith(path.join("lease-corpus", "extract.ts"))) void main();
