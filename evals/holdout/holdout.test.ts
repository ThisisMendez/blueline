import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { annotationRecordSchema, type AnnotationRecord } from "../lease-corpus/annotation";
import { compare, sha256 } from "./duplicates";
import { developmentLists, holdoutManifestIds, localTextHashes, readLock } from "./files";
import { buildFrozenLabels, verifyFrozen, writeFrozen, type FrozenLabels } from "./freeze";
import { checkLock, type HoldoutLock } from "./lock";
import { refusalReasons, toCandidate } from "./run";
import { scoreHoldout, type CandidateDocument } from "./score";

describe("the committed holdout lock", () => {
  const lock = readLock();

  it("locks exactly the documents in the holdout manifest, and none is used in development", () => {
    expect(lock.documents.map((document) => document.id).sort()).toEqual(holdoutManifestIds().sort());
    // Local text is gitignored: where it's present its hash must match the lock; where it isn't, only membership is checked.
    expect(checkLock(lock, localTextHashes(), developmentLists())).toEqual([]);
  });

  it("matches every holdout annotation record, and those records hold no labels", () => {
    const dir = path.resolve("evals/holdout/annotations");
    const files = readdirSync(dir).filter((name) => name.endsWith(".json"));
    expect(files).toHaveLength(lock.documents.length);
    for (const document of lock.documents) {
      const record = annotationRecordSchema.parse(JSON.parse(readFileSync(path.join(dir, `${document.id}.json`), "utf8")));
      if (!record.available) throw new Error(`${document.id} should be available`);
      expect(record.sha256Text).toBe(document.sha256Text);
      expect(record.sha256Original).toBe(document.sha256Original);
      expect(record.proposedSplit).toBe("holdout-locked");
      // Holdout labels quote the lease, so they live in evals/holdout/private/labels/, never in the committed record.
      expect(record.reviews.every((review) => review.items.length === 0 && review.reviewerId === null)).toBe(true);
      expect(record.adjudication.resolvedItems).toEqual([]);
    }
  });

  it("is not yet confirmed by the owner", () => {
    expect(lock.ownerConfirmed).toBe(false);
  });
});

const HASH = "a".repeat(64);
const TEXT = "Rent is due on the first. Tenant forfeits the whole deposit if the lease ends early. Tenants may keep one cat. Landlord may enter with notice.";
function syntheticLock(overrides: Partial<HoldoutLock> = {}): HoldoutLock {
  return {
    lock: "blueline-real-lease-holdout",
    lockedOn: "2026-11-11",
    lockedBy: "test",
    ownerConfirmed: true,
    ownerConfirmedOn: "2026-11-12",
    note: "synthetic",
    documents: [{ id: "H01-test", replaces: "L01-test", sourceUrl: "https://example.org/lease.pdf", version: "v1", sha256Original: HASH, sha256Text: sha256(TEXT) }],
    duplicateCheck: { method: "test", comparedWith: [], highestOverlap: {}, duplicatesFound: 0 },
    ...overrides,
  };
}

describe("checking the lock", () => {
  it("fails when a locked document's text hash changes", () => {
    expect(checkLock(syntheticLock(), { "H01-test": sha256("edited") }, [])).toEqual([
      `H01-test: text hash changed since the lock (locked ${sha256(TEXT)}, now ${sha256("edited")})`,
    ]);
  });

  it("fails when a holdout id, source or text appears in a development list", () => {
    expect(checkLock(syntheticLock(), { "H01-test": null }, [
      { name: "dev", ids: ["L03", "H01-test"], sourceUrls: ["https://example.org/lease.pdf"], textHashes: [sha256(TEXT)] },
    ])).toEqual([
      "H01-test: holdout document appears in development list dev",
      "H01-test: its source is used in development list dev",
      "H01-test: its text is used in development list dev",
    ]);
  });

  it("fails when the manifest and the lock disagree on membership", () => {
    expect(checkLock(syntheticLock(), { "H01-test": null, "H02-new": null }, [])).toEqual(["H02-new: in the holdout manifest but not locked"]);
  });
});

describe("duplicate check", () => {
  const lease = "The tenant shall pay rent on the first day of each month to the landlord at the address given above, and late rent costs a fee.";
  it("calls identical text, or text mostly contained in another, a duplicate", () => {
    expect(compare(lease, "x", lease).verdict).toBe("duplicate");
    expect(compare(lease.toUpperCase().replace(/,/g, ";"), "x", `${lease} Extra clause about pets and parking spaces in the rear lot.`).verdict).toBe("duplicate");
  });
  it("calls unrelated text distinct", () => {
    expect(compare(lease, "x", "A gym membership renews every year unless cancelled in writing thirty days before the renewal date.").verdict).toBe("distinct");
  });
});

