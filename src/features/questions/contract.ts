import { z } from "zod";

export const QUESTION_SCHEMA_NAME = "blueline_question";
export const NOT_ADDRESSED = "Not addressed in the agreement. We did not find text that answers this question.";

const citationSchema = z.strictObject({
  sourceDocumentId: z.string().min(1),
  sourceSentence: z.string().min(1),
});
export const modelAnswerSchema = z.strictObject({
  status: z.enum(["answered", "not-addressed"]),
  citations: z.array(citationSchema).max(8),
}).superRefine((answer, context) => {
  if ((answer.status === "answered") !== (answer.citations.length > 0)) {
    context.addIssue({ code: "custom", message: "Answered questions require citations; unaddressed questions must have none." });
  }
});

export const questionJsonSchema = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["answered", "not-addressed"] },
    citations: {
      type: "array", items: {
        type: "object", properties: {
          sourceDocumentId: { type: "string" }, sourceSentence: { type: "string" },
        }, required: ["sourceDocumentId", "sourceSentence"], additionalProperties: false,
      },
    },
  },
  required: ["status", "citations"], additionalProperties: false,
};

export interface AnswerCitation {
  readonly sourceDocumentId: string;
  readonly sourceSentence: string;
  readonly sourceStart: number;
  readonly sourceEnd: number;
}
export type QuestionOutcome =
  | { readonly status: "answered"; readonly citations: readonly AnswerCitation[] }
  | { readonly status: "not-addressed" }
  | { readonly status: "blocked"; readonly missing: readonly string[] }
  | { readonly status: "failed"; readonly reason: string }
  | { readonly status: "rejected" };
