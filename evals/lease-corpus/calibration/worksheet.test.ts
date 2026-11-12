import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { lines, renderWorksheet, sentences } from "./worksheet";

const TEXT = "Rent is due on the first.\nLate rent costs $25. The deposit is\nreturned within 30 days.\n\nPets\nOne cat allowed";

describe("worksheet offsets", () => {
  it("gives every line and sentence offsets that point back at the exact text", () => {
    for (const span of [...lines(TEXT), ...sentences(TEXT)]) expect(TEXT.slice(span.start, span.end)).toBe(span.text);
    expect(sentences(TEXT).map((span) => span.text)).toEqual([
      "Rent is due on the first.",
      "Late rent costs $25.",
      "The deposit is\nreturned within 30 days.",
      "Pets\nOne cat allowed",
    ]);
  });

  it("keeps offsets relative to the whole text when only a range is in scope", () => {
    const start = TEXT.indexOf("Late");
    const end = TEXT.indexOf("\n\n");
    const spans = sentences(TEXT, start, end);
    expect(spans[0]).toEqual({ start, end: start + "Late rent costs $25.".length, text: "Late rent costs $25." });
    for (const span of [...spans, ...lines(TEXT, start, end)]) expect(TEXT.slice(span.start, span.end)).toBe(span.text);
  });

  it("puts no label, verdict or model output in a worksheet", () => {
    const sheet = renderWorksheet({ documentId: "L00", sha256Text: "x", reviewerId: "R1", text: TEXT, start: 0, end: TEXT.length, scopeNote: "" });
    expect(sheet).not.toMatch(/reviewerDecision|materiality|severity|"flag"/);
  });
});

describe("the calibration batch", () => {
  it("draws only on development documents", () => {
    const batch = JSON.parse(readFileSync("evals/lease-corpus/calibration/batch.json", "utf8")) as { documents: { documentId: string }[] };
    const developmentIds = ["L01-philadelphia-fair-lease", "L03-hud-family-model-lease", "L07-cu-boulder-grad-family-lease", "L08-maine-ag-model-lease", "L10-ohio-u-ecohouse-lease"];
    for (const document of batch.documents) expect(developmentIds).toContain(document.documentId);
  });
});
