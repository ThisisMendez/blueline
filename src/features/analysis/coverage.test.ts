import { describe, expect, it } from "vitest";

import type { AccountsState } from "@/features/auth/session";
import { InMemoryReviewStore } from "@/features/library/memory-store";
import type { Packet } from "@/features/packet/types";

import {
  createFixtureModelClient,
  UNQUOTABLE_SENTENCE,
} from "~tests/support/fixture-model-client";
import { CHECKLIST_TOPIC_IDS, loadFixture } from "~tests/fixtures/index";

import { runGeneralReview } from "./review";
import { CHECKLIST_SCHEMA_NAME, type ModelChecklist } from "./model/checklist-schema";
import { createAnalysisRoute } from "./server/route";
import {
  foundTopics,
  notFoundItems,
  type AnalysisOutcome,
  type CoverageChecklist,
  type NotFoundItem,
} from "./types";

const DOCUMENT_ID = "pasted-lease";

function packetFor(fixtureId: "adhesion-lease" | "clean-lease"): {
  packet: Packet;
  text: string;
} {
  const { text } = loadFixture(fixtureId);
  return {
    text,
    packet: {
      documents: [{ id: DOCUMENT_ID, title: "Lease text you pasted", text }],
    },
  };
}

function topicIds(checklist: CoverageChecklist): string[] {
  return checklist.items.map((item) => item.topicId);
}

describe("the coverage checklist on an agreement that covers all six topics", () => {
  it("reports every topic found, each quoting the signer's own text", async () => {
    const { packet, text } = packetFor("adhesion-lease");
    const { sidecar } = loadFixture("adhesion-lease");
    const model = createFixtureModelClient({ behaviour: "correct" });

    const review = await runGeneralReview({ packet, model });

    expect(topicIds(review.coverage)).toEqual([...CHECKLIST_TOPIC_IDS]);
    expect(notFoundItems(review.coverage)).toEqual([]);
    expect(foundTopics(review.coverage)).toHaveLength(6);

    for (const topic of foundTopics(review.coverage)) {
      const adjudicated = sidecar.checklistTopics[topic.topicId];
      expect(adjudicated.present).toBe(true);
      expect(topic.sourceDocumentId).toBe(DOCUMENT_ID);
      // The sentence on screen is the slice of the signer's own text.
      expect(text.slice(topic.sourceStart, topic.sourceEnd)).toBe(topic.sourceSentence);
      expect(text).toContain(topic.sourceSentence);
      if (adjudicated.present) {
        expect(topic.sourceSentence).toBe(adjudicated.sourceSentence);
      }
    }
  });

  it("asks the model about the published six and nothing else", async () => {
    const { packet } = packetFor("adhesion-lease");
    const model = createFixtureModelClient({ behaviour: "correct" });

    await runGeneralReview({ packet, model });

    expect(model.checklistRequests).toHaveLength(1);
    const schema = model.checklistRequests[0].jsonSchema as {
      properties: {
        topics: { items: { properties: { topicId: { enum: string[] } } } };
      };
    };
    expect(schema.properties.topics.items.properties.topicId.enum).toEqual([
      ...CHECKLIST_TOPIC_IDS,
    ]);
  });
});

