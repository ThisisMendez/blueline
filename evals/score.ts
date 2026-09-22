import { createHash } from "node:crypto";
import { z } from "zod";

const label = z.object({
  id: z.string().min(1), documentId: z.string().min(1), sentence: z.string().min(1),
});
export const corpusSchema = z.object({
  id: z.string().min(1),
  partition: z.enum(["development", "release"]),
  locked: z.boolean(),
  cases: z.array(z.object({
    id: z.string().min(1),
    category: z.enum(["serious", "clean", "harmless-oddity", "incomplete"]),
    documents: z.array(z.object({ id: z.string().min(1), title: z.string().min(1), text: z.string().min(1) })).min(1),
    adjudication: z.object({
      reviewerIds: z.array(z.string().min(1)),
      completedBeforeModelOutput: z.boolean(),
      disagreementsResolved: z.boolean(),
      seriousTerms: z.array(label.extend({ severity: z.literal("high"), area: z.enum(["deposit", "early-exit", "dispute-rights", "other"]) })),
      harmlessTerms: z.array(label),
      missingDocuments: z.array(z.string().min(1)),
    }).nullable(),
  })),
});

const flagSchema = z.object({
  id: z.string(), severity: z.enum(["high", "medium", "low"]),
  sourceSentence: z.string(), sourceDocumentId: z.string(),
  sourceStart: z.number().int().nonnegative(), sourceEnd: z.number().int().nonnegative(),
});
const outcomeSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("reviewed"), review: z.object({
    riskFlags: z.array(flagSchema), clean: z.boolean(), cleanStatement: z.string().nullable(),
    droppedFlagCount: z.number().int().nonnegative(),
  }) }),
  z.object({ status: z.literal("blocked"), completeness: z.object({
    missing: z.array(z.object({ name: z.string() })),
  }), review: z.never().optional(), summary: z.never().optional(), riskFlags: z.never().optional() }),
  z.object({ status: z.literal("failed"), reason: z.string() }),
  z.object({ status: z.literal("rejected"), reason: z.string() }),
]);
export const recordsSchema = z.array(z.object({
  caseId: z.string(), run: z.number().int().min(1).max(3), outcome: z.unknown(),
  provenance: z.object({ mode: z.literal("live"), model: z.string().min(1), revision: z.string().min(1) }).optional(),
  humanReview: z.object({
    reviewerIds: z.array(z.string().min(1)), outcomeDigest: z.string(),
    // Human review is necessary: an exact quotation alone does not prove its interpretation.
    checks: z.object({
      materialClaims: z.boolean(), conditionalWording: z.boolean(), coverage: z.boolean(),
      groundedAnswers: z.boolean(), preferenceRerun: z.boolean(), counterOffers: z.boolean(),
    }),
    unsupportedClaimFlagIds: z.array(z.string()),
    plausibleFalseAlarmFlagIds: z.array(z.string()),
  }).optional(),
}));

export type EvaluationCorpus = z.infer<typeof corpusSchema>;
export type EvaluationRecord = z.infer<typeof recordsSchema>[number];
export interface RunScore {
  caseId: string; run: number; outcomeDigest: string; status: string;
  verifiedFlags: number; unsupportedCitations: string[]; unsupportedClaims: string[];
  plausibleFalseAlarms: string[]; seriousMisses: string[]; severityMismatches: string[];
  droppedFlags: number;
}
export interface EvaluationReport {
  corpusId: string; gate: "pending" | "blocked" | "passed";
  reasons: string[]; pending: string[]; runs: RunScore[];
}

/** Digest the entire captured response, including Q&A/edit evidence when supplied. */
export function outcomeDigest(outcome: unknown): string {
  return createHash("sha256").update(JSON.stringify(outcome)).digest("hex");
}

