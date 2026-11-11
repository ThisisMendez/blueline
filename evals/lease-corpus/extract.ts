/**
 * Turns each downloaded lease source into the plain text Blueline would read.
 *
 *   npx tsx evals/lease-corpus/extract.ts
 *
 * Sources live in evals/lease-corpus/sources/<id>/ and the text it writes
 * goes to evals/lease-corpus/text/<id>.txt. Both folders are gitignored:
 * the repository is public and these are third-party documents. The
 * manifest records each file's SHA-256 so a reviewer can confirm they hold
 * the same bytes.
 *
 * PDFs go through the product's own extractor, so quotation behaves exactly
 * as it does for a signer. Word files go through macOS `textutil`, and the
 * one web page through a fixed cut between two markers. Both of those are
 * derived copies and the manifest says so.
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

const root = path.resolve("evals/lease-corpus");
const manifest = JSON.parse(readFileSync(path.join(root, "manifest.json"), "utf8")) as { documents: ManifestDocument[] };
mkdirSync(path.join(root, "text"), { recursive: true });

function sha256(bytes: Buffer | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function htmlToText(html: string): string {
  const stripped = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  const decoded = stripped
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&rsquo;/g, "’").replace(/&lsquo;/g, "‘")
    .replace(/&ldquo;/g, "“").replace(/&rdquo;/g, "”").replace(/&ndash;/g, "–").replace(/&mdash;/g, "—");
  return decoded.split("\n").map((line) => line.replace(/[ \t]+/g, " ").trim()).filter(Boolean).join("\n");
}

async function main() {
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
  const bytes = readFileSync(file);
  let text: string;
  if (document.extraction.method === "pdf") {
    const result = await extractPdfText(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    if (result.kind !== "text") {
      console.log(`${document.id}: PDF gave ${result.kind}`);
      continue;
    }
    text = result.text;
  } else if (document.extraction.method === "docx-textutil") {
    text = execFileSync("textutil", ["-convert", "txt", "-stdout", file], { encoding: "utf8" });
  } else {
    const full = htmlToText(bytes.toString("utf8"));
    const start = full.indexOf(document.extraction.start ?? "");
    const endAt = full.indexOf(document.extraction.end ?? "", start);
    if (start < 0 || endAt < 0) {
      console.log(`${document.id}: markers not found`);
      continue;
    }
    text = full.slice(start, endAt).trim();
  }
  writeFileSync(path.join(root, "text", `${document.id}.txt`), text);
  console.log(`${document.id}: original sha256 ${sha256(bytes)}; text sha256 ${sha256(text)}; ${text.length} characters`);
}
}

void main();