describe("the coverage checklist on an agreement that leaves two topics out", () => {
  it("reports exactly the absent topics as not-found items, apart from the risk flags", async () => {
    const { packet } = packetFor("clean-lease");
    const model = createFixtureModelClient({ behaviour: "correct" });

    const review = await runGeneralReview({ packet, model });

    expect(notFoundItems(review.coverage).map((item) => item.topicId)).toEqual([
      "repairs",
      "dispute-routes",
    ]);
    expect(foundTopics(review.coverage)).toHaveLength(4);

    // The absences are in their own category and nowhere near the flags.
    expect(review.riskFlags).toEqual([]);
    const flagged = JSON.stringify(review.riskFlags);
    expect(flagged).not.toContain("repairs");
    expect(flagged).not.toContain("dispute-routes");
  });

  it("leaves the clean review clean: two absences are not two warnings", async () => {
    const { packet } = packetFor("clean-lease");
    const model = createFixtureModelClient({ behaviour: "correct" });

    const review = await runGeneralReview({ packet, model });

    expect(review.clean).toBe(true);
    expect(review.cleanStatement).toBe("No material flags found in the text reviewed");
    expect(review.droppedFlagCount).toBe(0);
  });

  it("gives a not-found item nowhere to carry a quotation", async () => {
    const { packet, text } = packetFor("clean-lease");
    const model = createFixtureModelClient({ behaviour: "correct" });

    const review = await runGeneralReview({ packet, model });
    const [absent] = notFoundItems(review.coverage);

    // Structural, not cosmetic: the value holds a status and a topic id, and
    // there is no other field on it at all.
    expect(Object.keys(absent).sort()).toEqual(["status", "topicId"]);
    expect("sourceSentence" in absent).toBe(false);
    expect("sourceDocumentId" in absent).toBe(false);
    expect("severity" in absent).toBe(false);

    // Nor does one arrive by a round trip through the wire.
    const roundTripped = JSON.parse(JSON.stringify(absent)) as Record<string, unknown>;
    expect(Object.keys(roundTripped).sort()).toEqual(["status", "topicId"]);

    // And no part of the lease text can have reached it.
    for (const value of Object.values(absent as unknown as Record<string, unknown>)) {
      if (typeof value !== "string") continue;
      expect(text).not.toContain(value);
    }

    const written: NotFoundItem = {
      status: "not-found",
      topicId: "repairs",
      // @ts-expect-error — a not-found item has no field a quotation fits in.
      sourceSentence: "The Owner will repair the roof.",
    };
    expect(written.topicId).toBe("repairs");
  });
});

describe("the coverage checklist on a complete agreement of several documents", () => {
  const referencing = loadFixture("referencing-lease");
  const feeSchedule = loadFixture("fee-schedule");
  const petAddendum = loadFixture("pet-addendum");

  /** The cost of leaving early, which lives in the schedule and nowhere else. */
  const EARLY_EXIT_IN_THE_SCHEDULE = feeSchedule.sidecar.plantedFlags.find(
    (flag) => flag.category === "early-exit",
  )!.sourceSentence;

  function completePacketRoute(topicCitations: Record<string, string>) {
    const accounts: AccountsState = {
      kind: "signed-in",
      signer: { id: "signer-a", email: "a@example.test" },
    };
    return createAnalysisRoute({
      model: createFixtureModelClient({ behaviour: "correct", topicCitations }),
      accounts: async () => accounts,
      store: async () => new InMemoryReviewStore(),
      now: () => new Date("2027-05-01T09:00:00.000Z"),
      newReviewId: () => "review-1",
    });
  }

  it("counts a topic addressed only in a referenced document as found", async () => {
    // The lease says the charge for leaving early is whatever the schedule
    // says; only the schedule says what it is. Read as one agreement, the
    // topic is covered — and the citation points at the schedule.
    expect(referencing.text).not.toContain(EARLY_EXIT_IN_THE_SCHEDULE);
    expect(feeSchedule.text).toContain(EARLY_EXIT_IN_THE_SCHEDULE);

    const response = await completePacketRoute({
      "early-exit-costs": EARLY_EXIT_IN_THE_SCHEDULE,
    })(
      new Request("http://localhost/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: referencing.text,
          title: "Residential Lease Agreement",
          referenced: [
            { title: "Schedule of Resident Fees", text: feeSchedule.text },
            { title: "Pet Addendum", text: petAddendum.text },
          ],
        }),
      }),
    );

    const outcome = (await response.json()) as AnalysisOutcome;
    expect(outcome.status).toBe("reviewed");
    if (outcome.status !== "reviewed") return;

    expect(notFoundItems(outcome.review.coverage)).toEqual([]);

    const earlyExit = foundTopics(outcome.review.coverage).find(
      (topic) => topic.topicId === "early-exit-costs",
    );
    expect(earlyExit).toBeDefined();
    expect(earlyExit!.sourceDocumentId).toBe("supplied-2");
    expect(earlyExit!.sourceSentence).toBe(EARLY_EXIT_IN_THE_SCHEDULE);
    expect(feeSchedule.text.slice(earlyExit!.sourceStart, earlyExit!.sourceEnd)).toBe(
      earlyExit!.sourceSentence,
    );
  }, 20_000);
});

