import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { annotationRecordSchema, readiness, validateRecord, type AnnotationRecord } from "../evals/lease-corpus/annotation";

const dir = path.resolve("evals/lease-corpus/annotations");

describe("public lease corpus records", () => {
  it("every committed record parses and holds no labels yet", () => {
    const files = readdirSync(dir).filter((name) => name.endsWith(".json"));
    expect(files).toHaveLength(10);
    for (const file of files) {
      const record = annotationRecordSchema.parse(JSON.parse(readFileSync(path.join(dir, file), "utf8")));
      if (record.available) {
        // Labels come from people only; nothing was pre-filled.
        expect(record.reviews.every((review) => review.items.length === 0 && review.reviewerId === null)).toBe(true);
        expect(record.adjudication.status).toBe("not-started");
        expect(record.proposedSplit).not.toBe("holdout-locked");
      }
    }
  });
});

const TEXT = "Rent is due on the first. Tenant forfeits the deposit if the lease ends early. Rent is due on the first.";
const ITEM = {
  itemId: "A1", quotedSentence: "Tenant forfeits the deposit if the lease ends early.", expectedRiskCategory: "deposit" as const,
  consequence: "Ending early costs the whole deposit.", triggeringCondition: "The tenant ends the lease early.",
  materiality: "material" as const, expectedSeverity: "high" as const, reviewerDecision: "flag" as const, rationale: "A forfeiture.",
};
function record(overrides: Partial<Extract<AnnotationRecord, { available: true }>> = {}): AnnotationRecord {
  const base = annotationRecordSchema.parse(JSON.parse(readFileSync(path.join(dir, "L08-maine-ag-model-lease.json"), "utf8")));
  if (!base.available) throw new Error("expected an available record");
  return { ...base, ...overrides };
}

describe("validating an annotation record", () => {
  it("accepts two independent reviews with exact, unique quotes", () => {
    const r = record({ reviews: [
      { reviewerId: "R1", completedBeforeSeeingModelOutput: true, completedOn: "2026-12-01", items: [ITEM] },
      { reviewerId: "R2", completedBeforeSeeingModelOutput: true, completedOn: "2026-12-02", items: [ITEM] },
    ] });
    expect(validateRecord(r, TEXT)).toEqual([]);
    expect(readiness(r)).toBe("both reviews in; adjudication pending");
  });

  it("rejects a quote that isn't in the text, or isn't unique", () => {
    const r = record({ reviews: [
      { reviewerId: "R1", completedBeforeSeeingModelOutput: true, completedOn: "2026-12-01", items: [{ ...ITEM, quotedSentence: "Tenant forfeits the deposit." }] },
      { reviewerId: "R2", completedBeforeSeeingModelOutput: true, completedOn: "2026-12-02", items: [{ ...ITEM, quotedSentence: "Rent is due on the first." }] },
    ] });
    expect(validateRecord(r, TEXT)).toEqual([
      "review 1 A1: quote not found in the text",
      "review 2 A1: quote appears more than once; quote a longer, unique span",
    ]);
  });

  it("rejects one reviewer posing as two, a review done after seeing model output, and a severity on a non-material clause", () => {
    const r = record({ reviews: [
      { reviewerId: "R1", completedBeforeSeeingModelOutput: false, completedOn: "2026-12-01", items: [{ ...ITEM, materiality: "ordinary" }] },
      { reviewerId: "R1", completedBeforeSeeingModelOutput: true, completedOn: "2026-12-02", items: [ITEM] },
    ] });
    expect(validateRecord(r, TEXT)).toEqual([
      "review 1: not confirmed as completed before seeing model output",
      "review 1 A1: severity given for a clause not judged material",
      "both reviews have the same reviewer id; they must be independent",
    ]);
  });
});
