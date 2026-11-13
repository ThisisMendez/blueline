import { describe, expect, it } from "vitest";

import { findLegalClaims } from "@/features/analysis/legal-claims";
import { runGeneralReview } from "@/features/analysis/review";
import type {
  AnalysisOutcome,
  GeneralReview,
  ReviewRole,
  RiskFlag,
  Severity,
} from "@/features/analysis/types";
import type { StoredReview } from "@/features/library/store";
import { addendum, lease, roleFixtureModel } from "~tests/support/role-fixture-model";

import {
  GRADE_BANDS,
  HOW_WE_SCORE,
  SCORE_UNAVAILABLE_LABEL,
  SCORE_VERSION,
  UNAVAILABLE_EXPLANATIONS,
  countDistinctFlags,
  gradeFor,
  scoreFromCounts,
  scoreFromOutcome,
  scoreFromStoredReview,
  scoreReview,
  type ScorableFlag,
} from "./index";

let nextId = 0;
function flags(high: number, medium: number, low: number): ScorableFlag[] {
  const make = (severity: Severity) => ({ id: `doc#${(nextId += 1)}`, severity });
  return [
    ...Array.from({ length: high }, () => make("high")),
    ...Array.from({ length: medium }, () => make("medium")),
    ...Array.from({ length: low }, () => make("low")),
  ];
}

function scored(high: number, medium: number, low: number, role: ReviewRole = "renter") {
  return scoreReview({ kind: "reviewed", role, flags: flags(high, medium, low), droppedFlagCount: 0 });
}

function riskFlag(id: string, severity: Severity, related = 0): RiskFlag {
  return {
    id,
    severity,
    sourceSentence: "A sentence.",
    sourceDocumentId: "pasted-lease",
    sourceStart: 0,
    sourceEnd: 11,
    title: "A title",
    nextStep: "Ask.",
    relatedCitations: Array.from({ length: related }, (_, index) => ({
      sourceSentence: `Related ${index}.`,
      sourceDocumentId: "supplied-2",
      sourceStart: index * 20,
      sourceEnd: index * 20 + 10,
    })),
    consequence: "c",
    triggeringCondition: "t",
    counterOffer: "o",
    residualRisk: "r",
  };
}

function review(riskFlags: RiskFlag[], overrides: Partial<GeneralReview> = {}): GeneralReview {
  return {
    role: "renter",
    summary: "s",
    riskFlags,
    coverage: { items: [{ status: "not-found", topicId: "repairs" }] },
    clean: riskFlags.length === 0,
    cleanStatement: null,
    droppedFlagCount: 0,
    legalClaims: { repaired: 0, withheld: 0 },
    ...overrides,
  };
}

function reviewed(generalReview: GeneralReview): AnalysisOutcome {
  return {
    status: "reviewed",
    reviewId: null,
    persisted: false,
    retention: null,
    persistenceFailed: false,
    documents: [],
    completeness: { kind: "complete" } as never,
    review: generalReview,
  };
}

describe("grade bands", () => {
  it.each([
    [100, "A"], [90, "A"], [89, "B"], [80, "B"], [79, "C"],
    [70, "C"], [69, "D"], [60, "D"], [59, "F"], [1, "F"],
  ])("score %i is grade %s", (score, grade) => {
    expect(gradeFor(score).grade).toBe(grade);
  });

  it("covers 1 to 100 with no gaps or overlaps", () => {
    for (let score = 1; score <= 100; score += 1) {
      expect(GRADE_BANDS.filter((band) => score >= band.min && score <= band.max)).toHaveLength(1);
    }
    expect(() => gradeFor(0)).toThrow(RangeError);
    expect(() => gradeFor(101)).toThrow(RangeError);
  });
});

