import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { judgeMetrics, majority } from "./metrics";
import { buildJudgeRequest, judgeRefusals, type BatchFlag } from "./run-judge";
import { classify, pickLikelyFail, seededShuffle, spread, type PoolFlag } from "./select-batch";
import { checkVerdictLock, humanVerdictsSchema, incompleteVerdicts, judgeVerdictSchema, sha256, type HumanVerdicts } from "./verdicts";

describe("judge metrics (synthetic verdicts)", () => {
  // Flags 1-4 picked as likely to fail, 5-7 as controls. The human FAILs 1, 2, 3 and control 7.
  const human = { 1: "FAIL", 2: "FAIL", 3: "FAIL", 4: "PASS", 5: "PASS", 6: "PASS", 7: "FAIL" } as const;
  const roles = { 1: "likely-fail", 2: "likely-fail", 3: "likely-fail", 4: "likely-fail", 5: "control", 6: "control", 7: "control" } as const;
  const repeats = [
    { 1: "FAIL", 2: "FAIL", 3: "PASS", 4: "PASS", 5: "PASS", 6: "FAIL", 7: "FAIL" },
    { 1: "FAIL", 2: "PASS", 3: "PASS", 4: "PASS", 5: "PASS", 6: "FAIL", 7: null },
    { 1: "FAIL", 2: "FAIL", 3: "PASS", 4: "FAIL", 5: "PASS", 6: "PASS", 7: "FAIL" },
  ] as const;

  it("reports human FAILs caught, PASS controls failed and repeatability separately", () => {
    const metrics = judgeMetrics({ human, roles, repeats });
    expect(metrics.label).toBe("failure-enriched batch");
    expect(metrics.humanFails).toEqual([1, 2, 3, 7]);
    expect(metrics.passControls).toEqual([5, 6]);
    expect(metrics.controlsHumanFailed).toEqual([7]);
    expect(metrics.failsCaught.perRepeat).toEqual([{ count: 3, total: 4 }, { count: 1, total: 4 }, { count: 3, total: 4 }]);
    expect(metrics.failsCaught.byMajority).toEqual({ count: 3, total: 4 });
    expect(metrics.controlsIncorrectlyFailed.perRepeat).toEqual([{ count: 1, total: 2 }, { count: 1, total: 2 }, { count: 0, total: 2 }]);
    expect(metrics.controlsIncorrectlyFailed.byMajority).toEqual({ count: 1, total: 2 });
    // 1, 3 and 5 are the same on every repeat; 7 is missing one verdict, so it isn't repeatable.
    expect(metrics.repeatability).toEqual({ count: 3, total: 7 });
    expect(metrics.missingVerdicts).toBe(1);
  });

  it("finds no majority in a tie or when verdicts are missing", () => {
    expect(majority(["FAIL", "PASS"])).toBeNull();
    expect(majority(["FAIL", null, null])).toBeNull();
    expect(majority(["FAIL", "FAIL", null])).toBe("FAIL");
  });
});

const flag: BatchFlag = { number: 3, key: "abc", document: "doc", documentTitle: "A Doc", severity: "high", quotedSentence: "Q.", consequence: "C.", paragraph: "P. Q." };

describe("the judge's request", () => {
  it("carries only the rubric, the guide and the flag, never a human verdict or why the flag was picked", () => {
    const request = buildJudgeRequest({ ...flag, overall: "FAIL", reason: "control", rationale: "human said so" } as BatchFlag, "RUBRIC", "GUIDE");
    expect(request.system).toBe("RUBRIC\n\n---\n\nGUIDE");
    expect(request.user).toContain('"quotedSentence": "Q."');
    expect(request.user).not.toMatch(/FAIL|control|human said so|abc|"number"/);
  });

  it("asks for a reply the verdict schema accepts", () => {
    const reply = { quotation: "yes", scope: "out of scope", consequence: "correct", materiality: "material", severity: "right", missingInformation: "not applicable", overall: "PASS", rationale: "r" };
    expect(judgeVerdictSchema.parse(reply)).toEqual(reply);
    expect(Object.keys((buildJudgeRequest(flag, "", "").jsonSchema as { properties: object }).properties).sort()).toEqual(Object.keys(reply).sort());
  });
});

describe("when the judge refuses to run", () => {
  const ready = { lockExists: true, lockProblems: [], selectionExists: true, selectionMatches: true, holdoutDocuments: [], model: "some/model" };
  it("runs only with locked human verdicts, the matching selection record, no holdout flag and a model", () => {
    expect(judgeRefusals(ready)).toEqual([]);
    expect(judgeRefusals({ ...ready, lockExists: false })).toHaveLength(1);
    expect(judgeRefusals({ ...ready, lockProblems: ["the human verdicts changed after they were locked"] })).toHaveLength(1);
    expect(judgeRefusals({ ...ready, selectionMatches: false })).toHaveLength(1);
    expect(judgeRefusals({ ...ready, holdoutDocuments: ["H02-nycha-pact-lease"] })).toEqual(["H02-nycha-pact-lease is a holdout document; the judge never runs on the holdout"]);
    expect(judgeRefusals({ ...ready, model: null })).toHaveLength(1);
  });
});

