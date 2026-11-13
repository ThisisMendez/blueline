import { describe, expect, it } from "vitest";

import { CHECKLIST_TOPIC_IDS } from "@/features/analysis/checklist";
import { REVIEW_ROLES } from "@/features/analysis/types";
import { discussionShortlist } from "@/features/negotiation/shortlist";
import { scoreFromStoredReview } from "@/features/score";

import { sampleDocument, sampleReview } from "./sample-report";

describe("the fictional lease packet", () => {
  it.each(REVIEW_ROLES)("backs every %s flag and topic with an exact lease quote", (role) => {
    const review = sampleReview(role);
    expect(review.coverage.items.map(({ topicId }) => topicId)).toEqual(CHECKLIST_TOPIC_IDS);
    const citations = [
      ...review.riskFlags,
      ...review.riskFlags.flatMap(({ relatedCitations }) => relatedCitations ?? []),
      ...review.coverage.items.filter(({ status }) => status === "found"),
    ];
    for (const citation of citations) {
      expect(citation.sourceDocumentId).toBe(sampleDocument.id);
      expect(citation.sourceStart).toBeGreaterThanOrEqual(0);
      expect(sampleDocument.text.slice(citation.sourceStart, citation.sourceEnd)).toBe(citation.sourceSentence);
    }
    expect(scoreFromStoredReview({ review })).toMatchObject({ available: true, grade: "D" });
  });

  it("gives renters three terms to include in a draft", () => {
    expect(discussionShortlist(sampleReview("renter").riskFlags)).toHaveLength(3);
  });
});