describe("the coverage checklist when the model answers badly", () => {
  it.each(["duplicate", "null-citation", "wrong-document"])("rejects %s answers without publishing false coverage", async (failure) => {
    const { packet } = packetFor("adhesion-lease");
    const fixture = createFixtureModelClient();
    const model = {
      async complete(request: Parameters<typeof fixture.complete>[0]) {
        const answer = await fixture.complete(request);
        if (request.schemaName !== CHECKLIST_SCHEMA_NAME) return answer;
        const checklist = answer as ModelChecklist;
        const topics = [...checklist.topics];
        if (failure === "duplicate") topics.push(topics[0]);
        if (failure === "null-citation") topics[0] = { ...topics[0], sourceSentence: null };
        if (failure === "wrong-document") topics[0] = { ...topics[0], sourceDocumentId: "another-lease" };
        return { topics };
      },
    };
    await expect(runGeneralReview({ packet, model })).rejects.toMatchObject({
      kind: failure === "wrong-document" ? "verification-failed" : "unreadable",
    });
  });

  it("recovers a checklist citation corrected on the single retry", async () => {
    const { packet } = packetFor("adhesion-lease");
    const fixture = createFixtureModelClient();
    let attempts = 0;
    const model = {
      async complete(request: Parameters<typeof fixture.complete>[0]) {
        const answer = await fixture.complete(request);
        if (request.schemaName !== CHECKLIST_SCHEMA_NAME || ++attempts > 1) return answer;
        const checklist = answer as ModelChecklist;
        return { topics: checklist.topics.map((topic) => topic.topicId === "repairs"
          ? { ...topic, sourceSentence: UNQUOTABLE_SENTENCE }
          : topic) };
      },
    };
    const review = await runGeneralReview({ packet, model });
    expect(foundTopics(review.coverage)).toHaveLength(6);
    expect(notFoundItems(review.coverage)).toEqual([]);
    expect(attempts).toBe(2);
  });

  it("discards a topic nobody published", async () => {
    const { packet, text } = packetFor("adhesion-lease");
    const { sidecar } = loadFixture("adhesion-lease");
    const inventedSentence = sidecar.harmlessOddities[0].sourceSentence;
    const model = createFixtureModelClient({
      behaviour: "correct",
      inventedTopics: [
        { topicId: "quiet-enjoyment", sourceSentence: inventedSentence },
      ],
    });

    const review = await runGeneralReview({ packet, model });

    expect(text).toContain(inventedSentence);
    expect(topicIds(review.coverage)).toEqual([...CHECKLIST_TOPIC_IDS]);
    expect(topicIds(review.coverage)).not.toContain("quiet-enjoyment");
    // Not displayed anywhere: the sentence it quoted is gone with it.
    expect(JSON.stringify(review.coverage)).not.toContain("quiet-enjoyment");
    expect(JSON.stringify(review.coverage)).not.toContain(inventedSentence);
  });

  it("fails verification instead of declaring a topic absent when its citation never verifies", async () => {
    const { packet } = packetFor("adhesion-lease");
    const model = createFixtureModelClient({
      behaviour: "correct",
      topicCitations: { repairs: UNQUOTABLE_SENTENCE },
    });

    await expect(runGeneralReview({ packet, model })).rejects.toMatchObject({
      kind: "verification-failed",
    });
    // One retry, then the unverifiable citation is gone rather than shown.
    expect(model.checklistRequests).toHaveLength(2);
    expect(model.checklistRequests[1].user).toContain(UNQUOTABLE_SENTENCE);
  });

  it("rejects a missing checklist answer instead of inventing an absence", async () => {
    const { packet } = packetFor("adhesion-lease");
    const fixture = createFixtureModelClient();
    const model = {
      async complete(request: Parameters<typeof fixture.complete>[0]) {
        if (request.schemaName === CHECKLIST_SCHEMA_NAME) return { topics: [] };
        return fixture.complete(request);
      },
    };

    await expect(runGeneralReview({ packet, model })).rejects.toMatchObject({
      kind: "unreadable",
    });
  });
});

describe("what a not-found item is allowed to say", () => {
  it("makes no claim about the law anywhere in the checklist result", async () => {
    const { packet } = packetFor("clean-lease");
    const model = createFixtureModelClient({ behaviour: "correct" });

    const review = await runGeneralReview({ packet, model });
    const everything = JSON.stringify(review.coverage).toLowerCase();

    for (const forbidden of [
      "unlawful",
      "illegal",
      "invalid",
      "non-compliant",
      "noncompliant",
      "must include",
      "required by law",
      "should have included",
      "safe to sign",
      "enforceab",
    ]) {
      expect(everything).not.toContain(forbidden);
    }
  });
});
