import { describe, expect, it } from "vitest";

import { checkCompleteness } from "@/features/packet/completeness";
import type { Packet } from "@/features/packet/types";
import { createQuestionRoute } from "@/features/questions/route";
import { QUESTION_SCHEMA_NAME } from "@/features/questions/contract";

import { loadFixture } from "~tests/fixtures/index";
import { createFixtureModelClient } from "~tests/support/fixture-model-client";

import { runCoverageChecklist } from "./coverage";
import { CHECKLIST_SCHEMA_NAME } from "./model/checklist-schema";
import { COMPLETENESS_SCHEMA_NAME } from "./model/completeness-schema";
import { CONSISTENCY_SCHEMA_NAME } from "./model/consistency-schema";
import { ANALYSIS_SCHEMA_NAME } from "./model/schema";
import { runGeneralReview } from "./review";
import { createAnalysisRoute } from "./server/route";
import type { AnalysisOutcome } from "./types";

/**
 * Decision 6: a reply in the wrong shape is retried once, with the
 * validation problems, before anything uses it; a second bad reply fails the
 * call as unreadable, exactly as before. Each structured call on the review
 * path is checked for all three cases.
 */

const lease = loadFixture("adhesion-lease");
const packet: Packet = { documents: [{ id: "pasted-lease", title: "Lease text you pasted", text: lease.text }] };

function analysisRoute(invalidReplies: Record<string, number>) {
  return createAnalysisRoute({
    model: createFixtureModelClient({ invalidReplies }),
    accounts: async () => ({ kind: "unconfigured" }),
    store: async () => null,
    now: () => new Date("2027-02-01T09:00:00.000Z"),
    newReviewId: () => "review-1",
  });
}

async function analyse(invalidReplies: Record<string, number>): Promise<AnalysisOutcome> {
  const response = await analysisRoute(invalidReplies)(new Request("http://localhost/api/analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "renter", text: lease.text }),
  }));
  return (await response.json()) as AnalysisOutcome;
}

describe("the analysis call", () => {
  it("uses a valid first reply with no retry", async () => {
    const model = createFixtureModelClient();
    const review = await runGeneralReview({ role: "renter", packet, model });
    expect(review.riskFlags.length).toBeGreaterThan(0);
    expect(model.analysisRequests).toHaveLength(1);
  });

  it("recovers an invalid first reply with one retry and keeps every flag", async () => {
    const expected = await runGeneralReview({ role: "renter", packet, model: createFixtureModelClient() });
    const model = createFixtureModelClient({ invalidReplies: { [ANALYSIS_SCHEMA_NAME]: 1 } });
    const review = await runGeneralReview({ role: "renter", packet, model });
    expect(model.analysisRequests).toHaveLength(2);
    expect(model.analysisRequests[1].retryAfterInvalidReply).toBe(true);
    expect(review.riskFlags).toEqual(expected.riskFlags);
    expect(review.summary).toBe(expected.summary);
  });

  it("fails as unreadable when the retry is invalid too", async () => {
    const model = createFixtureModelClient({ invalidReplies: { [ANALYSIS_SCHEMA_NAME]: 2 } });
    await expect(runGeneralReview({ role: "renter", packet, model })).rejects.toMatchObject({ kind: "unreadable" });
    expect(model.analysisRequests).toHaveLength(2);
  });
});

