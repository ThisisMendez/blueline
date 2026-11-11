import { z } from "zod";

export const QUESTION_SCHEMA_NAME = "blueline_question";
export const NOT_ADDRESSED = "Not addressed in the agreement. We did not find text that answers this question.";
/** Shown when a question turns on what the law allows (ADR 0014). */
export const LOCAL_LAW_NOTE = "Whether this is allowed where you live isn't something we check. A local tenant organisation or a lawyer can tell you. Here is what your lease says.";

/**
 * Deterministic backstop for the model's own `needsLocalLaw` answer: a
 * question that asks about legality or legal rights gets the note even if
 * the model says it doesn't need it.
 */
export function asksAboutLaw(question: string): boolean {
  return /\b(?:legal|legally|illegal|lawful|unlawful|law|laws|statute|enforceable|unenforceable|allowed to|is it allowed|permitted|my rights|tenant rights|can (?:they|my landlord|the landlord) (?:legally|really))\b/i.test(question);
}

const citationSchema = z.strictObject({
  sourceDocumentId: z.string().min(1),
  sourceSentence: z.string().min(1),
});
export const modelAnswerSchema = z.strictObject({
  status: z.enum(["answered", "not-addressed"]),
  needsLocalLaw: z.boolean(),
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
    needsLocalLaw: { type: "boolean", description: "True when the question asks whether something is legal, allowed, enforceable or required by law, or about legal rights. The lease can't answer that part." },
    citations: {
      type: "array", items: {
        type: "object", properties: {
          sourceDocumentId: { type: "string" }, sourceSentence: { type: "string" },
        }, required: ["sourceDocumentId", "sourceSentence"], additionalProperties: false,
      },
    },
  },
  required: ["status", "needsLocalLaw", "citations"], additionalProperties: false,
};

export interface AnswerCitation {
  readonly sourceDocumentId: string;
  readonly sourceSentence: string;
  readonly sourceStart: number;
  readonly sourceEnd: number;
}
export type QuestionOutcome =
  | { readonly status: "answered"; readonly citations: readonly AnswerCitation[]; readonly needsLocalLaw: boolean }
  | { readonly status: "not-addressed"; readonly needsLocalLaw: boolean }
  | { readonly status: "blocked"; readonly missing: readonly string[] }
  | { readonly status: "out-of-scope" }
  | { readonly status: "unverified" }
  | { readonly status: "failed"; readonly reason: string }
  | { readonly status: "rejected" };
