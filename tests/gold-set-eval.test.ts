import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { countOccurrences, goldSentences, loadGoldSet, type GoldSet } from "../evals/gold-set/corpus";
import { loadLabelOverlay, overlayProblems } from "../evals/gold-set/label-overlay";
import { characterClasses, formatRate, renderGoldReport, scoreGoldRun, type DocumentRun, type LabelOverlay } from "../evals/gold-set/score";

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
  const text = "Disputes go to binding arbitration only. The fee rises 5% each year. You will not compete for a year. Plots are ten feet wide.";
  const fixture: GoldSet = {
    corpus: "synthetic",
    version: 1,
    documents: [
      {
        id: "loaded", path: "", title: "Loaded", text, benign: false, unusualButHarmless: ["Plots are ten feet wide."], questionSentences: [],
        plantedClauses: [
          { id: "P-01", clauseType: "arbitration-and-class-action-waiver", sourceSentence: "Disputes go to binding arbitration only.", expectedSeverityBand: "high", exit: null },
          { id: "P-02", clauseType: "fee-escalators-and-late-fees", sourceSentence: "The fee rises 5% each year.", expectedSeverityBand: "high", exit: null },
          { id: "P-03", clauseType: "non-compete", sourceSentence: "You will not compete for a year.", expectedSeverityBand: "high", exit: null },
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
    expect(report.recallByType["non-compete"]).toMatchObject({ count: 0, total: 1, inScope: false });
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

  it("compares each found clause's most severe flag with the gold band", () => {
    const medium = { ...flagAt("The fee rises 5% each year."), severity: "medium" };
    const report = scoreGoldRun(fixture, [
      { documentId: "loaded", status: "reviewed", reviewedText: text, droppedFlagCount: 0, returnedFlagsAllAttempts: 2,
        flags: [flagAt("Disputes go to binding arbitration only."), medium] },
    ]);
    // Both planted clauses are graded high in the fixture: one flag agrees, one is graded lower.
    expect(report.severity).toEqual({ agree: { count: 1, total: 2 }, under: 1, over: 0 });
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

describe("the unilateral-case report and exact-band agreement (decision 2)", () => {
  const ids = ["a", "b", "c"];
  const sentence = (id: string) => `Terms change on posting in ${id}.`;
  const unilateralSet: GoldSet = {
    corpus: "synthetic",
    version: 1,
    documents: ids.map((id, index) => ({
      id, path: "", title: id, text: sentence(id), benign: false, unusualButHarmless: [], questionSentences: [],
      plantedClauses: [
        { id: "P-01", clauseType: "unilateral-modification" as const, sourceSentence: sentence(id), expectedSeverityBand: index === 2 ? "moderate" : "critical", exit: null },
      ],
    })),
  };
  const review = (id: string, severity: string | null): DocumentRun => ({
    documentId: id, status: "reviewed", reviewedText: sentence(id), droppedFlagCount: 0, returnedFlagsAllAttempts: 1,
    flags: severity ? [{ severity, sourceDocumentId: "pasted-lease", sourceSentence: sentence(id), sourceStart: 0, sourceEnd: sentence(id).length, consequence: "" }] : [],
  });

  it("lists each case's severity, counts High, and keeps a High on a critical clause out of the exact band", () => {
    const report = scoreGoldRun(unilateralSet, [review("a", "high"), review("b", "medium"), review("c", "medium")]);
    expect(report.unilateral.cases.map((item) => [item.document, item.goldBand, item.foundSeverity])).toEqual([
      ["a", "critical", "high"], ["b", "critical", "medium"], ["c", "moderate", "medium"],
    ]);
    expect(report.unilateral.highCount).toEqual({ count: 1, total: 3 });
    expect(report.unilateral.goldCriticalGradedHigh).toEqual({ count: 1, total: 2 });
    // Mapped: critical = high, so only "a" and "c" agree. Exact: only "c" (medium on moderate).
    expect(report.severity.agree).toEqual({ count: 2, total: 3 });
    expect(report.severityExact.agree).toEqual({ count: 1, total: 3 });
    expect(report.severityExact.byGoldBand).toEqual({ critical: { count: 0, total: 2 }, moderate: { count: 1, total: 1 } });
    expect(report.unilateral.exactBand).toEqual({ count: 1, total: 3 });
  });

  it("does not count a missed case as High and prints the six-case line", () => {
    const report = scoreGoldRun(unilateralSet, [review("a", null), review("b", "high"), review("c", "high")]);
    expect(report.unilateral.highCount).toEqual({ count: 2, total: 3 });
    const text = renderGoldReport(report, ["header"]);
    expect(text).toContain("a P-01: gold critical, product MISSED");
    expect(text).toContain("Six unilateral cases High: 2/3");
    expect(text).toContain("Exact-band agreement");
  });
});

describe("the proposed label corrections (decision 4)", () => {
  const { overlay, sha256 } = loadLabelOverlay();

  it("is marked a proposal, keeps the original labels and checks out against the unchanged corpus", () => {
    expect(overlay.status).toMatch(/PROPOSAL/);
    expect(overlay.status).toMatch(/owner confirmation/);
    expect(overlay.corrections.length).toBeGreaterThan(0);
    for (const entry of overlay.corrections) {
      expect(entry.originalLabel).toMatch(/benign/);
      expect(entry.correctedLabel).toMatch(/valid low forfeiture/);
    }
    expect(overlayProblems(goldSet, overlay)).toEqual([]);
    expect(goldSet.documents.filter((document) => document.benign).map((document) => document.id)).toEqual([
      "clean-document", "library-volunteer-agreement", "swim-lesson-registration",
    ]);
  });

  it("is frozen: its SHA-256 matches the one recorded in the README", () => {
    const readme = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../evals/gold-set/README.md"), "utf8");
    expect(readme).toContain(sha256);
  });

  it("rejects a sentence that is missing or on a document that is not benign", () => {
    const bad = { ...overlay, corrections: [
      { ...overlay.corrections[0], sentence: "Not in the document." },
      { ...overlay.corrections[0], document: "adhesion-contract" },
    ] };
    expect(overlayProblems(goldSet, bad)).toHaveLength(3);
  });

  const text = "Rent is due monthly. No refund is due if you leave early. Tea is provided.";
  const cleanSet: GoldSet = {
    corpus: "synthetic", version: 1,
    documents: [
      { id: "clean", path: "", title: "Clean", text, benign: true, unusualButHarmless: [], questionSentences: [], plantedClauses: [] },
      { id: "clean-two", path: "", title: "Clean two", text, benign: true, unusualButHarmless: [], questionSentences: [], plantedClauses: [] },
    ],
  };
  const fixtureOverlay: LabelOverlay = {
    status: "PROPOSAL", note: "",
    corrections: [{ document: "clean", sentence: "No refund is due if you leave early.", originalLabel: "benign", correctedLabel: "valid low forfeiture", standard: "s", reason: "r" }],
  };
  const flag = (sentence: string, severity: string) => ({
    severity, sourceDocumentId: "pasted-lease", sourceSentence: sentence, sourceStart: text.indexOf(sentence), sourceEnd: text.indexOf(sentence) + sentence.length, consequence: "",
  });
  const run = (id: string, flags: ReturnType<typeof flag>[]): DocumentRun => ({
    documentId: id, status: "reviewed", reviewedText: text, droppedFlagCount: 0, returnedFlagsAllAttempts: flags.length, flags,
  });

  it("splits flags on clean documents into valid forfeitures and false flags without changing the original view", () => {
    const runs = [
      run("clean", [flag("No refund is due if you leave early.", "low"), flag("Tea is provided.", "low")]),
      run("clean-two", [flag("No refund is due if you leave early.", "low")]),
    ];
    const report = scoreGoldRun(cleanSet, runs, fixtureOverlay);
    expect(report.cleanDocuments.flagsOnCleanDocuments).toBe(3);
    expect(report.cleanDocuments.documentsWithNoFlags).toEqual({ count: 0, total: 2 });
    // The correction applies to "clean" only; the same sentence on "clean-two" stays a false flag.
    expect(report.revisedClean).toMatchObject({ validForfeitureFlags: 1, validForfeitureSeverities: ["low"], falseFlags: 2 });
    expect(report.revisedClean?.documentsWithNoFalseFlags).toEqual({ count: 0, total: 2 });
    expect(report.revisedClean?.correctedSentencesFlagged).toEqual({ count: 1, total: 1 });
    expect(report.recall).toEqual({ count: 0, total: 0 });
  });

  it("counts a clean document as clean in the revised view when only valid forfeitures were flagged", () => {
    const report = scoreGoldRun(cleanSet, [run("clean", [flag("No refund is due if you leave early.", "low")]), run("clean-two", [])], fixtureOverlay);
    expect(report.revisedClean?.documentsWithNoFalseFlags).toEqual({ count: 2, total: 2 });
    expect(report.cleanDocuments.documentsWithNoFlags).toEqual({ count: 1, total: 2 });
    expect(renderGoldReport(report, ["header"])).toContain("false flags (everything else on the clean documents): 0");
  });

  it("reports no revised view when no overlay is supplied", () => {
    expect(scoreGoldRun(cleanSet, [run("clean", [])]).revisedClean).toBeNull();
  });
});