const RISK = {
  itemId: "A1", quotedSentence: "Tenant forfeits the whole deposit if the lease ends early.", expectedRiskCategory: "deposit" as const,
  consequence: "Ending early costs the deposit.", triggeringCondition: "Ending the lease early.", materiality: "material" as const,
  expectedSeverity: "high" as const, reviewerDecision: "flag" as const, rationale: "A forfeiture.",
};
const ORDINARY = { ...RISK, itemId: "A2", quotedSentence: "Rent is due on the first.", expectedRiskCategory: "none" as const, materiality: "ordinary" as const, expectedSeverity: null, reviewerDecision: "do-not-flag" as const, rationale: "The basic deal." };

function syntheticRecord(overrides: Partial<Extract<AnnotationRecord, { available: true }>> = {}): AnnotationRecord {
  return {
    documentId: "H01-test", sourceUrl: "https://example.org/lease.pdf", accessedOn: "2026-11-11", available: true, label: "test",
    sha256Original: HASH, sha256Text: sha256(TEXT), textIsDerived: false, jurisdiction: "x", housingContext: "x", programRestrictions: "x",
    documentType: "x", isTemplateNotExecutedLease: true, completeness: { status: "complete-as-supplied", observed: "x", needsHumanCheck: [] },
    usageRights: "x", proposedSplit: "holdout-locked", exposureToPromptWork: [], requiresHumanReview: true,
    reviews: [
      { reviewerId: "R1", completedBeforeSeeingModelOutput: true, completedOn: "2026-12-01", items: [RISK, ORDINARY] },
      { reviewerId: "R2", completedBeforeSeeingModelOutput: true, completedOn: "2026-12-02", items: [RISK] },
    ],
    adjudication: { status: "resolved", adjudicatorId: "A9", resolvedItems: [{ ...RISK, disagreement: false }, { ...ORDINARY, disagreement: true }], notes: null },
    ...overrides,
  };
}

describe("freezing adjudicated labels (synthetic data)", () => {
  let dir = "";
  afterEach(() => { if (dir) rmSync(dir, { recursive: true, force: true }); });

  it("refuses until the owner confirms the lock and adjudication is resolved", () => {
    const result = buildFrozenLabels(
      syntheticLock({ ownerConfirmed: false }),
      { "H01-test": syntheticRecord({ adjudication: { status: "in-progress", adjudicatorId: "A9", resolvedItems: [], notes: null } }) },
      { "H01-test": TEXT },
      "2026-12-10",
    );
    expect(result).toEqual({ problems: ["the owner has not confirmed the holdout lock", "H01-test: adjudication not resolved"] });
  });

  it("refuses when the text no longer matches the lock, a record is missing, or the adjudicator reviewed it", () => {
    expect(buildFrozenLabels(syntheticLock(), { "H01-test": syntheticRecord() }, { "H01-test": `${TEXT} More.` }, "x")).toEqual({ problems: ["H01-test: local text differs from the lock"] });
    expect(buildFrozenLabels(syntheticLock(), {}, { "H01-test": TEXT }, "x")).toEqual({ problems: ["H01-test: no label record"] });
    const self = syntheticRecord({ adjudication: { status: "resolved", adjudicatorId: "R1", resolvedItems: [{ ...RISK, disagreement: false }], notes: null } });
    expect(buildFrozenLabels(syntheticLock(), { "H01-test": self }, { "H01-test": TEXT }, "x")).toEqual({ problems: ["H01-test: the adjudicator also reviewed this document"] });
  });

  it("freezes once, then refuses to freeze again and detects any edit", () => {
    const lock = syntheticLock();
    const result = buildFrozenLabels(lock, { "H01-test": syntheticRecord() }, { "H01-test": TEXT }, "2026-12-10");
    if (!("frozen" in result)) throw new Error(result.problems.join("; "));
    dir = mkdtempSync(path.join(os.tmpdir(), "holdout-freeze-"));
    const frozenPath = path.join(dir, "frozen.json");
    const sealPath = path.join(dir, "seal.json");
    writeFrozen(result.frozen, frozenPath, sealPath);
    expect(verifyFrozen(readFileSync(frozenPath, "utf8"), readFileSync(sealPath, "utf8"), lock)).toEqual([]);
    expect(() => writeFrozen(result.frozen, frozenPath, sealPath)).toThrow(/already frozen/);

    const edited = JSON.parse(readFileSync(frozenPath, "utf8")) as FrozenLabels;
    edited.documents[0].items[1].reviewerDecision = "flag";
    expect(verifyFrozen(JSON.stringify(edited), readFileSync(sealPath, "utf8"), lock)).toEqual([
      "frozen labels were edited after freezing (hash doesn't match the file's own)",
      "frozen labels don't match the committed seal",
    ]);
    // Re-hashing the edited file still doesn't match the committed seal.
    const { contentSha256: _ignored, ...payload } = edited;
    void _ignored;
    const rehashed = { ...payload, contentSha256: sha256(JSON.stringify(payload)) };
    expect(verifyFrozen(JSON.stringify(rehashed), readFileSync(sealPath, "utf8"), lock)).toEqual(["frozen labels don't match the committed seal"]);
    // A different lock is caught too.
    const otherLock = syntheticLock({ documents: [{ ...lock.documents[0], sha256Original: "b".repeat(64) }] });
    expect(verifyFrozen(readFileSync(frozenPath, "utf8"), readFileSync(sealPath, "utf8"), otherLock)).toEqual(["frozen labels were made against a different holdout lock"]);
  });
});

