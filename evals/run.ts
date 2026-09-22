import type { ModelClient } from "../src/features/analysis/model/client";
import { createAnalysisRoute } from "../src/features/analysis/server/route";
import { corpusSchema, scoreEvaluation, type EvaluationRecord } from "./score";

/** Runs the product's completeness and general-review route three times per case. */
export async function runCorpus(corpusInput: unknown, model: ModelClient): Promise<EvaluationRecord[]> {
  const corpus = corpusSchema.parse(corpusInput);
  // Validate source labels before exposing any model output to reviewers.
  scoreEvaluation(corpus, []);
  const records: EvaluationRecord[] = [];
  for (const entry of corpus.cases) {
    const adjudication = entry.adjudication;
    if (!adjudication || new Set(adjudication.reviewerIds).size < 2
      || !adjudication.completedBeforeModelOutput || !adjudication.disagreementsResolved) {
      throw new Error(`Independent adjudication must finish before running case ${entry.id}.`);
    }
    for (const [index, document] of entry.documents.entries()) {
      const expectedId = index === 0 ? "pasted-lease" : `supplied-${index + 1}`;
      if (document.id !== expectedId) throw new Error(`Case ${entry.id}: document ${index + 1} must use ID ${expectedId}.`);
    }
  }
  const route = createAnalysisRoute({
    model, accounts: async () => ({ kind: "signed-out" }), store: async () => null,
    now: () => new Date(), newReviewId: () => { throw new Error("Evaluation must remain ephemeral."); },
  });
  for (const entry of corpus.cases) {
    const [lease, ...referenced] = entry.documents;
    for (const run of [1, 2, 3]) {
      const response = await route(new Request("http://localhost/api/analysis", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: lease.text, title: lease.title, referenced: referenced.map(({ text, title }) => ({ text, title })) }),
      }));
      records.push({ caseId: entry.id, run, outcome: await response.json() });
    }
  }
  return records;
}
