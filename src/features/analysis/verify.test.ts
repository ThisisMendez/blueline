import { describe, expect, it } from "vitest";

import type { Packet } from "@/features/packet/types";

import { loadFixture } from "~tests/fixtures/index";

import { verifyFlags } from "./verify";

const { text, sidecar } = loadFixture("adhesion-lease");
const packet: Packet = {
  documents: [{ id: "pasted-lease", title: "Lease text you pasted", text }],
};

const planted = sidecar.plantedFlags[0];

function candidate(overrides: Partial<{ sourceSentence: string; sourceDocumentId: string }>) {
  return {
    severity: "high" as const,
    consequence: planted.consequence,
    triggeringCondition: planted.triggeringCondition,
    counterOffer: planted.counterOffer,
    residualRisk: planted.residualRisk,
    sourceDocumentId: "pasted-lease",
    sourceSentence: planted.sourceSentence,
    ...overrides,
  };
}

describe("citation verification", () => {
  it("shows the document's own sentence, not the quotation it was sent", () => {
    // The model re-wraps the sentence across lines, as a model does.
    const rewrapped = planted.sourceSentence.replace(/ /g, "\n   ");

    const { verified, rejected } = verifyFlags([candidate({ sourceSentence: rewrapped })], packet);

    expect(rejected).toEqual([]);
    expect(verified).toHaveLength(1);
    expect(verified[0].sourceSentence).toBe(planted.sourceSentence);
    expect(verified[0].sourceSentence).not.toBe(rewrapped);
    expect(text.slice(verified[0].sourceStart, verified[0].sourceEnd)).toBe(
      verified[0].sourceSentence,
    );
  });

  it("rejects a quotation that is nowhere in the text, and one that names no document", () => {
    const result = verifyFlags(
      [
        candidate({ sourceSentence: "The Resident shall repaint the sky each spring." }),
        candidate({ sourceDocumentId: "some-other-lease" }),
      ],
      packet,
    );

    expect(result.verified).toEqual([]);
    expect(result.rejected.map((rejection) => rejection.reason)).toEqual([
      "quotation-not-found",
      "unknown-document",
    ]);
  });

  it("keeps one flag when the same sentence is cited twice", () => {
    const { verified } = verifyFlags([candidate({}), candidate({})], packet);
    expect(verified).toHaveLength(1);
  });
});