describe("scoring a candidate run against frozen labels (synthetic data)", () => {
  const CLEAN_TEXT = "Rent is due on the first. Tenants may keep one cat.";
  const labels = {
    documents: [
      { documentId: "H01", sha256Text: HASH, reviewerIds: ["R1", "R2"] as [string, string], adjudicatorId: "A9", items: [{ ...RISK, disagreement: false }, { ...ORDINARY, disagreement: false }, { ...RISK, itemId: "A3", quotedSentence: "Landlord may enter with notice.", disagreement: true }] },
      { documentId: "H02", sha256Text: HASH, reviewerIds: ["R1", "R2"] as [string, string], adjudicatorId: "A9", items: [{ ...ORDINARY, disagreement: false }] },
      { documentId: "H03", sha256Text: HASH, reviewerIds: ["R1", "R2"] as [string, string], adjudicatorId: "A9", items: [] },
      { documentId: "H04", sha256Text: HASH, reviewerIds: ["R1", "R2"] as [string, string], adjudicatorId: "A9", items: [{ ...RISK, disagreement: false }] },
    ],
  };
  const at = (text: string, sentence: string, severity = "high") => ({ severity, sourceSentence: sentence, sourceStart: text.indexOf(sentence), sourceEnd: text.indexOf(sentence) + sentence.length });

  it("counts recall, false flags with their kind, and clean-lease false alarms", () => {
    const run: CandidateDocument[] = [
      { documentId: "H01", status: "reviewed", reviewedText: TEXT, flags: [
        at(TEXT, "Tenant forfeits the whole deposit"), // partial span still overlaps the risk
        at(TEXT, "Rent is due on the first."), // do-not-flag item
        at(TEXT, "Tenants may keep one cat."), // nobody labelled it
        { severity: "low", sourceSentence: "Not in the lease.", sourceStart: 0, sourceEnd: 17 },
      ] },
      { documentId: "H02", status: "reviewed", reviewedText: CLEAN_TEXT, flags: [at(CLEAN_TEXT, "Tenants may keep one cat.")] },
      { documentId: "H03", status: "reviewed", reviewedText: CLEAN_TEXT, flags: [] },
      { documentId: "H04", status: "rate-limited", reason: "429" },
    ];
    const report = scoreHoldout(labels, run);
    expect(report.recall).toEqual({ count: 1, total: 2 });
    expect(report.falseFlags).toEqual({ count: 4, total: 5 });
    expect(report.falseFlagBreakdown).toEqual({ "do-not-flag item": 1, "unlabelled sentence": 2, "quote not in text": 1 });
    expect(report.cleanLeaseFalseAlarms).toEqual({ count: 1, total: 2 });
    expect(report.missedRisks).toEqual([{ documentId: "H01", itemId: "A3", expectedSeverity: "high" }]);
    expect(report.notReviewed).toEqual([{ documentId: "H04", status: "rate-limited", reason: "429", risks: 1 }]);
    expect(report.rateLimited).toBe(1);
    expect(report.modelUnreadable).toBe(0);
  });
});

describe("the holdout runner", () => {
  it("refuses without frozen labels, and passes on every lock or hash problem", () => {
    expect(refusalReasons({ lockProblems: [], frozenExists: false, sealExists: false, frozenProblems: [] })).toEqual([
      "no frozen labels: real-lease performance stays not measured until adjudicated labels are frozen",
      "no committed seal for the frozen labels",
    ]);
    expect(refusalReasons({ lockProblems: ["H01: text hash changed"], frozenExists: true, sealExists: true, frozenProblems: ["frozen labels don't match the committed seal"] })).toHaveLength(2);
    expect(refusalReasons({ lockProblems: [], frozenExists: true, sealExists: true, frozenProblems: [] })).toEqual([]);
  });

  it("counts a rate-limited document as rate-limited, never as model-unreadable", () => {
    expect(toCandidate("H01", { status: "failed", reason: "model-rate-limited" } as never, null).status).toBe("rate-limited");
    expect(toCandidate("H01", null, "rate-limited: too many requests").status).toBe("rate-limited");
    expect(toCandidate("H01", { status: "failed", reason: "model-unreadable" } as never, null).status).toBe("model-unreadable");
  });
});
