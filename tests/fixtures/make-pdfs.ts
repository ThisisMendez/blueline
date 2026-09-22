/**
 * Writes the two PDF fixtures the extractor suite reads.
 *
 * Regenerate with `npm run fixtures:pdf` (`tsx tests/fixtures/make-pdfs.ts`).
 * Both outputs are committed, so the suite never depends on this running.
 *
 * The PDFs are assembled byte by byte rather than with a PDF library: a page
 * of laid-out text is a handful of objects, a content stream of `Tj` calls in
 * one of the standard fourteen fonts, and an xref table. The builders are
 * exported because a threshold test needs a document with an exact number of
 * extractable characters, which is easier to state in code than to commit as
 * another file.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

/** 8.5 x 11 inches at 72 units to the inch. */
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 40;
const FIRST_BASELINE_Y = PAGE_HEIGHT - 52;
const FONT_SIZE = 9;
const LINE_LEADING = 12;

/** Lines per page that fit between the first baseline and the bottom margin. */
export const LINES_PER_PAGE = Math.floor((FIRST_BASELINE_Y - MARGIN_X) / LINE_LEADING);

/** Characters per line, chosen so a 9pt Helvetica line stays inside the margins. */
export const LINE_WIDTH = 92;

/** A page of already-laid-out lines. An empty string is a blank line. */
export type PdfPage = readonly string[];

type PdfObject = string | { readonly stream: string };

function escapeLiteral(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/**
 * Serialises numbered objects into a PDF with a classic xref table. Object 0
 * is the head of the free list, as the format requires.
 */
function assemble(objects: readonly (PdfObject | undefined)[]): Buffer {
  const chunks: Buffer[] = [];
  const offsets: number[] = [];
  let offset = 0;

  const push = (text: string): void => {
    const bytes = Buffer.from(text, "latin1");
    chunks.push(bytes);
    offset += bytes.length;
  };

  // The binary comment on line two tells any reader this file is not plain text.
  push("%PDF-1.7\n%\xe2\xe3\xcf\xd3\n");

  const highest = objects.length - 1;
  for (let number = 1; number <= highest; number += 1) {
    const object = objects[number];
    if (object === undefined) continue;
    offsets[number] = offset;
    if (typeof object === "string") {
      push(`${number} 0 obj\n${object}\nendobj\n`);
    } else {
      const length = Buffer.byteLength(object.stream, "latin1");
      push(
        `${number} 0 obj\n<< /Length ${length} >>\nstream\n${object.stream}\nendstream\nendobj\n`,
      );
    }
  }

  const xrefOffset = offset;
  let xref = `xref\n0 ${highest + 1}\n0000000000 65535 f \n`;
  for (let number = 1; number <= highest; number += 1) {
    const entryOffset = offsets[number];
    xref +=
      entryOffset === undefined
        ? `0000000000 00000 f \n`
        : `${String(entryOffset).padStart(10, "0")} 00000 n \n`;
  }
  push(xref);
  push(
    `trailer\n<< /Size ${highest + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
  );

  return Buffer.concat(chunks);
}

/**
 * Builds a PDF whose text is selectable: every line is a real `Tj` in
 * Helvetica, so a reader extracts the same characters that were written.
 */
export function buildSelectableTextPdf(pages: readonly PdfPage[]): Buffer {
  if (pages.length === 0) throw new Error("A PDF needs at least one page.");

  const firstPageNumber = 3;
  const fontNumber = firstPageNumber + pages.length * 2;
  const objects: (PdfObject | undefined)[] = [];

  const kids = pages
    .map((_page, index) => `${firstPageNumber + index * 2} 0 R`)
    .join(" ");
  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[2] = `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`;

  pages.forEach((lines, index) => {
    const pageNumber = firstPageNumber + index * 2;
    const contentNumber = pageNumber + 1;
    objects[pageNumber] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 ${fontNumber} 0 R >> >> /Contents ${contentNumber} 0 R >>`;

    let stream = `BT\n/F1 ${FONT_SIZE} Tf\n${LINE_LEADING} TL\n${MARGIN_X} ${FIRST_BASELINE_Y} Td\n`;
    for (const line of lines) {
      stream += line.length > 0 ? `(${escapeLiteral(line)}) Tj\nT*\n` : `T*\n`;
    }
    stream += `ET\n`;
    objects[contentNumber] = { stream };
  });

  objects[fontNumber] =
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;

  return assemble(objects);
}

/**
 * Builds a PDF that opens correctly and holds no text at all: one page whose
 * content stream draws a filled, stroked rectangle where a scan's image would
 * sit. This is the shape of the document the product has to refuse — a file
 * that looks fine to the signer and says nothing a citation could point at.
 */
export function buildTextlessPdf(): Buffer {
  const objects: (PdfObject | undefined)[] = [];
  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[2] = `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`;
  objects[3] =
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
    `/Resources << >> /Contents 4 0 R >>`;
  objects[4] = {
    stream: `0.86 0.86 0.86 rg\n56 96 500 640 re\nf\n0.15 0.15 0.15 RG\n2 w\n56 96 500 640 re\nS\n`,
  };
  return assemble(objects);
}

/** Breaks a paragraph on spaces so no line runs past {@link LINE_WIDTH}. */
export function wrapParagraph(paragraph: string, width = LINE_WIDTH): string[] {
  const lines: string[] = [];
  let line = "";

  for (const word of paragraph.split(/\s+/).filter((part) => part.length > 0)) {
    if (line.length === 0) {
      line = word;
    } else if (line.length + 1 + word.length <= width) {
      line = `${line} ${word}`;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line.length > 0) lines.push(line);
  return lines;
}

/** Lays plain text out as wrapped, paginated lines, blank lines and all. */
export function layOutPages(
  text: string,
  linesPerPage = LINES_PER_PAGE,
): PdfPage[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\n/)) {
    if (paragraph.trim().length === 0) {
      lines.push("");
      continue;
    }
    lines.push(...wrapParagraph(paragraph));
  }

  const pages: string[][] = [];
  for (let start = 0; start < lines.length; start += linesPerPage) {
    pages.push(lines.slice(start, start + linesPerPage));
  }
  return pages.length > 0 ? pages : [[]];
}

function fixturePath(name: string): string {
  return fileURLToPath(new URL(name, import.meta.url));
}

function main(): void {
  const leaseText = readFileSync(fixturePath("adhesion-lease.txt"), "utf8");

  writeFileSync(
    fixturePath("adhesion-lease.pdf"),
    buildSelectableTextPdf(layOutPages(leaseText)),
  );
  writeFileSync(fixturePath("textless-lease.pdf"), buildTextlessPdf());
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
