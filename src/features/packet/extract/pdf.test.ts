import { describe, expect, it } from "vitest";

import { locateQuotation, normalizeText } from "@/features/packet/normalize";

import {
  buildSelectableTextPdf,
  buildTextlessPdf,
  wrapParagraph,
} from "~tests/fixtures/make-pdfs";
import { loadFixture, loadFixturePdf } from "~tests/fixtures/index";

import {
  countTextCharacters,
  extractPdfText,
  usableTextThreshold,
} from "./pdf";

/**
 * The extractor, run for real against real PDF bytes. Nothing here is
 * stubbed: pdf.js parses the files the corpus ships, and the threshold cases
 * are PDFs built to hold an exact number of extractable characters.
 */

const { text: leaseText, sidecar } = loadFixture("adhesion-lease");

function bytesOf(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

/** Lease words laid out to carry exactly `count` non-whitespace characters. */
function linesHolding(count: number): string[] {
  const words: string[] = [];
  let remaining = count;
  while (remaining > 0) {
    const size = Math.min(7, remaining);
    words.push("deposit".slice(0, size));
    remaining -= size;
  }
  return wrapParagraph(words.join(" "));
}

/** A PDF of `pageCount` pages whose first page carries all the text. */
function pdfHolding(count: number, pageCount: number): ArrayBuffer {
  const pages: string[][] = [linesHolding(count)];
  while (pages.length < pageCount) pages.push([]);
  return bytesOf(buildSelectableTextPdf(pages));
}

describe("reading a selectable-text PDF", () => {
  it("returns the lease the PDF was laid out from", async () => {
    const result = await extractPdfText(loadFixturePdf("adhesion-lease"));

    expect(result.kind).toBe("text");
    if (result.kind !== "text") return;

    expect(result.pageCount).toBeGreaterThan(1);
    expect(normalizeText(result.text)).toContain(normalizeText(leaseText));
  });

  it("puts every planted sentence where a citation can find it", async () => {
    const result = await extractPdfText(loadFixturePdf("adhesion-lease"));
    expect(result.kind).toBe("text");
    if (result.kind !== "text") return;

    for (const planted of sidecar.plantedFlags) {
      const location = locateQuotation(result.text, planted.sourceSentence);
      expect(location, `${planted.id} is not in the extracted text`).not.toBeNull();
      if (!location) continue;
      expect(normalizeText(result.text.slice(location.start, location.end))).toBe(
        normalizeText(planted.sourceSentence),
      );
    }
  });
});

describe("reading a PDF with no usable text", () => {
  it("refuses the textless document instead of reviewing nothing", async () => {
    const result = await extractPdfText(loadFixturePdf("textless-lease"));

    expect(result).toEqual({
      kind: "no-usable-text",
      pageCount: 1,
      characterCount: 0,
    });
  });

  it("refuses a file that is not a PDF at all", async () => {
    const notAPdf = new TextEncoder().encode(
      "RESIDENTIAL LEASE AGREEMENT\nThis is plain text in a file named .pdf.",
    );

    const result = await extractPdfText(bytesOf(Buffer.from(notAPdf)));

    expect(result).toEqual({ kind: "unreadable", reason: "not-a-pdf" });
  });
});

describe("the usable-text rule", () => {
  it("states the same threshold the extractor applies", () => {
    expect(usableTextThreshold(1)).toBe(200);
    expect(usableTextThreshold(2)).toBe(200);
    expect(usableTextThreshold(3)).toBe(300);
    expect(usableTextThreshold(12)).toBe(1200);
  });

  it("counts characters that are not whitespace", () => {
    expect(countTextCharacters(" a b\n c \t")).toBe(3);
  });

  it("takes a one-page document that just clears the floor", async () => {
    const result = await extractPdfText(pdfHolding(200, 1));

    expect(result.kind).toBe("text");
    if (result.kind !== "text") return;
    expect(result.characterCount).toBe(200);
  });

  it("refuses a one-page document one character short of it", async () => {
    const result = await extractPdfText(pdfHolding(199, 1));

    expect(result).toEqual({
      kind: "no-usable-text",
      pageCount: 1,
      characterCount: 199,
    });
  });

  it("takes a three-page document that just clears the per-page weight", async () => {
    const result = await extractPdfText(pdfHolding(300, 3));

    expect(result.kind).toBe("text");
    if (result.kind !== "text") return;
    expect(result.pageCount).toBe(3);
    expect(result.characterCount).toBe(300);
  });

  it("refuses three pages carrying what one page's worth of text would need", async () => {
    const result = await extractPdfText(pdfHolding(299, 3));

    expect(result).toEqual({
      kind: "no-usable-text",
      pageCount: 3,
      characterCount: 299,
    });
  });

  it("refuses a long scan that leaks a stray glyph on every page", async () => {
    const pages = Array.from({ length: 12 }, () => ["Page", "4B"]);

    const result = await extractPdfText(bytesOf(buildSelectableTextPdf(pages)));

    expect(result.kind).toBe("no-usable-text");
  });
});

describe("the textless PDF fixture", () => {
  it("is a document a reader opens without complaint", async () => {
    const result = await extractPdfText(bytesOf(buildTextlessPdf()));

    expect(result.kind).not.toBe("unreadable");
  });
});
