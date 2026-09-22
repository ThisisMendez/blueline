import { describe, expect, it } from "vitest";

import type { Packet } from "@/features/packet/types";

import {
  createFixtureModelClient,
  UNQUOTABLE_SENTENCE,
} from "~tests/support/fixture-model-client";
import { loadFixture } from "~tests/fixtures/index";

import { runGeneralReview } from "./review";
import { CLEAN_REVIEW_STATEMENT, SEVERITY_RANK } from "./types";

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

describe("the general review of an adhesion lease", () => {
  it("returns a summary and flags ranked by consequence, each quoting the text at its offsets", async () => {
    const { packet, text } = packetFor("adhesion-lease");
    const model = createFixtureModelClient({ behaviour: "correct" });

    const review = await runGeneralReview({ packet, model });

    expect(review.summary.length).toBeGreaterThan(100);
    expect(review.clean).toBe(false);
    expect(review.cleanStatement).toBeNull();
    expect(review.droppedFlagCount).toBe(0);

    const { sidecar } = loadFixture("adhesion-lease");
    expect(review.riskFlags).toHaveLength(sidecar.plantedFlags.length);

    const ranks = review.riskFlags.map((flag) => SEVERITY_RANK[flag.severity]);
    expect(ranks).toEqual([...ranks].sort((left, right) => left - right));
    expect(review.riskFlags[0].severity).toBe("high");
    expect(review.riskFlags.at(-1)?.severity).toBe("medium");

    for (const flag of review.riskFlags) {
      expect(flag.sourceDocumentId).toBe(DOCUMENT_ID);
      // The sentence on screen is the slice of the signer's own text.
      expect(text.slice(flag.sourceStart, flag.sourceEnd)).toBe(flag.sourceSentence);
      expect(text).toContain(flag.sourceSentence);
      expect(flag.consequence.length).toBeGreaterThan(0);
      expect(flag.triggeringCondition.length).toBeGreaterThan(0);
    }
  });

  it("drops a flag whose quotation is not in the text and counts it", async () => {
    const { packet } = packetFor("adhesion-lease");
    const { sidecar } = loadFixture("adhesion-lease");
    const model = createFixtureModelClient({ behaviour: "unquotable-flag" });

    const review = await runGeneralReview({ packet, model });

    const sentences = review.riskFlags.map((flag) => flag.sourceSentence);
    expect(sentences).not.toContain(UNQUOTABLE_SENTENCE);
    expect(sentences).not.toContain(sidecar.plantedFlags[0].sourceSentence);
    expect(review.riskFlags).toHaveLength(sidecar.plantedFlags.length - 1);
    expect(review.droppedFlagCount).toBe(1);
    // One retry, then the flag is gone for good.
    expect(model.callCount).toBe(2);
  });

  it("recovers a flag the retry quotes correctly", async () => {
    const { packet, text } = packetFor("adhesion-lease");
    const { sidecar } = loadFixture("adhesion-lease");
    const model = createFixtureModelClient({ behaviour: "unquotable-then-correct" });

    const review = await runGeneralReview({ packet, model });

    expect(model.callCount).toBe(2);
    expect(review.droppedFlagCount).toBe(0);
    expect(review.riskFlags).toHaveLength(sidecar.plantedFlags.length);

    const recovered = review.riskFlags.find(
      (flag) => flag.sourceSentence === sidecar.plantedFlags[0].sourceSentence,
    );
    expect(recovered).toBeDefined();
    expect(text.slice(recovered!.sourceStart, recovered!.sourceEnd)).toBe(
      recovered!.sourceSentence,
    );

    // The retry names the quotation that failed, so the model can correct it.
    expect(model.requests[1].user).toContain(UNQUOTABLE_SENTENCE);
  });
});

describe("the general review of a clean lease", () => {
  it("reports a clean review in the product's exact words, and claims nothing more", async () => {
    const { packet } = packetFor("clean-lease");
    const model = createFixtureModelClient({ behaviour: "correct" });

    const review = await runGeneralReview({ packet, model });

    expect(review.riskFlags).toEqual([]);
    expect(review.clean).toBe(true);
    expect(review.cleanStatement).toBe("No material flags found in the text reviewed");
    expect(review.cleanStatement).toBe(CLEAN_REVIEW_STATEMENT);
    expect(review.summary.length).toBeGreaterThan(100);
    expect(review.droppedFlagCount).toBe(0);
    expect(model.callCount).toBe(1);

    const everything = JSON.stringify(review).toLowerCase();
    for (const forbidden of [
      "safe to sign",
      "safe-to-sign",
      "legally",
      "enforceab",
      "unenforceab",
      "legally valid",
      "unlawful",
      "illegal",
    ]) {
      expect(everything).not.toContain(forbidden);
    }
  });
});
