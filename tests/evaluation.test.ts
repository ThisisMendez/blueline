import { describe, expect, it } from "vitest";

import { outcomeDigest, scoreEvaluation } from "../evals/score";
import { runCorpus } from "../evals/run";

const sentence = "The signer owes all remaining rent when ending the lease early.";
const corpus = {
  id: "scorer-unit-tests-not-independent-evidence",
  partition: "development",
  locked: false,
  cases: [{
    id: "serious",
    category: "serious",
    documents: [{ id: "pasted-lease", title: "Synthetic scorer input", text: sentence }],
    adjudication: {
      reviewerIds: ["test-reviewer-a", "test-reviewer-b"],
      completedBeforeModelOutput: true,
      disagreementsResolved: true,
      seriousTerms: [{ id: "exit-obligation", documentId: "pasted-lease", sentence, severity: "high", area: "early-exit" }],
      harmlessTerms: [],
      missingDocuments: [],
    },
  }],
};

const review = {
  status: "reviewed",
  review: { riskFlags: [], clean: true, cleanStatement: "No material flags found in the text reviewed", droppedFlagCount: 0 },
};

const flag = {
  id: "exit", severity: "high", sourceSentence: sentence, sourceDocumentId: "pasted-lease",
  sourceStart: 0, sourceEnd: sentence.length,
};
function flagged(flags = [flag]) {
  return { status: "reviewed", review: { riskFlags: flags, clean: false, cleanStatement: null, droppedFlagCount: 0 } };
}

