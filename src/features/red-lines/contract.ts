import { z } from "zod";

export const redLinesSchema = z.array(z.string().trim().min(1).max(500)).max(20);
export const RED_LINES_SCHEMA_NAME = "blueline_preference_matches";
export const candidateMatchesSchema = z.strictObject({
  matches: z.array(z.strictObject({
    redLineIndex: z.number().int().min(0),
    explanation: z.string().trim().min(1).max(2000),
    sourceDocumentId: z.string().min(1),
    sourceSentence: z.string().min(1),
  })).max(40),
});
export const matchesJsonSchema = {
  type: "object", properties: {
    matches: { type: "array", items: {
      type: "object", properties: {
        redLineIndex: { type: "integer", minimum: 0 },
        explanation: { type: "string" }, sourceDocumentId: { type: "string" }, sourceSentence: { type: "string" },
      }, required: ["redLineIndex", "explanation", "sourceDocumentId", "sourceSentence"], additionalProperties: false,
    } },
  }, required: ["matches"], additionalProperties: false,
};

export interface PreferenceMatch {
  readonly redLine: string;
  readonly explanation: string;
  readonly sourceDocumentId: string;
  readonly sourceSentence: string;
  readonly sourceStart: number;
  readonly sourceEnd: number;
}
export type RedLineOutcome =
  | { readonly status: "preferences"; readonly lines: readonly string[] }
  | { readonly status: "matched"; readonly matches: readonly PreferenceMatch[] }
  | { readonly status: "failed"; readonly reason: string };