describe("the coverage checklist call", () => {
  it("uses a valid first reply with no retry", async () => {
    const model = createFixtureModelClient();
    const checklist = await runCoverageChecklist({ packet, model });
    expect(checklist.items).toHaveLength(6);
    expect(model.checklistRequests).toHaveLength(1);
  });

  it("recovers an invalid first reply with one retry and answers all six topics", async () => {
    const expected = await runCoverageChecklist({ packet, model: createFixtureModelClient() });
    const model = createFixtureModelClient({ invalidReplies: { [CHECKLIST_SCHEMA_NAME]: 1 } });
    await expect(runCoverageChecklist({ packet, model })).resolves.toEqual(expected);
    expect(model.checklistRequests).toHaveLength(2);
  });

  it("fails as unreadable when the retry is invalid too", async () => {
    const model = createFixtureModelClient({ invalidReplies: { [CHECKLIST_SCHEMA_NAME]: 2 } });
    await expect(runCoverageChecklist({ packet, model })).rejects.toMatchObject({ kind: "unreadable" });
    expect(model.checklistRequests).toHaveLength(2);
  });

  it("reads an empty string for a not-found citation as null, with no retry", async () => {
    const fixture = createFixtureModelClient();
    const model = {
      async complete(request: Parameters<typeof fixture.complete>[0]) {
        const reply = (await fixture.complete(request)) as { topics: Record<string, unknown>[] };
        return { topics: reply.topics.map((topic) => topic.status === "not-found"
          ? { ...topic, sourceDocumentId: "", sourceSentence: "" }
          : topic) };
      },
    };
    const expected = await runCoverageChecklist({ packet, model: createFixtureModelClient() });
    await expect(runCoverageChecklist({ packet, model })).resolves.toEqual(expected);
    expect(fixture.checklistRequests).toHaveLength(1);
  });
});

describe("the consistency call", () => {
  it("recovers an invalid first reply with one retry and keeps every residual risk", async () => {
    const expected = await runGeneralReview({ role: "renter", packet, model: createFixtureModelClient() });
    const model = createFixtureModelClient({ invalidReplies: { [CONSISTENCY_SCHEMA_NAME]: 1 } });
    const review = await runGeneralReview({ role: "renter", packet, model });
    expect(model.consistencyRequests).toHaveLength(2);
    expect(review.riskFlags).toEqual(expected.riskFlags);
  });

  it("fails as unreadable when the retry is invalid too", async () => {
    const model = createFixtureModelClient({ invalidReplies: { [CONSISTENCY_SCHEMA_NAME]: 2 } });
    await expect(runGeneralReview({ role: "renter", packet, model })).rejects.toMatchObject({ kind: "unreadable" });
  });
});

describe("the completeness call", () => {
  it("recovers an invalid first reply with one retry", async () => {
    const model = createFixtureModelClient({ invalidReplies: { [COMPLETENESS_SCHEMA_NAME]: 1 } });
    await expect(checkCompleteness({ packet, model })).resolves.toMatchObject({ kind: "complete" });
    expect(model.completenessRequests).toHaveLength(2);
  });

  it("fails as unreadable when the retry is invalid too", async () => {
    const model = createFixtureModelClient({ invalidReplies: { [COMPLETENESS_SCHEMA_NAME]: 2 } });
    await expect(checkCompleteness({ packet, model })).rejects.toMatchObject({ kind: "unreadable" });
  });
});

describe("the question call", () => {
  const question = lease.sidecar.qa.answerable[0];
  const post = () => new Request("http://localhost/api/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: question.question, documents: [{ id: "lease", title: "Lease", text: lease.text }] }),
  });

  it("recovers an invalid first reply with one retry and still answers from the lease", async () => {
    const model = createFixtureModelClient({ invalidReplies: { [QUESTION_SCHEMA_NAME]: 1 } });
    const answer = await (await createQuestionRoute(model)(post())).json();
    expect(answer.status).toBe("answered");
    expect(answer.citations[0].sourceSentence).toBe(question.expectedSourceSentence);
  });

  it("fails as unreadable when the retry is invalid too", async () => {
    const model = createFixtureModelClient({ invalidReplies: { [QUESTION_SCHEMA_NAME]: 2 } });
    const response = await createQuestionRoute(model)(post());
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ status: "failed", reason: "unreadable" });
  });
});

describe("the analysis route", () => {
  it("reviews the lease when every call's first reply is invalid and every retry is valid", async () => {
    const outcome = await analyse({
      [COMPLETENESS_SCHEMA_NAME]: 1,
      [ANALYSIS_SCHEMA_NAME]: 1,
      [CHECKLIST_SCHEMA_NAME]: 1,
      [CONSISTENCY_SCHEMA_NAME]: 1,
    });
    expect(outcome.status).toBe("reviewed");
  });

  it("keeps the existing unreadable failure when a retry is invalid too", async () => {
    await expect(analyse({ [CHECKLIST_SCHEMA_NAME]: 2 })).resolves.toEqual({ status: "failed", reason: "model-unreadable" });
  });
});
