import type { Packet } from "@/features/packet/types";

import {
  buildChecklistRetryUserMessage,
  buildChecklistUserMessage,
  CHECKLIST_SYSTEM_PROMPT,
} from "./checklist-prompt";
import {
  COVERAGE_CHECKLIST,
  isChecklistTopicId,
  type ChecklistTopicId,
} from "./checklist";
import { ModelError, type ModelClient } from "./model/client";
import {
  CHECKLIST_SCHEMA_NAME,
  checklistJsonSchema,
  modelChecklistSchema,
  type CandidateTopic,
  type ModelChecklist,
} from "./model/checklist-schema";
import type { CoverageChecklist, CoverageItem, FoundTopic } from "./types";
import { locateCitation } from "./verify";

/**
 * The coverage checklist run (ADR 0008, ADR 0007).
 *
 * The published six go out, and all six come back — found with a verified
 * sentence, or not found with nothing. Three rules hold the whole module
 * together:
 *
 *   * The list is the list. A topic id the model returns that is not
 *     published is discarded here and never reaches a screen, so the model
 *     cannot add an expectation of its own.
 *   * A found topic proves itself. Its quotation is verified against the
 *     signer's extracted text with the same verifier a risk flag uses, and
 *     the sentence shown is cut from that text. One retry, and a citation
 *     that still will not verify fails the review. A verification failure
 *     does not establish that the agreement omits a topic.
 *   * An absence carries nothing. A not-found item is built with no
 *     sentence, no document, no offsets and no severity, because the type
 *     has nowhere to put them.
 */

export interface CoverageChecklistInput {
  readonly packet: Packet;
  readonly model: ModelClient;
}

async function askModel(model: ModelClient, user: string): Promise<ModelChecklist> {
  const raw = await model.complete({
    system: CHECKLIST_SYSTEM_PROMPT,
    user,
    schemaName: CHECKLIST_SCHEMA_NAME,
    jsonSchema: checklistJsonSchema,
  });

  const parsed = modelChecklistSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ModelError(
      "unreadable",
      `The coverage checklist did not match the expected shape: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"} ${issue.message}`)
        .join("; ")}`,
    );
  }
  return parsed.data;
}

interface VerificationPass {
  /** Topics whose citation was verified, by topic id. */
  readonly found: ReadonlyMap<ChecklistTopicId, FoundTopic>;
  /** Quotations that were not in the document they were attributed to. */
  readonly unverifiable: readonly string[];
}

/**
 * Keeps the answers about published topics, and verifies every "found".
 *
 * An answer about an unpublished topic id is dropped without comment: the
 * checklist is fixed, so there is nothing for such an answer to be about.
 */
function verifyTopics(
  candidates: readonly CandidateTopic[],
  packet: Packet,
): VerificationPass {
  const found = new Map<ChecklistTopicId, FoundTopic>();
  const unverifiable: string[] = [];

  for (const candidate of candidates) {
    if (!isChecklistTopicId(candidate.topicId)) continue;
    if (candidate.status !== "found") continue;
    if (found.has(candidate.topicId)) continue;

    const quotation = candidate.sourceSentence;
    const documentId = candidate.sourceDocumentId;
    // A "found" with nothing to quote is an absence wearing the wrong label.
    if (quotation === null || documentId === null) continue;

    const located = locateCitation(packet, documentId, quotation);
    if (!located) {
      unverifiable.push(quotation);
      continue;
    }

    found.set(candidate.topicId, {
      status: "found",
      topicId: candidate.topicId,
      // The signer reads the document's own words, not the model's echo.
      sourceSentence: located.sentence,
      sourceDocumentId: located.document.id,
      sourceStart: located.start,
      sourceEnd: located.end,
    });
  }

  return { found, unverifiable };
}

/**
 * Runs the checklist: ask about the published six, verify every citation,
 * retry once when citations do not match, and fail if verification still fails.
 */
export async function runCoverageChecklist({
  packet,
  model,
}: CoverageChecklistInput): Promise<CoverageChecklist> {
  const first = await askModel(model, buildChecklistUserMessage(packet));
  const firstPass = verifyTopics(first.topics, packet);

  const found = new Map(firstPass.found);

  if (firstPass.unverifiable.length > 0) {
    const retry = await askModel(
      model,
      buildChecklistRetryUserMessage(packet, firstPass.unverifiable),
    );
    const secondPass = verifyTopics(retry.topics, packet);
    if (secondPass.unverifiable.length > 0) {
      throw new ModelError("verification-failed", "Coverage citations could not be verified after retry.");
    }

    for (const [topicId, topic] of secondPass.found) {
      if (!found.has(topicId)) found.set(topicId, topic);
    }
  }

  // Every published topic has an explicit, validated answer. Only explicit
  // not-found answers can produce absence items.
  const items: CoverageItem[] = COVERAGE_CHECKLIST.map(
    (topic) => found.get(topic.id) ?? { status: "not-found", topicId: topic.id },
  );

  return { items };
}