describe("independent evaluation report", () => {
  it("reports an individual serious miss in each affected run, even if other runs find the term", () => {
    const result = scoreEvaluation(corpus, [
      { caseId: "serious", run: 1, outcome: review },
      { caseId: "serious", run: 2, outcome: flagged() },
      { caseId: "serious", run: 3, outcome: flagged() },
    ]);
    expect(result.gate).toBe("blocked");
    expect(result.runs[0].seriousMisses).toEqual(["exit-obligation"]);
    expect(result.reasons).toContain("serious run 1: missed high-severity term exit-obligation");
  });

  it("rejects a quotation attributed to the wrong document and does not credit it as catching a serious term", () => {
    const result = scoreEvaluation(corpus, [{ caseId: "serious", run: 1, outcome: flagged([{ ...flag, sourceDocumentId: "other-document" }]) }]);
    expect(result.runs[0].unsupportedCitations).toEqual(["exit"]);
    expect(result.runs[0].verifiedFlags).toBe(0);
    expect(result.runs[0].seriousMisses).toEqual(["exit-obligation"]);
  });

  it("rejects fabricated quotations and incorrect offsets without normalizing them", () => {
    const result = scoreEvaluation(corpus, [{ caseId: "serious", run: 1, outcome: flagged([
      { ...flag, id: "fabricated", sourceSentence: "The deposit is never returned." },
      { ...flag, id: "wrong-offset", sourceStart: 1 },
      { ...flag, id: "normalized", sourceSentence: sentence.replaceAll(" ", "  ") },
    ]) }]);
    expect(result.runs[0].unsupportedCitations).toEqual(["fabricated", "wrong-offset", "normalized"]);
  });

  it("separates plausible harmless warnings from unsupported material claims despite exact citations", () => {
    const outcome = flagged();
    const harmlessCorpus = { ...corpus, cases: [{ ...corpus.cases[0], category: "harmless-oddity", adjudication: {
      ...corpus.cases[0].adjudication, seriousTerms: [], harmlessTerms: [{ id: "oddity", documentId: "pasted-lease", sentence }],
    } }] };
    const withoutHuman = scoreEvaluation(harmlessCorpus, [{ caseId: "serious", run: 1, outcome }]);
    expect(withoutHuman.runs[0].plausibleFalseAlarms).toEqual(["exit"]);
    expect(withoutHuman.runs[0].unsupportedClaims).toEqual([]);
    const assessed = scoreEvaluation(harmlessCorpus, [{ caseId: "serious", run: 1, outcome, humanReview: {
      reviewerIds: ["a", "b"], outcomeDigest: outcomeDigest(outcome),
      checks: { materialClaims: false, conditionalWording: true, coverage: true, groundedAnswers: true, preferenceRerun: true, counterOffers: true },
      unsupportedClaimFlagIds: ["exit"], plausibleFalseAlarmFlagIds: [],
    } }]);
    expect(assessed.runs[0].unsupportedClaims).toEqual(["exit"]);
    expect(assessed.runs[0].plausibleFalseAlarms).toEqual([]);
    expect(assessed.gate).toBe("blocked");
  });

  it("does not claim misses or pass when independent adjudication is disputed", () => {
    const disputed = { ...corpus, cases: [{ ...corpus.cases[0], adjudication: {
      ...corpus.cases[0].adjudication, disagreementsResolved: false,
    } }] };
    const result = scoreEvaluation(disputed, [{ caseId: "serious", run: 1, outcome: review }]);
    expect(result.gate).toBe("pending");
    expect(result.runs[0].seriousMisses).toEqual([]);
  });

  it("reports provider failure as unavailable evidence, never as a clean review", () => {
    const result = scoreEvaluation(corpus, [{ caseId: "serious", run: 1, outcome: { status: "failed", reason: "model-unavailable" } }]);
    expect(result.gate).toBe("pending");
    expect(result.runs[0].status).toBe("failed");
    expect(result.runs[0].seriousMisses).toEqual([]);
  });

  it("blocks partial reviews of incomplete packets and checks every missing document name", () => {
    const incomplete = { ...corpus, cases: [{ ...corpus.cases[0], category: "incomplete", adjudication: {
      ...corpus.cases[0].adjudication, seriousTerms: [], missingDocuments: ["Building rules"],
    } }] };
    const result = scoreEvaluation(incomplete, [
      { caseId: "serious", run: 1, outcome: review },
      { caseId: "serious", run: 2, outcome: { status: "blocked", completeness: { missing: [{ name: "Fee schedule" }] } } },
      { caseId: "serious", run: 3, outcome: { status: "blocked", completeness: { missing: [{ name: "Building rules" }] } } },
    ]);
    expect(result.reasons).toEqual([
      "serious run 1: incomplete packet received a review",
      "serious run 2: failed to name every adjudicated missing document",
    ]);
  });

  it("refuses invalid adjudicated source sentences and duplicate outcomes", () => {
    expect(() => scoreEvaluation({ ...corpus, cases: [{ ...corpus.cases[0], documents: [{ id: "pasted-lease", title: "Synthetic", text: "No such sentence." }] }] }, [])).toThrow("Invalid adjudicated source");
    expect(() => scoreEvaluation(corpus, Array.from({ length: 2 }, () => ({ caseId: "serious", run: 1, outcome: review })))).toThrow("Duplicate run");
  });

  it("keeps a missing corpus pending instead of manufacturing independent evidence", () => {
    const result = scoreEvaluation({ id: "not-supplied", partition: "release", locked: false, cases: [] }, []);
    expect(result.gate).toBe("pending");
    expect(result.pending).toContain("Missing corpus category: incomplete");
  });

  it("requires all categories, three real-model runs and bound human reviews before passing", () => {
    // These fabricated reviewer IDs test gate logic only. They are never evaluation evidence.
    const complete = { ...corpus, partition: "release", locked: true, cases: [
      { ...corpus.cases[0], adjudication: { ...corpus.cases[0].adjudication,
        seriousTerms: ["deposit", "early-exit", "dispute-rights"].map((area) => ({ ...corpus.cases[0].adjudication.seriousTerms[0], id: area, area })),
      } },
      ...["clean", "harmless-oddity", "incomplete"].map((category) => ({
        ...corpus.cases[0], id: category, category,
        adjudication: { ...corpus.cases[0].adjudication, seriousTerms: [],
          harmlessTerms: category === "harmless-oddity" ? [{ id: "oddity", documentId: "pasted-lease", sentence }] : [],
          missingDocuments: category === "incomplete" ? ["Building rules"] : [],
        },
      })),
    ] };
    const records = complete.cases.flatMap((entry) => [1, 2, 3].map((run) => {
      const outcome = entry.category === "serious" ? flagged() : entry.category === "incomplete"
        ? { status: "blocked", completeness: { missing: [{ name: "Building rules" }] } } : review;
      return { caseId: entry.id, run, outcome,
        provenance: { mode: "live", model: "test-metadata-only", revision: "test-revision" },
        humanReview: { reviewerIds: ["test-a", "test-b"], outcomeDigest: outcomeDigest(outcome),
          checks: { materialClaims: true, conditionalWording: true, coverage: true, groundedAnswers: true, preferenceRerun: true, counterOffers: true },
          unsupportedClaimFlagIds: [], plausibleFalseAlarmFlagIds: [],
        },
      };
    }));
    expect(scoreEvaluation(complete, records).gate).toBe("passed");
    records[0].humanReview.outcomeDigest = "stale-evidence";
    expect(scoreEvaluation(complete, records).gate).toBe("pending");
  });

  it("runs the actual completeness route three times and preserves incomplete outcomes", async () => {
    const missingSentence = "The Building rules form part of this lease.";
    const incomplete = { ...corpus, cases: [{ ...corpus.cases[0], category: "incomplete",
      documents: [{ id: "pasted-lease", title: "Synthetic runner input", text: missingSentence }],
      adjudication: { ...corpus.cases[0].adjudication, seriousTerms: [], missingDocuments: ["Building rules"] },
    }] };
    const records = await runCorpus(incomplete, { complete: async () => ({ references: [{
      name: "Building rules", citingDocumentId: "pasted-lease", citingSentence: missingSentence, satisfiedByDocumentId: null,
    }] }) });
    expect(records.map(({ run, outcome }) => ({ run, outcome }))).toEqual([1, 2, 3].map((run) => ({
      run, outcome: expect.objectContaining({ status: "blocked", completeness: expect.objectContaining({
        missing: [expect.objectContaining({ name: "Building rules", citingSentence: missingSentence })],
      }) }),
    })));
    expect(scoreEvaluation(incomplete, records).reasons).toEqual([]);
  });
});
