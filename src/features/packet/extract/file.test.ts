import { describe, expect, it } from "vitest";

import { loadFixturePdf } from "~tests/fixtures/index";

import { MAXIMUM_PDF_BYTES, readPdfFile, type ChosenFile } from "./file";

function chosen(name: string, bytes: ArrayBuffer): ChosenFile {
  return { name, size: bytes.byteLength, arrayBuffer: async () => bytes };
}

describe("opening a chosen file", () => {
  it("returns the text of a selectable-text PDF", async () => {
    const reading = await readPdfFile(chosen("lease.pdf", loadFixturePdf("adhesion-lease")));
    expect(reading.kind).toBe("read");
    if (reading.kind === "read") expect(reading.pageCount).toBe(5);
  });

  it("names each problem so the signer gets the right fix", async () => {
    expect(await readPdfFile(chosen("scan.pdf", loadFixturePdf("textless-lease"))))
      .toEqual({ kind: "problem", problem: "scanned" });
    expect(await readPdfFile(chosen("empty.pdf", new ArrayBuffer(0))))
      .toEqual({ kind: "problem", problem: "empty" });
    const notPdf = new TextEncoder().encode("plain words, not a PDF");
    expect(await readPdfFile(chosen("notes.pdf", notPdf.buffer as ArrayBuffer)))
      .toEqual({ kind: "problem", problem: "invalid" });
    expect(await readPdfFile({
      name: "huge.pdf",
      size: MAXIMUM_PDF_BYTES + 1,
      arrayBuffer: async () => { throw new Error("an oversized file must not be read"); },
    })).toEqual({ kind: "problem", problem: "oversized" });
  });

  it("tells a locked PDF from a broken or empty one", async () => {
    const bytes = new ArrayBuffer(10);
    expect(await readPdfFile(chosen("locked.pdf", bytes), async () => ({ kind: "unreadable", reason: "password-protected" })))
      .toEqual({ kind: "problem", problem: "encrypted" });
    expect(await readPdfFile(chosen("zero.pdf", bytes), async () => ({ kind: "no-usable-text", pageCount: 0, characterCount: 0 })))
      .toEqual({ kind: "problem", problem: "empty" });
    expect(await readPdfFile(chosen("boom.pdf", bytes), async () => { throw new Error("worker died"); }))
      .toEqual({ kind: "problem", problem: "invalid" });
  });
});
