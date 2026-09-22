import { z } from "zod";

/**
 * What the model is asked to return when Blueline checks whether a packet is
 * the whole agreement. Same two forms as the analysis schema beside it: the
 * JSON Schema sent to the provider as a structured-output contract, and the
 * zod schema the reply is validated against once it arrives.
 *
 * One call answers both halves of the question — what the agreement refers
 * to, and which supplied document is that thing — because the second half is
 * only answerable by someone who has just read the first. Splitting them
 * would mean sending the whole packet twice and matching on a bare name.
 */

export const COMPLETENESS_SCHEMA_NAME = "blueline_packet_completeness";

export const completenessJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    references: {
      type: "array",
      description:
        "Every separate document the supplied text refers to as part of the agreement. Empty when the text refers to none.",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "The referenced document's name, as the referring text states it.",
          },
          citingDocumentId: {
            type: "string",
            description: "The id of the supplied document that makes the reference.",
          },
          citingSentence: {
            type: "string",
            description:
              "The one sentence that makes the reference, copied character for character from that document.",
          },
          satisfiedByDocumentId: {
            type: ["string", "null"],
            description:
              "The id of the supplied document that is the referenced document, or null when none of them is.",
          },
        },
        required: [
          "name",
          "citingDocumentId",
          "citingSentence",
          "satisfiedByDocumentId",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["references"],
  additionalProperties: false,
};

export const modelReferenceSchema = z.object({
  name: z.string().trim().min(1),
  citingDocumentId: z.string().trim().min(1),
  citingSentence: z.string().trim().min(1),
  satisfiedByDocumentId: z.string().trim().min(1).nullable(),
});

export const modelCompletenessSchema = z.object({
  references: z.array(modelReferenceSchema),
});

/** A reference as the model returned it, before its sentence has been located. */
export type CandidateReference = z.infer<typeof modelReferenceSchema>;

/** A whole completeness answer as the model returned it, before verification. */
export type ModelCompleteness = z.infer<typeof modelCompletenessSchema>;
