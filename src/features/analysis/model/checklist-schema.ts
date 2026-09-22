import { z } from "zod";

import { CHECKLIST_TOPIC_IDS, COVERAGE_CHECKLIST } from "../checklist";

/**
 * What the model is asked to return when Blueline checks the complete
 * agreement against the published coverage checklist. Same two forms as the
 * schemas beside it: the JSON Schema sent to the provider as a
 * structured-output contract, and the zod schema the reply is validated
 * against once it arrives.
 *
 * The topic enum is built from the published list, so the contract itself
 * says the answer is about those six and nothing else. `strict: true` is
 * honoured per-provider rather than guaranteed, so the zod schema below
 * deliberately accepts any string as a topic id: an id outside the published
 * list is a thing the pipeline discards, not a parse failure that would
 * throw away the five good answers beside it.
 */

export const CHECKLIST_SCHEMA_NAME = "blueline_coverage_checklist";

export const checklistJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    topics: {
      type: "array",
      description:
        "One entry for each of the published checklist topics, and no others.",
      items: {
        type: "object",
        properties: {
          topicId: {
            type: "string",
            enum: [...CHECKLIST_TOPIC_IDS],
            description: COVERAGE_CHECKLIST.map(
              (topic) => `${topic.id}: ${topic.description}`,
            ).join(" | "),
          },
          status: {
            type: "string",
            enum: ["found", "not-found"],
            description:
              "found when a sentence in the supplied documents addresses the topic; not-found when none does.",
          },
          sourceDocumentId: {
            type: ["string", "null"],
            description:
              "For a found topic, the id of the supplied document the sentence came from. Null when the topic was not found.",
          },
          sourceSentence: {
            type: ["string", "null"],
            description:
              "For a found topic, one sentence copied character for character from that document. Null when the topic was not found.",
          },
        },
        required: ["topicId", "status", "sourceDocumentId", "sourceSentence"],
        additionalProperties: false,
      },
    },
  },
  required: ["topics"],
  additionalProperties: false,
};

export const modelChecklistTopicSchema = z.object({
  topicId: z.string().trim().min(1),
  status: z.enum(["found", "not-found"]),
  sourceDocumentId: z.string().trim().min(1).nullable(),
  sourceSentence: z.string().trim().min(1).nullable(),
}).superRefine((topic, context) => {
  const cited = topic.sourceDocumentId !== null && topic.sourceSentence !== null;
  const absent = topic.sourceDocumentId === null && topic.sourceSentence === null;
  if ((topic.status === "found" && !cited) || (topic.status === "not-found" && !absent)) {
    context.addIssue({ code: "custom", message: "Citation fields must match the topic status." });
  }
});

export const modelChecklistSchema = z.object({
  topics: z.array(modelChecklistTopicSchema),
}).superRefine((checklist, context) => {
  for (const topicId of CHECKLIST_TOPIC_IDS) {
    if (checklist.topics.filter((topic) => topic.topicId === topicId).length !== 1) {
      context.addIssue({ code: "custom", message: `Expected exactly one answer for ${topicId}.` });
    }
  }
});

/** One topic as the model answered it, before its id or quotation is checked. */
export type CandidateTopic = z.infer<typeof modelChecklistTopicSchema>;

/** A whole checklist answer as the model returned it, before verification. */
export type ModelChecklist = z.infer<typeof modelChecklistSchema>;