describe("scoreReview on reachable reviews", () => {
  it.each([
    // [high, medium, low, score, grade, what the case shows]
    [0, 0, 0, 100, "A", "no flags is the top of the scale"],
    [0, 0, 1, 97, "A", "one low flag"],
    [0, 0, 3, 91, "A", "the lowest A: three low flags"],
    [0, 0, 4, 88, "B", "the highest B: four low flags"],
    [0, 0, 7, 80, "B", "low flags alone floor at 80, so they never reach C"],
    [0, 0, 30, 80, "B", "many low flags still never reach C"],
    [0, 1, 0, 79, "C", "one medium flag caps at 79"],
    [0, 3, 0, 79, "C", "the medium cap absorbs a few medium flags"],
    [0, 4, 0, 72, "C", "deductions show inside C"],
    [0, 5, 0, 70, "C", "medium flags alone floor at 70, so they never reach D"],
    [0, 12, 9, 70, "C", "many medium and low flags still never reach D"],
    [1, 0, 0, 69, "D", "one high flag caps at 69, never C"],
    [1, 2, 0, 69, "D", "the high cap absorbs two medium flags"],
    [1, 3, 0, 63, "D", "deductions show inside D"],
    [1, 4, 0, 60, "D", "one high flag floors at 60, so it never reaches F"],
    [1, 10, 10, 60, "D", "one high flag and many others stays D"],
    [2, 0, 0, 59, "F", "two high flags cap at 59"],
    [3, 0, 0, 52, "F", "deductions show inside F"],
    [6, 0, 0, 4, "F", "six high flags"],
    [7, 0, 0, 1, "F", "clamped to 1, never 0 or below"],
    [20, 20, 20, 1, "F", "clamped to 1 at any volume"],
  ])("%i high, %i medium, %i low scores %i (%s): %s", (high, medium, low, score, grade) => {
    const result = scored(high, medium, low);
    expect(result).toEqual({
      available: true,
      version: SCORE_VERSION,
      score,
      grade,
      label: GRADE_BANDS.find((band) => band.grade === grade)?.label,
      counts: { high, medium, low, total: high + medium + low },
    });
  });

  it("never rises when a flag is added", () => {
    for (let high = 0; high <= 8; high += 1) {
      for (let medium = 0; medium <= 8; medium += 1) {
        for (let low = 0; low <= 8; low += 1) {
          const base = scoreFromCounts({ high, medium, low, total: high + medium + low });
          for (const [h, m, l] of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) {
            const more = { high: high + h, medium: medium + m, low: low + l, total: high + medium + low + 1 };
            expect(scoreFromCounts(more)).toBeLessThanOrEqual(base);
          }
        }
      }
    }
  });

  it("gives both roles the same score for the same flags", () => {
    for (const [high, medium, low] of [[0, 0, 0], [0, 0, 5], [0, 2, 1], [1, 1, 1], [3, 2, 0]]) {
      const renter = scored(high, medium, low, "renter");
      const landlord = scored(high, medium, low, "landlord");
      expect(landlord).toEqual(renter);
    }
  });
});

describe("distinct counting", () => {
  it("counts a flag once however many passages it cites", () => {
    const result = scoreFromOutcome(reviewed(review([
      riskFlag("pasted-lease#0-11", "high", 3),
      riskFlag("pasted-lease#20-40", "medium", 1),
    ])));
    expect(result).toMatchObject({ available: true, score: 69, counts: { high: 1, medium: 1, low: 0, total: 2 } });
  });

  it("counts a repeated id once, at its more serious severity", () => {
    expect(countDistinctFlags([
      { id: "a", severity: "low" },
      { id: "a", severity: "high" },
      { id: "b", severity: "medium" },
    ])).toEqual({ high: 1, medium: 1, low: 0, total: 2 });
  });

  it("ignores coverage not-found topics", () => {
    const withAbsences = review([], {
      coverage: { items: [
        { status: "not-found", topicId: "repairs" },
        { status: "not-found", topicId: "dispute-routes" },
      ] },
      clean: true,
    });
    expect(scoreFromOutcome(reviewed(withAbsences))).toMatchObject({ available: true, score: 100, grade: "A" });
  });
});

