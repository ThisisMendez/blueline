import { z } from "zod";

const citationProperties = {
  sourceDocumentId: { type: "string", description: "The supplied document id." },
  sourceSentence: { type: "string", description: "The supporting sentence copied character for character." },
};

/**
 * What the model is asked to return, in two forms: the JSON Schema sent to
 * the provider as a structured-output contract, and the zod schema the reply
 * is validated against once it arrives.
 *
 * Both exist on purpose. `strict: true` is honoured per-provider rather than
 * guaranteed, so the JSON Schema is a request and the zod parse is the check.
 */

export const ANALYSIS_SCHEMA_NAME = "blueline_general_review";

export const analysisJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description:
        "A neutral, plain-English summary of the agreement. No verdict on whether to sign.",
    },
    flags: {
      type: "array",
      description:
        "Terms with a plausible, material downside for the signer. Empty when there are none.",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short title naming the specific issue." },
          nextStep: { type: "string", description: "A practical question or action for the selected role." },
          severity: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Ranked by consequence to the signer, never by how unusual the wording is.",
          },
          consequence: {
            type: "string",
            description: "What the signer concretely stands to lose or face.",
          },
          triggeringCondition: {
            type: "string",
            description: "What would have to happen for the consequence to matter.",
          },
          counterOffer: {
            type: "string",
            description: "Concrete proposed lease wording that reduces the selected role's exposure and offers a plausible compromise.",
          },
          residualRisk: {
            type: "string",
            description: "The specific risk or cost remaining for the selected role if this edit is accepted.",
          },
          ...citationProperties,
          relatedCitations: {
            type: "array",
            description: "Additional passages needed to support the finding, such as a cap, exception, or conflicting term. Empty if the primary sentence suffices.",
            items: {
              type: "object",
              properties: citationProperties,
              required: Object.keys(citationProperties),
              additionalProperties: false,
            },
          },
        },
        required: [
          "title",
          "nextStep",
          "severity",
          "consequence",
          "triggeringCondition",
          "counterOffer",
          "residualRisk",
          "sourceDocumentId",
          "sourceSentence",
          "relatedCitations",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "flags"],
  additionalProperties: false,
};

const modelCitationSchema = z.object({
  sourceDocumentId: z.string().trim().min(1),
  sourceSentence: z.string().trim().min(1),
});

export const modelFlagSchema = modelCitationSchema.extend({
  title: z.string().trim().min(1),
  nextStep: z.string().trim().min(1),
  severity: z.enum(["high", "medium", "low"]),
  consequence: z.string().trim().min(1),
  triggeringCondition: z.string().trim().min(1),
  counterOffer: z.string().trim().min(1),
  residualRisk: z.string().trim().min(1),
  relatedCitations: z.array(modelCitationSchema),
});

export const modelAnalysisSchema = z.object({
  summary: z.string().trim().min(1),
  flags: z.array(modelFlagSchema),
});

/** A flag as the model returned it, before its quotation has been verified. */
export type CandidateFlag = z.infer<typeof modelFlagSchema>;

/** A whole analysis as the model returned it, before verification. */
export type ModelAnalysis = z.infer<typeof modelAnalysisSchema>;
