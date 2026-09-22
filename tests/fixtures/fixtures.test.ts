import { describe, expect, it } from "vitest";

import {
  ADHESION_LEASE,
  CHECKLIST_TOPIC_IDS,
  CLEAN_LEASE,
  FEE_SCHEDULE,
  PET_ADDENDUM,
  REFERENCING_LEASE,
  type ChecklistTopicId,
  type FixtureId,
  type FlagCategory,
  type LeaseFixtureId,
  fixtureReferences,
  loadFixture,
} from "./index";

const FORBIDDEN_REFERENCE_WORDS = [
  "schedule",
  "addendum",
  "exhibit",
  "incorporated by reference",
  "rules and regulations",
] as const;

const FIXTURE_IDS: readonly LeaseFixtureId[] = [
  ADHESION_LEASE,
  CLEAN_LEASE,
  REFERENCING_LEASE,
];

/** Every fixture in the corpus, lease or referenced document. */
const ALL_FIXTURE_IDS: readonly FixtureId[] = [
  ADHESION_LEASE,
  CLEAN_LEASE,
  REFERENCING_LEASE,
  FEE_SCHEDULE,
  PET_ADDENDUM,
];

function occurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

describe.each(FIXTURE_IDS)("fixture %s", (id) => {
  const { text, sidecar } = loadFixture(id);

  it("describes itself with the id and filename it was loaded under", () => {
    expect(sidecar.documentId).toBe(id);
    expect(sidecar.file).toBe(`${id}.txt`);
    expect(sidecar.summary.length).toBeGreaterThan(200);
  });

  it("quotes every planted flag verbatim and exactly once", () => {
    for (const flag of sidecar.plantedFlags) {
      expect(text.includes(flag.sourceSentence), `${flag.id} not found verbatim`).toBe(true);
      expect(occurrences(text, flag.sourceSentence), `${flag.id} is not unique`).toBe(1);
      expect(flag.consequence.length).toBeGreaterThan(0);
      expect(flag.triggeringCondition.length).toBeGreaterThan(0);
      expect(flag.counterOffer.length).toBeGreaterThan(0);
      expect(flag.residualRisk.length).toBeGreaterThan(0);
    }
  });

  it("gives every planted flag a unique kebab-case id", () => {
    const ids = sidecar.plantedFlags.map((flag) => flag.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const flagId of ids) {
      expect(flagId).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("quotes every harmless oddity verbatim and exactly once", () => {
    expect(sidecar.harmlessOddities.length).toBeGreaterThanOrEqual(2);
    for (const oddity of sidecar.harmlessOddities) {
      expect(text.includes(oddity.sourceSentence), oddity.sourceSentence).toBe(true);
      expect(occurrences(text, oddity.sourceSentence), oddity.sourceSentence).toBe(1);
    }
  });

  it("keeps harmless oddities out of the planted flag list", () => {
    const flagged = new Set(sidecar.plantedFlags.map((flag) => flag.sourceSentence));
    for (const oddity of sidecar.harmlessOddities) {
      expect(flagged.has(oddity.sourceSentence)).toBe(false);
    }
  });

  it("carries the six published checklist topics and cites each present one", () => {
    expect(Object.keys(sidecar.checklistTopics).sort()).toEqual([...CHECKLIST_TOPIC_IDS].sort());
    for (const topicId of CHECKLIST_TOPIC_IDS) {
      const topic = sidecar.checklistTopics[topicId];
      if (topic.present) {
        expect(text.includes(topic.sourceSentence), `${topicId} not found verbatim`).toBe(true);
      } else {
        expect(Object.hasOwn(topic, "sourceSentence")).toBe(false);
      }
    }
  });

  it("quotes every answerable question's source sentence verbatim", () => {
    expect(sidecar.qa.answerable.length).toBeGreaterThanOrEqual(3);
    for (const entry of sidecar.qa.answerable) {
      expect(text.includes(entry.expectedSourceSentence), entry.question).toBe(true);
      expect(entry.expectedAnswer.length).toBeGreaterThan(0);
    }
  });

  it("lists at least two questions the agreement does not answer", () => {
    expect(sidecar.qa.unanswerable.length).toBeGreaterThanOrEqual(2);
    for (const entry of sidecar.qa.unanswerable) {
      expect(entry.question.length).toBeGreaterThan(0);
    }
  });

  it("points every red line at a sentence that is in the document", () => {
    expect(sidecar.redLines.length).toBeGreaterThanOrEqual(1);
    for (const redLine of sidecar.redLines) {
      expect(text.includes(redLine.expectedMatchSentence), redLine.redLine).toBe(true);
    }
  });

  it("is long enough to read like a real lease", () => {
    expect(wordCount(text)).toBeGreaterThanOrEqual(1500);
  });

  it("uses only straight ASCII quotes and apostrophes", () => {
    expect(text).not.toMatch(/[‘’“”]/);
    expect(JSON.stringify(sidecar)).not.toMatch(/[‘’“”]/);
  });
});

describe("adhesion lease", () => {
  const { sidecar } = loadFixture(ADHESION_LEASE);

  it("plants at least seven risk flags", () => {
    expect(sidecar.plantedFlags.length).toBeGreaterThanOrEqual(7);
  });

  it("covers all four clause categories", () => {
    const categories: readonly FlagCategory[] = ["deposit", "early-exit", "dispute-rights", "other"];
    for (const category of categories) {
      const inCategory = sidecar.plantedFlags.filter((flag) => flag.category === category);
      expect(inCategory.length, `no planted flag in ${category}`).toBeGreaterThanOrEqual(1);
    }
  });

  it("plants a high-severity flag in each money and rights category", () => {
    const categories: readonly FlagCategory[] = ["deposit", "early-exit", "dispute-rights"];
    for (const category of categories) {
      const high = sidecar.plantedFlags.filter(
        (flag) => flag.category === category && flag.expectedSeverity === "high",
      );
      expect(high.length, `no high-severity flag in ${category}`).toBeGreaterThanOrEqual(1);
    }
  });

  it("plants a medium-severity flag in each money and rights category", () => {
    const categories: readonly FlagCategory[] = ["deposit", "early-exit", "dispute-rights"];
    for (const category of categories) {
      const medium = sidecar.plantedFlags.filter(
        (flag) => flag.category === category && flag.expectedSeverity === "medium",
      );
      expect(medium.length, `no medium-severity flag in ${category}`).toBeGreaterThanOrEqual(1);
    }
  });

  it("finds every checklist topic in the text", () => {
    const absent = CHECKLIST_TOPIC_IDS.filter((topicId) => !sidecar.checklistTopics[topicId].present);
    expect(absent).toEqual([]);
  });

  it("gives at least two red lines that match a term in the lease", () => {
    expect(sidecar.redLines.length).toBeGreaterThanOrEqual(2);
  });
});

describe("clean lease", () => {
  const { text, sidecar } = loadFixture(CLEAN_LEASE);

  it("plants no risk flags", () => {
    expect(sidecar.plantedFlags).toEqual([]);
  });

  it("leaves exactly repairs and dispute routes as not-found items", () => {
    const absent: ChecklistTopicId[] = CHECKLIST_TOPIC_IDS.filter(
      (topicId) => !sidecar.checklistTopics[topicId].present,
    );
    expect(absent).toEqual(["repairs", "dispute-routes"]);
  });

  it("says nothing about repairs or dispute routes anywhere in the text", () => {
    const lowercased = text.toLowerCase();
    for (const word of ["repair", "maintenance", "arbitrat", "jury", "lawsuit", "small claims"]) {
      expect(lowercased.includes(word), `clean lease mentions "${word}"`).toBe(false);
    }
  });
});

describe.each([ADHESION_LEASE, CLEAN_LEASE] as const)("self-contained lease %s", (id) => {
  const { text, sidecar } = loadFixture(id);

  it("refers to no other document, so ticket 01 and 02 never meet the gate", () => {
    const lowercased = text.toLowerCase();
    for (const word of FORBIDDEN_REFERENCE_WORDS) {
      expect(lowercased.includes(word), `document mentions "${word}"`).toBe(false);
    }
    expect(sidecar.referencedDocuments).toEqual([]);
    expect(fixtureReferences(sidecar)).toEqual([]);
  });
});

describe.each(ALL_FIXTURE_IDS)("every reference %s makes", (id) => {
  const { text, sidecar } = loadFixture(id);

  it("quotes its citing sentence verbatim and exactly once", () => {
    for (const reference of fixtureReferences(sidecar)) {
      expect(
        text.includes(reference.citingSentence),
        `${reference.name} citing sentence not found verbatim`,
      ).toBe(true);
      expect(
        occurrences(text, reference.citingSentence),
        `${reference.name} citing sentence is not unique`,
      ).toBe(1);
    }
  });

  it("names the referenced document as the text itself names it", () => {
    for (const reference of fixtureReferences(sidecar)) {
      expect(reference.name.length).toBeGreaterThan(0);
      expect(text.includes(reference.name), `text never says "${reference.name}"`).toBe(true);
      expect(
        reference.citingSentence.includes(reference.name),
        `the citing sentence for "${reference.name}" does not name it`,
      ).toBe(true);
    }
  });

  it("points every reference at a fixture that exists and is not itself", () => {
    for (const reference of fixtureReferences(sidecar)) {
      expect(ALL_FIXTURE_IDS).toContain(reference.satisfiedBy);
      expect(reference.satisfiedBy).not.toBe(sidecar.documentId);
      const satisfying = loadFixture(reference.satisfiedBy);
      expect(satisfying.sidecar.documentId).toBe(reference.satisfiedBy);
    }
  });
});

describe("referencing lease", () => {
  const { text, sidecar } = loadFixture(REFERENCING_LEASE);

  it("refers to a fee schedule and a pet addendum, and to nothing else", () => {
    const references = fixtureReferences(sidecar);
    expect(references.map((reference) => reference.name)).toEqual([
      "Schedule of Resident Fees",
      "Pet Addendum",
    ]);
    expect(references.map((reference) => reference.satisfiedBy)).toEqual([
      FEE_SCHEDULE,
      PET_ADDENDUM,
    ]);
    expect(sidecar.referencedDocuments).toEqual([
      "Schedule of Resident Fees",
      "Pet Addendum",
    ]);
  });

  it("leaves the cost of ending the lease early to the schedule it names", () => {
    // The whole point of ADR 0005: reviewing this lease alone would report an
    // early exit the signer can afford, because the number lives elsewhere.
    expect(text).toContain("paying the charges the Schedule of Resident Fees sets for an early ending");
    expect(text).not.toContain("lease break administration fee");
    expect(text.toLowerCase()).not.toContain("three (3) months rent");
  });

  it("finds every checklist topic in the text", () => {
    const absent = CHECKLIST_TOPIC_IDS.filter((topicId) => !sidecar.checklistTopics[topicId].present);
    expect(absent).toEqual([]);
  });

  it("plants at least one flag in each of three categories", () => {
    const categories = new Set(sidecar.plantedFlags.map((flag) => flag.category));
    expect(categories.size).toBeGreaterThanOrEqual(3);
  });
});

describe.each([FEE_SCHEDULE, PET_ADDENDUM] as const)("referenced document %s", (id) => {
  const { text, sidecar } = loadFixture(id);

  it("describes itself with the id and filename it was loaded under", () => {
    expect(sidecar.documentId).toBe(id);
    expect(sidecar.file).toBe(`${id}.txt`);
    expect(sidecar.summary.length).toBeGreaterThan(200);
  });

  it("quotes every planted flag verbatim and exactly once", () => {
    expect(sidecar.plantedFlags.length).toBeGreaterThanOrEqual(1);
    for (const flag of sidecar.plantedFlags) {
      expect(text.includes(flag.sourceSentence), `${flag.id} not found verbatim`).toBe(true);
      expect(occurrences(text, flag.sourceSentence), `${flag.id} is not unique`).toBe(1);
      expect(flag.consequence.length).toBeGreaterThan(0);
      expect(flag.triggeringCondition.length).toBeGreaterThan(0);
      expect(flag.counterOffer.length).toBeGreaterThan(0);
      expect(flag.residualRisk.length).toBeGreaterThan(0);
    }
  });

  it("quotes every harmless oddity verbatim and exactly once", () => {
    expect(sidecar.harmlessOddities.length).toBeGreaterThanOrEqual(2);
    for (const oddity of sidecar.harmlessOddities) {
      expect(text.includes(oddity.sourceSentence), oddity.sourceSentence).toBe(true);
      expect(occurrences(text, oddity.sourceSentence), oddity.sourceSentence).toBe(1);
    }
  });

  it("keeps harmless oddities out of the planted flag list", () => {
    const flagged = new Set(sidecar.plantedFlags.map((flag) => flag.sourceSentence));
    for (const oddity of sidecar.harmlessOddities) {
      expect(flagged.has(oddity.sourceSentence)).toBe(false);
    }
  });

  it("uses only straight ASCII quotes and apostrophes", () => {
    expect(text).not.toMatch(/[‘’“”]/);
    expect(JSON.stringify(sidecar)).not.toMatch(/[‘’“”]/);
  });
});

describe("the fee schedule", () => {
  const { text, sidecar } = loadFixture(FEE_SCHEDULE);

  it("carries a high-severity early-exit cost the referencing lease never states", () => {
    const leaseText = loadFixture(REFERENCING_LEASE).text;
    const planted = sidecar.plantedFlags.find((flag) => flag.expectedSeverity === "high");
    expect(planted).toBeDefined();
    expect(planted!.category).toBe("early-exit");
    expect(text.includes(planted!.sourceSentence)).toBe(true);
    expect(leaseText.includes(planted!.sourceSentence)).toBe(false);
  });
});
