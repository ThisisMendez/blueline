/**
 * The six-part verdict a human or the judge gives one flag, the human
 * verdicts file the labelling page writes, and its lock. Shared by the
 * lock script, the judge runner and the tests.
 */
import { createHash } from "node:crypto";
import { z } from "zod";

export const DIMENSIONS = {
  quotation: ["yes", "no"],
  scope: ["in scope", "out of scope", "can't tell"],
  consequence: ["correct", "incorrect", "partly"],
  materiality: ["material", "ordinary", "harmless oddity", "borderline"],
  severity: ["right", "too high", "too low", "not applicable"],
  missingInformation: ["handled", "guessed", "not applicable"],
} as const;
export type Dimension = keyof typeof DIMENSIONS;
export const OVERALL = ["PASS", "FAIL"] as const;
export type Overall = (typeof OVERALL)[number];

const verdictShape = {
  quotation: z.enum(DIMENSIONS.quotation),
  scope: z.enum(DIMENSIONS.scope),
  consequence: z.enum(DIMENSIONS.consequence),
  materiality: z.enum(DIMENSIONS.materiality),
  severity: z.enum(DIMENSIONS.severity),
  missingInformation: z.enum(DIMENSIONS.missingInformation),
};

/** What the judge must return for one flag. */
export const judgeVerdictSchema = z.strictObject({ ...verdictShape, overall: z.enum(OVERALL), rationale: z.string().min(1) });
export type JudgeVerdict = z.infer<typeof judgeVerdictSchema>;

/** The same, as JSON Schema for the provider's structured output. */
export const JUDGE_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: [...Object.keys(DIMENSIONS), "overall", "rationale"],
  properties: {
    ...Object.fromEntries(Object.entries(DIMENSIONS).map(([name, values]) => [name, { type: "string", enum: [...values] }])),
    overall: { type: "string", enum: [...OVERALL] },
    rationale: { type: "string" },
  },
};

/** One flag in the human verdicts file, as the labelling page saves it. Unanswered verdicts are null. */
const humanEntrySchema = z.object({
  verdicts: z.object(Object.fromEntries(Object.keys(DIMENSIONS).map((name) => [name, z.string().nullable()])) as Record<Dimension, z.ZodNullable<z.ZodString>>),
  overall: z.enum(OVERALL).nullable(),
  rationale: z.string(),
  updatedAt: z.string().nullable(),
  history: z.array(z.unknown()),
});
export const humanVerdictsSchema = z.object({
  version: z.literal(2),
  batch: z.string(),
  reviewerId: z.string(),
  flags: z.record(z.string(), humanEntrySchema),
  reflection: z.string().optional(),
  updatedAt: z.string().nullable(),
});
export type HumanVerdicts = z.infer<typeof humanVerdictsSchema>;

export const verdictLockSchema = z.strictObject({
  batch: z.string(),
  batchSha256: z.string().length(64),
  verdictsSha256: z.string().length(64),
  reviewerId: z.string().min(1),
  flagCount: z.number().int(),
  lockedAt: z.string(),
  note: z.string(),
});
export type VerdictLock = z.infer<typeof verdictLockSchema>;

export function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/** Reasons the human verdicts can't be locked yet; empty when complete. */
export function incompleteVerdicts(verdicts: HumanVerdicts, flagNumbers: readonly number[]): string[] {
  const problems: string[] = [];
  if (!verdicts.reviewerId.trim()) problems.push("no reviewer id");
  for (const number of flagNumbers) {
    const entry = verdicts.flags[String(number)];
    if (!entry) { problems.push(`flag ${number}: no verdicts`); continue; }
    for (const [name, values] of Object.entries(DIMENSIONS) as [Dimension, readonly string[]][]) {
      const value = entry.verdicts[name];
      if (value === null || !values.includes(value)) problems.push(`flag ${number}: ${name} not answered`);
    }
    if (!entry.overall) problems.push(`flag ${number}: no overall verdict`);
    if (!entry.rationale.trim()) problems.push(`flag ${number}: no rationale`);
  }
  for (const key of Object.keys(verdicts.flags)) {
    if (!flagNumbers.includes(Number(key))) problems.push(`flag ${key}: not in the batch`);
  }
  return problems;
}

/** Problems with locked verdicts against the files on disk; empty when they can be used. */
export function checkVerdictLock(lock: VerdictLock, batchRaw: string, verdictsRaw: string): string[] {
  const problems: string[] = [];
  if (sha256(batchRaw) !== lock.batchSha256) problems.push("the batch changed after the verdicts were locked");
  if (sha256(verdictsRaw) !== lock.verdictsSha256) problems.push("the human verdicts changed after they were locked");
  return problems;
}
