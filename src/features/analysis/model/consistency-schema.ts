import { z } from "zod";

/**
 * What the model is asked when Blueline checks its own drafted counter-offer
 * against its own residual-risk statement for the same flag. A counter-offer
 * and a residual risk are two independent fields the analysis call writes in
 * one pass (see model/schema.ts); nothing else ties them together, so the
 * model can propose an edit that removes a specific protection and still
 * write a residual-risk line that assumes that protection remains in force.
 *
 * This asks a different kind of question than citation verification does.
 * Citation verification checks a fact: is this exact sentence in the
 * document. This checks a judgment: do these two pieces of the model's own
 * output agree with each other. See consistency.ts for what follows from
 * that difference — a "no" here never fails the review the way an
 * unverifiable citation does.
 */

export const CONSISTENCY_SCHEMA_NAME = "blueline_counter_offer_consistency";

export const consistencyJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    results: {
      type: "array",
      description: "One entry for each numbered item below, in the same order.",
      items: {
        type: "object",
        properties: {
          index: {
            type: "integer",
            description: "The item's number below, starting at 0.",
          },
          consistent: {
            type: "boolean",
            description:
              "False when the residual risk statement contradicts what the counter-offer's own text changes — for example, describing a right or condition as still in force when the counter-offer removes or alters it, or the reverse.",
          },
          reason: {
            type: "string",
            description: "One sentence naming the contradiction, or \"consistent\" when there is none.",
          },
        },
        required: ["index", "consistent", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["results"],
  additionalProperties: false,
};

export const modelConsistencyResultSchema = z.object({
  index: z.number().int().min(0),
  consistent: z.boolean(),
  reason: z.string().trim().min(1),
});

export const modelConsistencySchema = z.object({
  results: z.array(modelConsistencyResultSchema),
});

/** One item's verdict, before it is matched back to its flag by index. */
export type ModelConsistencyResult = z.infer<typeof modelConsistencyResultSchema>;

/** The whole consistency answer as the model returned it. */
export type ModelConsistency = z.infer<typeof modelConsistencySchema>;
