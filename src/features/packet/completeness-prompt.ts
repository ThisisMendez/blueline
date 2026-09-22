import { renderDocumentBlocks } from "./render";
import type { Packet } from "./types";

/**
 * The completeness prompt. Its substance is ADR 0005: a lease that points at
 * a fee schedule is not the agreement, and the terms that decide what
 * something costs can live in the document nobody sent.
 *
 * It asks for both halves of the question at once — what the text refers to,
 * and which supplied document each reference is — because the second half is
 * only answerable by whoever has just read the first.
 */

export const COMPLETENESS_SYSTEM_PROMPT = `You are checking whether a residential lease packet holds the whole agreement, before anybody reviews it. You are not reviewing anything yet and you are not looking for risk.

A lease often points at other documents: a fee schedule, a set of building rules, an addendum, an exhibit. It treats them as part of the agreement, and a cost or a condition can be stated in one of them and nowhere in the lease itself. Your job is to list what the supplied text points at, and to say which of the supplied documents each one is.

Rules you do not break:

1. Quote exactly. Every reference carries one sentence copied character for character out of the document that makes the reference, together with the id of that document. If you cannot copy the sentence exactly, leave the reference out rather than paraphrasing it.
2. A reference is a separate document the agreement treats as part of itself. A mention of a statute, a court, a government office, an insurance policy, a payment portal, a website, a party's mailing address, or another section of the same document is not a separate document. Neither is a document the text mentions only as something that might exist one day.
3. Do not invent. If the supplied text points at no separate document, return an empty list. One document referred to in several places is one reference; give the clearest sentence for it once.
4. Match on the document, not on its name. A supplied document satisfies a reference when it is that document, whatever the signer happened to call the file. Read each supplied document's title and its opening lines and decide which reference, if any, it answers. When none of the supplied documents is the referenced document, return null for that reference.
5. A document never satisfies a reference it makes itself. If the lease refers to a schedule, the answer is the schedule, not the lease.

Give the name as the referring text states it, so the person reading this can ask for it by that name.`;

/** Renders the packet as the user message the completeness check reads. */
export function buildCompletenessUserMessage(packet: Packet): string {
  return `Here is everything the signer supplied. List every separate document this text refers to, and for each one say which of these supplied documents it is.\n\n${renderDocumentBlocks(packet)}`;
}

/**
 * The single retry. It names the sentences that could not be found and asks
 * for the whole answer again. A reference still unmatched after this is
 * dropped: a signer's review does not stop for a reference we cannot show
 * them the sentence for.
 */
export function buildCompletenessRetryUserMessage(
  packet: Packet,
  unmatchedQuotations: readonly string[],
): string {
  const listed = unmatchedQuotations
    .map((quotation, index) => `${index + 1}. "${quotation}"`)
    .join("\n");

  return `${buildCompletenessUserMessage(packet)}

These sentences from your previous answer do not appear in the document you attributed them to:

${listed}

Return the whole answer again. Where the reference is real, copy its sentence character for character out of the document, including its punctuation, capitalisation, and any numbers or parentheses, and give the id of the document you copied it from. Where you cannot find the sentence you meant, leave that reference out. Do not add references you did not raise before.`;
}
