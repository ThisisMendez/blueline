import { describe, expect, it } from "vitest";

import { CHECKLIST_TOPIC_IDS } from "@/features/analysis/checklist";
import type { CoverageChecklist } from "@/features/analysis/types";
import { sampleReview } from "@/features/review/sample-report";

import { landlordRecommendations } from "./landlord-recommendations";

describe("landlord recommendations", () => {
  const review = sampleReview("landlord");
  const [first] = review.riskFlags;

  it("includes one cited priority and four known gaps within the limit", () => {
    const coverage: CoverageChecklist = {
      items: CHECKLIST_TOPIC_IDS.slice(0, 4).map((topicId) => ({ topicId, status: "not-found" })),
    };
    const recommendations = landlordRecommendations(review.riskFlags, coverage);
    expect(recommendations.map(({ kind }) => kind)).toEqual(["flag", "missing", "missing", "missing", "missing"]);
    expect(recommendations[0].citations[0].sourceSentence).toBe(first.sourceSentence);
    expect(recommendations.find(({ id }) => id === "repairs")?.draft).toContain("[repair contact]");
  });

  it("offers three cited checks when the lease covers all six topics and has no flags", () => {
    const coverage: CoverageChecklist = {
      items: CHECKLIST_TOPIC_IDS.map((topicId) => ({ ...first, topicId, status: "found" })),
    };
    const recommendations = landlordRecommendations([], coverage);
    expect(recommendations.map(({ kind }) => kind)).toEqual(["confirm", "confirm", "confirm"]);
    expect(recommendations.every(({ citations }) => citations.length === 1)).toBe(true);
  });

  it("caps a long list of cited changes and skips duplicate flags", () => {
    const flags = Array.from({ length: 9 }, (_, index) => ({ ...first, id: String(index) }));
    const recommendations = landlordRecommendations([flags[0], ...flags], { items: [] });
    expect(recommendations.map(({ id }) => id)).toEqual(["0", "1", "2", "3", "4"]);
  });
});
