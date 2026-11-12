import { z } from "zod";

import { nullableText } from "./fields";

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

export const AGREEMENT_KINDS = ["residential-lease", "not-a-residential-lease", "unclear"] as const;
export type AgreementKind = (typeof AGREEMENT_KINDS)[number];

/**
 * How the text treats a document it names. Only `required` documents can
 * block a review: a document attached "if any", or one the text only
 * mentions, is reported by the model so it has somewhere to put it, and then
 * set aside in code (completeness.ts).
 */
export const REFERENCE_REQUIREMENTS = ["required", "conditional", "mentioned"] as const;
export type ReferenceRequirement = (typeof REFERENCE_REQUIREMENTS)[number];

export const completenessJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    agreement: {
      type: "object",
      description:
        "What kind of agreement the first supplied document is. Blueline reviews residential leases only (ADR 0014).",
      properties: {
        kind: { type: "string", enum: [...AGREEMENT_KINDS] },
        description: {
          type: "string",
          description: "What the document is, in under ten plain words, for example 'a lease for an apartment'.",
        },
        evidenceDocumentId: {
          type: ["string", "null"],
          description: "The id of the document the evidence sentence is copied from, or null for a residential lease.",
        },
        evidenceSentence: {
          type: ["string", "null"],
          description:
            "For anything but a residential lease, one sentence that shows what the document is, copied character for character. Null for a residential lease.",
        },
      },
      required: ["kind", "description", "evidenceDocumentId", "evidenceSentence"],
      additionalProperties: false,
    },
    references: {
      type: "array",
      description:
        "Every separate document the supplied text refers to, once each, in the order the text first names them. Empty when the text refers to none.",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "The referenced document's fullest name as the text states it, without its attachment or exhibit number.",
          },
          requirement: {
            type: "string",
            enum: [...REFERENCE_REQUIREMENTS],
            description:
              "required: the text attaches it, incorporates it, makes it part of the agreement, or binds the signer to follow it, with no open condition. conditional: included only if something applies (if any, if applicable, a box to tick, an event such as getting a pet) and the text does not show it applies. mentioned: named without being made part of the agreement.",
          },
          citingDocumentId: {
            type: "string",
            description: "The id of the supplied document that makes the reference.",
          },
          citingSentence: {
            type: "string",
            description:
              "The one sentence that makes the document part of the agreement (for a required document) or names it (otherwise), copied character for character from that document.",
          },
          satisfiedByDocumentId: {
            type: ["string", "null"],
            description:
              "The id of the supplied document that is the referenced document, or null when none of them is.",
          },
        },
        required: [
          "name",
          "requirement",
          "citingDocumentId",
          "citingSentence",
          "satisfiedByDocumentId",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["agreement", "references"],
  additionalProperties: false,
};

export const modelReferenceSchema = z.object({
  name: z.string().trim().min(1),
  // The strict schema always asks for this. A reply without it is read as
  // "required", the answer that blocks: a missing classification must never
  // be what lets an incomplete packet through.
  requirement: z.enum(REFERENCE_REQUIREMENTS).default("required"),
  citingDocumentId: z.string().trim().min(1),
  citingSentence: z.string().trim().min(1),
  satisfiedByDocumentId: nullableText(),
});

export const modelAgreementSchema = z.object({
  kind: z.enum(AGREEMENT_KINDS),
  description: z.string().trim().min(1),
  evidenceDocumentId: nullableText(),
  evidenceSentence: nullableText(),
});

export const modelCompletenessSchema = z.object({
  agreement: modelAgreementSchema,
  references: z.array(modelReferenceSchema),
});

/** A reference as the model returned it, before its sentence has been located. */
export type CandidateReference = z.infer<typeof modelReferenceSchema>;

/** A whole completeness answer as the model returned it, before verification. */
export type ModelCompleteness = z.infer<typeof modelCompletenessSchema>;
