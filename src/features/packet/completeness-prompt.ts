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
 *
 * It asks the model to classify every named document (required, conditional,
 * mentioned) rather than to leave out the ones that do not count. Giving the
 * borderline cases somewhere to go makes the required list steadier from run
 * to run, and the filtering happens in code. Names and duplicates are also
 * settled in code (reference-identity.ts); the instructions about names here
 * only make that easier.
 */

export const COMPLETENESS_SYSTEM_PROMPT = `You are checking whether a residential lease packet holds the whole agreement, before anybody reviews it. You are not reviewing anything yet and you are not looking for risk.

First, say what kind of agreement the first supplied document is. Blueline only reviews residential leases.

- residential-lease: a lease or rental agreement for a home someone lives in (an apartment, a house, a room, student or public housing), or a renewal or addendum to one.
- not-a-residential-lease: clearly some other kind of agreement, for example a commercial or storage lease, a membership, a service or subscription agreement, an employment agreement, or a licence to use land or a facility.
- unclear: only when you genuinely cannot tell from the text.

Judge by what the document is, not by its title alone. For anything but residential-lease, copy one sentence that shows what the document is, character for character, with the id of the document it came from. Describe the document in under ten plain words either way.

A lease often points at other documents: a fee schedule, a set of building rules, an addendum, an exhibit, a handbook. When it makes one of them part of the agreement, a cost or a condition can be stated there and nowhere in the lease itself. Your job is to list the separate documents the supplied text names, say for each whether the text requires it as part of this agreement, and say which of the supplied documents, if any, it is.

Rules you do not break:

1. Quote exactly. Every reference carries one sentence copied character for character out of the document that makes the reference, together with the id of that document. If you cannot copy the sentence exactly, leave the reference out rather than paraphrasing it.
2. Classify each document by what the text does with it (the requirement field). Read the words around every mention, including any heading over a list of attachments.
   - required: the text attaches it, incorporates it by reference, says it is part of the agreement, or binds the signer to comply with it, and leaves no condition open. An attachment listed under a heading such as "Required" is required.
   - conditional: the text includes it only if something applies: "if any", "if applicable", "where required", a box left to tick, a heading such as "If Applicable", or an event that may not happen (the signer keeping a pet, adding an occupant). It stays conditional unless the supplied text shows the condition applies to this tenancy.
   - mentioned: the text names it without making it part of the agreement: a form the signer fills in or hands in (an application, a request, a notice), a pamphlet or notice the signer is given or advised to read, a list the template leaves blank to fill in, or a document that might exist one day.
3. Ground a required document in the sentence that requires it. Copy the sentence that attaches, incorporates or binds the signer to it, not a sentence that only mentions it in passing. Where the requirement is a list of attachments, copy the line that names this document.
4. Some things are not documents at all and are left out: a statute or code section, a court, a government office, an insurance policy, a payment portal, a website, a party's mailing address, another section of the same document.
5. One document, one entry. A document named in several places, or by several names (a full title in one place, a short name in another, with or without its attachment number or form number), is one reference: give it once, with its requiring sentence. When one sentence names several separate documents, give each its own entry with that same sentence.
6. Name each document by the fullest name the text gives it, copied from the text, without its attachment or exhibit number. Keep a form number when the text gives one.
7. Do not invent. If the supplied text names no separate document, return an empty list. List the documents in the order the text first names them.
8. Match on the document, not on its name. A supplied document satisfies a reference when it is that document, whatever the signer happened to call the file. Read each supplied document's title and its opening lines and decide which reference, if any, it answers. When none of the supplied documents is the referenced document, return null for that reference.
9. A document never satisfies a reference it makes itself. If the lease refers to a schedule, the answer is the schedule, not the lease.`;

/** Renders the packet as the user message the completeness check reads. */
export function buildCompletenessUserMessage(packet: Packet): string {
  return `Here is everything the signer supplied. List every separate document this text names, say whether the text requires it as part of this agreement, and for each one say which of these supplied documents it is.\n\n${renderDocumentBlocks(packet)}`;
}

/**
 * The single retry. It names the sentences that could not be found and asks
 * for the whole answer again. A reference still unmatched after this means
 * completeness cannot be verified, and the review does not run.
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