/** Public scoring boundary. Inputs are validated and no text is copied into the report. */
export function scoreEvaluation(corpusInput: unknown, recordsInput: unknown): EvaluationReport {
  const corpus = corpusSchema.parse(corpusInput);
  const records = recordsSchema.parse(recordsInput);
  const reasons: string[] = [];
  const pending: string[] = [];
  const runs: RunScore[] = [];
  if (corpus.partition !== "release" || !corpus.locked) pending.push("A locked release corpus is required for an expansion decision.");
  for (const category of ["serious", "clean", "harmless-oddity", "incomplete"]) {
    if (!corpus.cases.some((entry) => entry.category === category)) pending.push(`Missing corpus category: ${category}`);
  }
  for (const area of ["deposit", "early-exit", "dispute-rights"]) {
    if (!corpus.cases.some((entry) => entry.adjudication?.seriousTerms.some((term) => term.area === area))) {
      pending.push(`Missing serious-term coverage: ${area}`);
    }
  }
  if (new Set(corpus.cases.map((entry) => entry.id)).size !== corpus.cases.length) throw new Error("Duplicate corpus case IDs.");
  const seen = new Set<string>();
  for (const record of records) {
    const key = `${record.caseId}:${record.run}`;
    if (seen.has(key)) throw new Error(`Duplicate run: ${key}`);
    seen.add(key);
    if (!corpus.cases.some((entry) => entry.id === record.caseId)) throw new Error(`Unknown case: ${record.caseId}`);
  }

  for (const entry of corpus.cases) {
    const documents = new Map(entry.documents.map((document) => [document.id, document.text]));
    if (documents.size !== entry.documents.length) throw new Error(`Duplicate document IDs: ${entry.id}`);
    const adjudication = entry.adjudication;
    const adjudicated = adjudication !== null && new Set(adjudication.reviewerIds).size >= 2
      && adjudication.completedBeforeModelOutput && adjudication.disagreementsResolved;
    if (!adjudicated) pending.push(`${entry.id}: independent adjudication missing or disputed`);
    if (adjudication) {
      const labels = [...adjudication.seriousTerms, ...adjudication.harmlessTerms];
      if (new Set(labels.map((term) => term.id)).size !== labels.length) throw new Error(`Duplicate label IDs: ${entry.id}`);
      for (const term of labels) {
        if (!documents.get(term.documentId)?.includes(term.sentence)) throw new Error(`Invalid adjudicated source: ${entry.id}/${term.id}`);
      }
      if (entry.category === "serious" && !adjudication.seriousTerms.length) pending.push(`${entry.id}: no adjudicated serious term`);
      if (entry.category === "harmless-oddity" && !adjudication.harmlessTerms.length) pending.push(`${entry.id}: no adjudicated harmless oddity`);
      if (entry.category === "incomplete" && !adjudication.missingDocuments.length) pending.push(`${entry.id}: missing-document names absent`);
    }
    for (const run of [1, 2, 3]) {
      const record = records.find((candidate) => candidate.caseId === entry.id && candidate.run === run);
      if (!record) { pending.push(`${entry.id} run ${run}: outcome unavailable`); continue; }
      const prefix = `${entry.id} run ${run}`;
      if (!record.provenance) pending.push(`${prefix}: real-model run provenance unavailable`);
      const score: RunScore = { caseId: entry.id, run, outcomeDigest: outcomeDigest(record.outcome), status: "invalid",
        verifiedFlags: 0, unsupportedCitations: [], unsupportedClaims: [], plausibleFalseAlarms: [], seriousMisses: [], severityMismatches: [], droppedFlags: 0 };
      runs.push(score);
      const parsed = outcomeSchema.safeParse(record.outcome);
      if (!parsed.success) { reasons.push(`${prefix}: invalid product outcome`); continue; }
      const outcome = parsed.data;
      score.status = outcome.status;
      if (outcome.status === "failed" || outcome.status === "rejected") {
        pending.push(`${prefix}: ${outcome.status} (${outcome.reason})`); continue;
      }
      if (entry.category === "incomplete") {
        if (outcome.status !== "blocked") reasons.push(`${prefix}: incomplete packet received a review`);
        else if (adjudicated && adjudication.missingDocuments.some((name) => !outcome.completeness.missing.some((missing) => missing.name === name))) {
          reasons.push(`${prefix}: failed to name every adjudicated missing document`);
        }
        if (outcome.status === "blocked") continue;
      }
      if (outcome.status === "blocked") { reasons.push(`${prefix}: complete agreement was blocked`); continue; }
      const review = outcome.review;
      score.droppedFlags = review.droppedFlagCount;
      const verified = review.riskFlags.filter((flag) => {
        const text = documents.get(flag.sourceDocumentId);
        const valid = flag.sourceSentence.length > 0 && text !== undefined
          && flag.sourceEnd > flag.sourceStart && text.slice(flag.sourceStart, flag.sourceEnd) === flag.sourceSentence;
        if (!valid) score.unsupportedCitations.push(flag.id);
        return valid;
      });
      score.verifiedFlags = verified.length;
      for (const id of score.unsupportedCitations) reasons.push(`${prefix}: unsupported citation ${id}`);
      if (score.droppedFlags) reasons.push(`${prefix}: ${score.droppedFlags} flags failed source verification`);
      if (review.clean !== (review.riskFlags.length === 0)
        || (review.clean && review.cleanStatement !== "No material flags found in the text reviewed")
        || (!review.clean && review.cleanStatement !== null)) reasons.push(`${prefix}: inconsistent clean-review result`);
      if (adjudicated) {
        for (const term of adjudication.seriousTerms) {
          const matches = verified.filter((flag) => flag.sourceDocumentId === term.documentId && flag.sourceSentence === term.sentence);
          if (!matches.length) { score.seriousMisses.push(term.id); reasons.push(`${prefix}: missed high-severity term ${term.id}`); }
          else if (!matches.some((flag) => flag.severity === "high")) { score.severityMismatches.push(term.id); reasons.push(`${prefix}: high-severity term under-ranked ${term.id}`); }
        }
        for (const flag of verified) {
          if (adjudication.harmlessTerms.some((term) => term.documentId === flag.sourceDocumentId && term.sentence === flag.sourceSentence)) score.plausibleFalseAlarms.push(flag.id);
        }
      }
      const human = record.humanReview;
      if (!human || human.outcomeDigest !== score.outcomeDigest || new Set(human.reviewerIds).size < 2) {
        pending.push(`${prefix}: two-reviewer output and full signer-flow review required`);
      } else {
        const verifiedIds = new Set(verified.map((flag) => flag.id));
        for (const id of [...human.unsupportedClaimFlagIds, ...human.plausibleFalseAlarmFlagIds]) {
          if (!verifiedIds.has(id)) throw new Error(`Human assessment names an unverified flag: ${prefix}/${id}`);
        }
        score.unsupportedClaims = [...new Set(human.unsupportedClaimFlagIds)];
        score.plausibleFalseAlarms = [...new Set([...score.plausibleFalseAlarms, ...human.plausibleFalseAlarmFlagIds])]
          .filter((id) => !score.unsupportedClaims.includes(id));
        for (const id of score.unsupportedClaims) reasons.push(`${prefix}: unsupported material claim ${id}`);
        for (const [check, passed] of Object.entries(human.checks)) if (!passed) reasons.push(`${prefix}: human check failed (${check})`);
      }
      if (entry.category === "clean" && review.riskFlags.length) reasons.push(`${prefix}: clean lease acquired a risk flag`);
    }
  }
  return { corpusId: corpus.id, gate: reasons.length ? "blocked" : pending.length ? "pending" : "passed", reasons, pending, runs };
}