describe("locking human verdicts (synthetic)", () => {
  const empty = { verdicts: { quotation: null, scope: null, consequence: null, materiality: null, severity: null, missingInformation: null }, overall: null, rationale: "", updatedAt: null, history: [] };
  const done = { verdicts: { quotation: "yes", scope: "out of scope", consequence: "partly", materiality: "borderline", severity: "too high", missingInformation: "not applicable" }, overall: "FAIL" as const, rationale: "r", updatedAt: "t", history: [] };

  it("won't lock until every flag has six verdicts, an overall verdict, a rationale and a reviewer id", () => {
    const partial: HumanVerdicts = humanVerdictsSchema.parse({ version: 2, batch: "b", reviewerId: "", flags: { 1: done, 2: empty }, updatedAt: null });
    expect(incompleteVerdicts(partial, [1, 2])).toEqual([
      "no reviewer id",
      "flag 2: quotation not answered", "flag 2: scope not answered", "flag 2: consequence not answered",
      "flag 2: materiality not answered", "flag 2: severity not answered", "flag 2: missingInformation not answered",
      "flag 2: no overall verdict", "flag 2: no rationale",
    ]);
    expect(incompleteVerdicts({ ...partial, reviewerId: "R1", flags: { 1: done, 2: done } }, [1, 2])).toEqual([]);
  });

  it("notices a batch or verdicts file changed after locking", () => {
    const lock = { batch: "b", batchSha256: sha256("batch"), verdictsSha256: sha256("verdicts"), reviewerId: "R1", flagCount: 2, lockedAt: "t", note: "" };
    expect(checkVerdictLock(lock, "batch", "verdicts")).toEqual([]);
    expect(checkVerdictLock(lock, "batch!", "verdicts!")).toEqual(["the batch changed after the verdicts were locked", "the human verdicts changed after they were locked"]);
  });
});

describe("the failure-enriched batch", () => {
  const batch = JSON.parse(readFileSync("evals/judge/batch-2/batch.json", "utf8")) as { form: string; flags: Record<string, unknown>[] };

  it("shows the reviewer no selection reason, match or verdict", () => {
    expect(batch.form).toBe("six-part");
    expect(batch.flags.length).toBeGreaterThanOrEqual(12);
    expect(batch.flags.length).toBeLessThanOrEqual(20);
    for (const entry of batch.flags) {
      expect(Object.keys(entry).sort()).toEqual(["consequence", "document", "documentTitle", "key", "number", "paragraph", "quotedSentence", "severity"]);
    }
  });

  it("repeats none of the ten flags the owner labelled before", () => {
    const earlier = JSON.parse(readFileSync("evals/labels/flags.json", "utf8")) as { flags: { quotedSentence: string }[] };
    const quotes = new Set(earlier.flags.map((entry) => entry.quotedSentence));
    for (const entry of batch.flags) expect(quotes.has(entry.quotedSentence as string)).toBe(false);
  });
});

describe("picking the batch", () => {
  const pool = (document: string, position: number, reason: PoolFlag["reason"]): PoolFlag => ({
    key: `${document}${position}`, document, documentTitle: document, severity: "low", quotedSentence: "", consequence: "", paragraph: "", position, sourceRun: "r", reason,
  });

  it("spreads picks across documents and fills reasons in order up to their caps", () => {
    const flags = [pool("b", 1, "matches no planted clause"), pool("a", 2, "matches no planted clause"), pool("a", 1, "matches no planted clause")];
    expect(spread(flags, 2).map((entry) => entry.key)).toEqual(["a1", "b1"]);
    const mixed = [pool("a", 1, "on a clean document"), pool("a", 2, "on a clean document"), pool("b", 1, "ordinary payment, matches no planted clause"), pool("c", 1, "matches no planted clause")];
    expect(pickLikelyFail(mixed, 3).map((entry) => entry.key)).toEqual(["a1", "a2", "b1"]);
  });

  it("shuffles the same way every time", () => {
    expect(seededShuffle([1, 2, 3, 4, 5], 7)).toEqual(seededShuffle([1, 2, 3, 4, 5], 7));
  });

  it("classifies by the gold set's own inventory", () => {
    const document = {
      id: "d", path: "", title: "", benign: false, questionSentences: [],
      text: "Fee is $5. Odd rule here. We may change terms. Other words.",
      unusualButHarmless: ["Odd rule here."],
      plantedClauses: [{ id: "P-01", clauseType: "unilateral-modification" as const, sourceSentence: "We may change terms.", expectedSeverityBand: "critical", exit: null }],
    };
    expect(classify(document, "Fee is $5.")).toBe("ordinary payment, matches no planted clause");
    expect(classify(document, "Odd rule here.")).toBe("on an unusual-but-harmless sentence");
    expect(classify(document, "We may change terms.")).toBe("control: matches a planted in-scope clause graded critical or high");
    expect(classify(document, "Other words.")).toBe("matches no planted clause");
    expect(classify({ ...document, benign: true }, "Other words.")).toBe("on a clean document");
  });
});
