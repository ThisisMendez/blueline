import { describe, expect, it } from "vitest";

import { countOccurrences, goldSentences, loadGoldSet, type GoldSet } from "../evals/gold-set/corpus";
import { characterClasses, formatRate, scoreGoldRun, type DocumentRun } from "../evals/gold-set/score";

const goldSet = loadGoldSet();

describe("the gold set copied from ankitvirmani/redline", () => {
  it("holds the nine documents and forty planted clauses its README describes", () => {
    expect(goldSet.documents).toHaveLength(9);
    expect(goldSet.documents.flatMap((document) => document.plantedClauses)).toHaveLength(40);
  });

  for (const document of goldSet.documents) {
    it(`${document.id}: every gold-set sentence appears exactly once in its document`, () => {
      const counts = goldSentences(document).map(({ label, sentence }) => ({ label, count: countOccurrences(document.text, sentence) }));
      expect(counts.filter((entry) => entry.count !== 1)).toEqual([]);
    });
  }
});

describe("scoring a gold-set run", () => {
  const text = "Disputes go to binding arbitration only. The fee rises 5% each year. Renewal is automatic. Plots are ten feet wide.";
  const fixture: GoldSet = {
    corpus: "synthetic",
    version: 1,
    documents: [
      {
        id: "loaded", path: "", title: "Loaded", text, benign: false, unusualButHarmless: ["Plots are ten feet wide."], questionSentences: [],
        plantedClauses: [
          { id: "P-01", clauseType: "arbitration-and-class-action-waiver", sourceSentence: "Disputes go to binding arbitration only.", expectedSeverityBand: "high", exit: null },
          { id: "P-02", clauseType: "fee-escalators-and-late-fees", sourceSentence: "The fee rises 5% each year.", expectedSeverityBand: "high", exit: null },
          { id: "P-03", clauseType: "auto-renewal", sourceSentence: "Renewal is automatic.", expectedSeverityBand: "high", exit: null },
        ],
      },
      { id: "benign", path: "", title: "Benign", text: "Nothing here.", benign: true, unusualButHarmless: [], questionSentences: [], plantedClauses: [] },
      { id: "broken", path: "", title: "Broken", text: "The fee rises.", benign: false, unusualButHarmless: [], questionSentences: [],
        plantedClauses: [{ id: "P-01", clauseType: "fee-escalators-and-late-fees", sourceSentence: "The fee rises.", expectedSeverityBand: "high", exit: null }] },
    ],
  };
  const flagAt = (sentence: string, start = text.indexOf(sentence)) => ({
    severity: "high", sourceDocumentId: "pasted-lease", sourceSentence: sentence, sourceStart: start, sourceEnd: start + sentence.length, consequence: "",
  });

  it("counts an overlapping quote as found, leaves failed documents out, and never counts out-of-scope types as misses", () => {
    const runs: DocumentRun[] = [
      // Quotes only part of P-01: overlap is enough.
      { documentId: "loaded", status: "reviewed", reviewedText: text, droppedFlagCount: 1, returnedFlagsAllAttempts: 4,
        flags: [flagAt("binding arbitration only."), flagAt("Plots are ten feet wide.")] },
      { documentId: "benign", status: "reviewed", reviewedText: "Nothing here.", droppedFlagCount: 0, returnedFlagsAllAttempts: 0, flags: [] },
      { documentId: "broken", status: "failed", reason: "model-timeout" },
    ];
    const report = scoreGoldRun(fixture, runs);
    expect(report.recall).toEqual({ count: 1, total: 2 });
    expect(report.recallByType["auto-renewal"]).toMatchObject({ count: 0, total: 1, inScope: false });
    expect(report.documents.failed).toEqual([{ id: "broken", reason: "model-timeout" }]);
    expect(report.groundedness).toMatchObject({ count: 2, total: 3 });
    expect(report.flagsOnUnusualButHarmless).toBe(1);
    expect(report.unmatchedFlagsOnPlantedDocuments).toBe(1);
    expect(report.cleanDocuments.documentsWithNoFlags).toEqual({ count: 1, total: 1 });
    expect(report.flags[0]).toMatchObject({ matchedPlantedClause: "P-01", clauseType: null });
  });

  it("does not match a quote that is not in the document", () => {
    const report = scoreGoldRun(fixture, [
      { documentId: "loaded", status: "reviewed", reviewedText: text, droppedFlagCount: 0, returnedFlagsAllAttempts: 1, flags: [flagAt("Disputes go to arbitration.", 0)] },
    ]);
    expect(report.recall).toEqual({ count: 0, total: 2 });
    expect(report.groundedness).toMatchObject({ count: 0, total: 1 });
  });

  it("names the character classes a model tends to retype", () => {
    expect(characterClasses("the member’s ﬁrst fee — due  now")).toEqual([
      "curly quote or apostrophe", "non-breaking space", "fi or fl ligature", "em dash", "two spaces in a row",
    ]);
    expect(characterClasses("plain text")).toEqual([]);
  });

  it("prints a rate as a count and a percentage", () => {
    expect(formatRate({ count: 3, total: 4 })).toBe("3/4 (75.0%)");
    expect(formatRate({ count: 0, total: 0 })).toBe("0/0 (n/a)");
  });
});