describe("score unavailable", () => {
  it.each([
    ["blocked", { status: "blocked", documents: [], completeness: {} }, "incomplete-packet"],
    ["out-of-scope", { status: "out-of-scope", documents: [], completeness: {} }, "out-of-scope"],
    ["unverified", { status: "unverified", documents: [], completeness: {} }, "completeness-unverified"],
    ["failed", { status: "failed", reason: "model-timeout" }, "review-failed"],
    ["rejected", { status: "rejected", reason: "empty-text" }, "request-rejected"],
  ])("a %s outcome has no score", (_, outcome, reason) => {
    expect(scoreFromOutcome(outcome as AnalysisOutcome)).toEqual({
      available: false,
      version: SCORE_VERSION,
      reason,
      explanation: UNAVAILABLE_EXPLANATIONS[reason as keyof typeof UNAVAILABLE_EXPLANATIONS],
    });
  });

  it("withholds the score when any proposed flag was dropped, and keeps the verified counts", () => {
    const result = scoreFromOutcome(reviewed(review(
      [riskFlag("pasted-lease#0-11", "low")],
      { droppedFlagCount: 1 },
    )));
    expect(result).toMatchObject({
      available: false,
      reason: "unverified-flags",
      counts: { high: 0, medium: 0, low: 1, total: 1 },
    });
  });

  it("withholds the score even when the verified flags already sit at the floor", () => {
    const many = Array.from({ length: 8 }, (_, index) => riskFlag(`pasted-lease#${index}`, "high"));
    expect(scoreFromOutcome(reviewed(review(many, { droppedFlagCount: 2 })))).toMatchObject({
      available: false,
      reason: "unverified-flags",
    });
  });

  it("scores a saved role-aware review the same way as the in-tab one", () => {
    const generalReview = review([riskFlag("pasted-lease#0-11", "high"), riskFlag("pasted-lease#20-30", "high")]);
    const stored = { review: generalReview } as StoredReview;
    expect(scoreFromStoredReview(stored)).toEqual(scoreFromOutcome(reviewed(generalReview)));
    expect(scoreFromStoredReview(stored)).toMatchObject({ available: true, score: 59, grade: "F" });
  });

  it("does not score a saved review from before role selection", () => {
    const legacy = review([riskFlag("pasted-lease#0-11", "medium")], { role: undefined });
    expect(scoreFromStoredReview({ review: legacy })).toMatchObject({ available: false, reason: "legacy-review" });
  });

  it.each([
    ["an unknown severity", review([{ ...riskFlag("x", "low"), severity: "critical" as Severity }])],
    ["a missing drop count", review([], { droppedFlagCount: undefined as unknown as number })],
    ["a negative drop count", review([], { droppedFlagCount: -1 })],
    ["a fractional drop count", review([], { droppedFlagCount: 0.5 })],
    ["no flag list", { ...review([]), riskFlags: undefined as unknown as RiskFlag[] }],
  ])("does not score stored data with %s", (_, generalReview) => {
    expect(scoreFromStoredReview({ review: generalReview })).toMatchObject({
      available: false,
      reason: "unscoreable-data",
    });
  });

  it("does not score a missing stored review", () => {
    expect(scoreFromStoredReview({ review: undefined as unknown as GeneralReview })).toMatchObject({
      available: false,
      reason: "unscoreable-data",
    });
  });
});

describe("validation on fixture-shaped reviews", () => {
  // Expected severities from the synthetic fixture sidecars (tests/fixtures/*.json).
  it.each([
    ["clean-lease.json: no planted flags", 0, 0, 0, 100, "A"],
    ["adhesion-lease.json: 5 high, 4 medium", 5, 4, 0, 1, "F"],
    ["referencing packet with fee schedule and pet addendum: 2 high, 5 medium", 2, 5, 0, 33, "F"],
    ["fee-schedule.json alone: 1 high, 1 medium", 1, 1, 0, 69, "D"],
    ["pet-addendum.json alone: 2 medium", 0, 2, 0, 79, "C"],
  ])("%s", (_, high, medium, low, score, grade) => {
    expect(scored(high, medium, low)).toMatchObject({ score, grade });
  });

  it.each([
    ["renter", 69, { high: 1, medium: 2, low: 0, total: 3 }],
    ["landlord", 69, { high: 1, medium: 1, low: 1, total: 3 }],
  ] as const)("the role fixture run through the real pipeline scores the %s report", async (role, score, counts) => {
    const generalReview = await runGeneralReview({
      role,
      model: roleFixtureModel,
      packet: { documents: [
        { id: "pasted-lease", title: "Lease", text: lease },
        { id: "supplied-2", title: "Fee Addendum", text: addendum },
      ] },
    });
    expect(generalReview.droppedFlagCount).toBe(0);
    expect(scoreFromOutcome(reviewed(generalReview))).toMatchObject({ available: true, score, grade: "D", counts });
  });
});

describe("copy", () => {
  const copy = [
    SCORE_UNAVAILABLE_LABEL,
    HOW_WE_SCORE.title,
    ...HOW_WE_SCORE.paragraphs,
    ...GRADE_BANDS.map((band) => band.label),
    ...Object.values(UNAVAILABLE_EXPLANATIONS),
  ];

  it.each(copy)("states no legal conclusion: %s", (text) => {
    expect(findLegalClaims(text)).toEqual([]);
  });

  it("uses no dashes and never calls a lease safe, good or bad", () => {
    for (const text of copy) {
      expect(text).not.toMatch(/[–—]/);
      expect(text).not.toMatch(/\b(safe|good lease|bad lease|guarantee)/i);
    }
  });
});
