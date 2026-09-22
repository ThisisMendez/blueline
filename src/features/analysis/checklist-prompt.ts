import { renderDocumentBlocks } from "@/features/packet/render";
import type { Packet } from "@/features/packet/types";

import { COVERAGE_CHECKLIST } from "./checklist";

/**
 * The coverage-checklist prompt.
 *
 * The list of topics is rendered from `checklist.ts`, so the model is asked
 * about the published six and never invited to propose a seventh. The
 * question it answers is narrow on purpose: where does this agreement
 * address this topic, or does it not. Nothing here asks whether a term ought
 * to be there, and nothing here asks about the law.
 */

const TOPIC_LINES = COVERAGE_CHECKLIST.map(
  (topic) => `- ${topic.id} — ${topic.name}: ${topic.description}`,
).join("\n");

export const CHECKLIST_SYSTEM_PROMPT = `You are checking a residential lease agreement against a fixed checklist on behalf of the person who has been asked to sign it. The agreement may be spread across several documents; read all of them as one agreement.

The checklist is these topics and only these topics:

${TOPIC_LINES}

Answer for every topic on the list. Do not add a topic. Do not leave one out.

Rules you do not break:

1. For each topic, say "found" when the documents contain a sentence that addresses it, and "not-found" when they do not.
2. A found topic carries one sentence copied character for character out of the document text below, and the id of the document it came from. If you cannot copy a sentence exactly, answer not-found for that topic instead of paraphrasing.
3. A topic is found wherever it is addressed. A fee schedule, an addendum, or any other supplied document counts as much as the lease itself.
4. A not-found topic carries no sentence and no document id. There is nothing to quote for something the agreement does not say.
5. Say only where a topic is addressed or that it is not. Never say the agreement is unlawful, invalid, illegal, or non-compliant, and never say a term ought to be there. Whether the silence matters is the signer's call, not yours.
6. A sentence that touches the topic counts even when the term it states is one-sided. You are reporting coverage here, not judging it.`;

/** Renders the packet as the user message the checklist call reads. */
export function buildChecklistUserMessage(packet: Packet): string {
  return `Check the complete agreement below against the checklist, and answer for all six topics.\n\n${renderDocumentBlocks(packet)}`;
}

/**
 * The single retry. It names the quotations that could not be found and asks
 * for the whole answer again. A citation still unmatched after this fails
 * verification rather than becoming a not-found item.
 */
export function buildChecklistRetryUserMessage(
  packet: Packet,
  unmatchedQuotations: readonly string[],
): string {
  const listed = unmatchedQuotations
    .map((quotation, index) => `${index + 1}. "${quotation}"`)
    .join("\n");

  return `${buildChecklistUserMessage(packet)}

These quotations from your previous answer do not appear in the document text above:

${listed}

Answer for all six topics again. Where a topic really is addressed, copy its sentence character for character out of the document, including its punctuation, capitalisation, and any numbers or parentheses. Where you cannot find the sentence you meant, answer not-found for that topic.`;
}
