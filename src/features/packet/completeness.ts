import type { ModelClient } from "@/features/analysis/model/client";
import {
  COMPLETENESS_SCHEMA_NAME,
  completenessJsonSchema,
  modelCompletenessSchema,
  type CandidateReference,
  type ModelCompleteness,
} from "@/features/analysis/model/completeness-schema";
import type { AgreementKind } from "@/features/analysis/model/completeness-schema";
import { completeStructured } from "@/features/analysis/model/structured";

import {
  COMPLETENESS_SYSTEM_PROMPT,
  buildCompletenessRetryUserMessage,
  buildCompletenessUserMessage,
} from "./completeness-prompt";
import { locateQuotation, locateQuotationFoldingPunctuation } from "./normalize";
import {
  canonicalName,
  firstMention,
  groupSameDocuments,
  identityKeys,
  identitySlug,
} from "./reference-identity";
import { findDocument, type Packet } from "./types";

/**
 * The completeness gate (ADR 0005).
 *
 * A complete agreement is the lease and every document it makes part of
 * itself. This module answers one question about a packet — is any required
 * document absent — and it answers it before any review runs, because a
 * partial review of an incomplete agreement is the false reassurance the
 * product exists to avoid.
 *
 * Nothing here produces a summary or a flag, and nothing here can. The gate's
 * two outcomes are separate types: a complete agreement carries only matched
 * references, and an incomplete one carries no analysis of any kind. The
 * blocked path never reaches the review pipeline, so there is no partial
 * review to suppress.
 *
 * Only documents the text requires can block. The model also reports
 * documents attached "if any" and documents merely mentioned, so it has
 * somewhere to put them; they are set aside here. Each required document is
 * grounded in the sentence that requires it, verified against the signer's
 * text, and then names of the same document are merged in code
 * (reference-identity.ts), so the signer is asked for each document once,
 * under one name, in the order the lease names them.
 */

/** A document the agreement requires, located in the text that requires it. */
export interface DocumentReference {
  /**
   * Derived from the citation and the document's identity, so the same
   * sentence naming the same document always gets the same id.
   */
  readonly id: string;
  /** The referenced document's name, as the signer sees it. */
  readonly name: string;
  /** The supplied document whose text makes the reference. */
  readonly citingDocumentId: string;
  /** Cut from that document's extracted text at the offsets below. */
  readonly citingSentence: string;
  readonly citingStart: number;
  readonly citingEnd: number;
}

/** Who decided that a supplied document answers a reference. */
export type MatchSource = "model" | "signer";

/** A reference with the supplied document that answers it. */
export interface MatchedReference {
  readonly reference: DocumentReference;
  /** The id of the supplied document that is the referenced document. */
  readonly documentId: string;
  readonly matchedBy: MatchSource;
}

/**
 * The signer's own answer about one reference: the document they say covers
 * it, or null when they say nothing in the packet does. A signer's answer
 * always beats the model's.
 */
export interface ReferenceResolution {
  readonly referenceId: string;
  readonly documentId: string | null;
}

/**
 * Every reference is answered by a supplied document. Analysis may run.
 *
 * There is no field here for a missing document, which is the point: code
 * holding this value cannot ask what is absent, because nothing is.
 */
export interface CompleteAgreement {
  readonly kind: "complete";
  readonly matches: readonly MatchedReference[];
  /** References whose sentence could not be located, after one retry. */
  readonly droppedReferenceCount: number;
}

/**
 * At least one referenced document is absent. Analysis does not run.
 *
 * There is no field here for a summary, a flag, or a severity, and no
 * constructor that could add one. A blocked packet is a different kind of
 * thing from a review, not a review with its fields left empty.
 */
export interface IncompleteAgreement {
  readonly kind: "incomplete";
  /** Named, with the sentence that requires them, in the order the lease names them. One entry per document. */
  readonly missing: readonly DocumentReference[];
  /** References that were answered, so the signer can correct a wrong one. */
  readonly matches: readonly MatchedReference[];
  readonly droppedReferenceCount: number;
}

/**
 * The packet is not a residential lease, or the check could not tell
 * (ADR 0014). Analysis does not run.
 */
export interface OutOfScopePacket {
  readonly kind: "out-of-scope";
  readonly agreementKind: Exclude<AgreementKind, "residential-lease">;
  /** What the document appears to be, in a few words. */
  readonly description: string;
  /** A sentence that shows what the document is, cut from the signer's text. Null when none could be verified. */
  readonly evidence: {
    readonly documentId: string;
    readonly sentence: string;
    readonly start: number;
    readonly end: number;
  } | null;
}

/**
 * The agreement refers to documents whose citing sentences could not be
 * located even after a retry, so whether the packet is complete is unknown.
 * Analysis does not run: an unverified packet is never presented as complete.
 */
export interface UnverifiedCompleteness {
  readonly kind: "unverified";
  /** How many references could not be located. */
  readonly unverifiedReferenceCount: number;
}

export type CompletenessCheck =
  | CompleteAgreement
  | IncompleteAgreement
  | OutOfScopePacket
  | UnverifiedCompleteness;

export interface CompletenessCheckInput {
  readonly packet: Packet;
  readonly model: ModelClient;
  /** The signer's corrections to the automatic matching, by reference id. */
  readonly resolutions?: readonly ReferenceResolution[];
}

/** The id of one citing sentence: where it sits in which document. */
export function referenceId(
  citingDocumentId: string,
  citingStart: number,
  citingEnd: number,
): string {
  return `${citingDocumentId}#${citingStart}-${citingEnd}`;
}

/** Separates a reference id's citation from the identity of the document it names. */
const IDENTITY_SEPARATOR = "~";

/** One required reference as the model gave it, its sentence located. */
interface LocatedReference {
  readonly name: string;
  readonly citingDocumentId: string;
  readonly citingSentence: string;
  readonly citingStart: number;
  readonly citingEnd: number;
  /** What the model said answers it, unchecked. */
  readonly satisfiedByDocumentId: string | null;
}

interface LocationResult {
  readonly located: readonly LocatedReference[];
  /** Quotations that were not in the document they were attributed to. */
  readonly unlocatable: readonly string[];
}

/** One structured call: validated, and retried once if the reply is the wrong shape. */
function askModel(model: ModelClient, user: string): Promise<ModelCompleteness> {
  return completeStructured(
    model,
    { system: COMPLETENESS_SYSTEM_PROMPT, user, schemaName: COMPLETENESS_SCHEMA_NAME, jsonSchema: completenessJsonSchema },
    modelCompletenessSchema,
    "The completeness check",
  );
}

/**
 * Locates the sentence of each required reference in the document it was
 * attributed to. Conditional and merely mentioned documents are set aside
 * before this point: they cannot block, so their sentences are not checked.
 *
 * The sentence the signer reads is cut from their own extracted text at the
 * recorded offsets, never copied from the model's reply — the same rule ADR
 * 0001 sets for a flag's citation. A reference we cannot show the sentence
 * for is a failed verification, never proof that the packet is complete.
 */
function locateReferences(
  candidates: readonly CandidateReference[],
  packet: Packet,
): LocationResult {
  const located: LocatedReference[] = [];
  const unlocatable: string[] = [];

  for (const candidate of candidates) {
    if (candidate.requirement !== "required") continue;

    const document = findDocument(packet, candidate.citingDocumentId);
    // A reply that types a straight quote for the lease's curly one still points
    // at the same sentence; the sentence shown is cut from the lease either way.
    const location = document
      ? locateQuotation(document.text, candidate.citingSentence) ??
        locateQuotationFoldingPunctuation(document.text, candidate.citingSentence)
      : null;
    if (!document || !location) {
      unlocatable.push(candidate.citingSentence);
      continue;
    }

    located.push({
      name: candidate.name,
      citingDocumentId: document.id,
      citingSentence: document.text.slice(location.start, location.end),
      citingStart: location.start,
      citingEnd: location.end,
      satisfiedByDocumentId: candidate.satisfiedByDocumentId,
    });
  }

  return { located, unlocatable };
}

/** All the mentions of one document, merged. */
interface ReferenceGroup {
  readonly reference: DocumentReference;
  /** Ids a signer may have used for this document on an earlier check. */
  readonly knownIds: ReadonlySet<string>;
  /** The identity slugs of every key this document carries. */
  readonly slugs: ReadonlySet<string>;
  /** Model proposals, in member order. */
  readonly proposals: readonly (string | null)[];
  /** Where the document is first named: packet position, then offset. */
  readonly order: readonly [number, number];
}

/**
 * Merges the mentions that name the same document into one reference, with
 * one name, the earliest requiring sentence, and an id built from both.
 */
function consolidate(located: readonly LocatedReference[], packet: Packet): ReferenceGroup[] {
  const position = (documentId: string) =>
    packet.documents.findIndex((document) => document.id === documentId);

  // Members in document order, so every rule below that takes "the first"
  // takes the one the lease names first, whatever order the model used.
  const ordered = [...located].sort(
    (left, right) =>
      position(left.citingDocumentId) - position(right.citingDocumentId) ||
      left.citingStart - right.citingStart ||
      left.citingEnd - right.citingEnd ||
      (left.name < right.name ? -1 : left.name > right.name ? 1 : 0),
  );

  const groups = groupSameDocuments(ordered).map((indexes): ReferenceGroup => {
    const members = indexes.map((index) => ordered[index]);
    const first = members[0];
    const keys = [...new Set(members.flatMap((member) => identityKeys(member)))];
    const slug = identitySlug(keys);
    const citation = referenceId(first.citingDocumentId, first.citingStart, first.citingEnd);

    let order: [number, number] = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
    for (const member of members) {
      const text = findDocument(packet, member.citingDocumentId)?.text ?? "";
      const mention = firstMention(text, member.name);
      const candidate: [number, number] = [
        position(member.citingDocumentId),
        mention >= 0 ? mention : member.citingStart,
      ];
      if (candidate[0] < order[0] || (candidate[0] === order[0] && candidate[1] < order[1])) {
        order = candidate;
      }
    }

    return {
      reference: {
        id: `${citation}${IDENTITY_SEPARATOR}${slug}`,
        name: canonicalName(
          members.map((member) => member.name),
          findDocument(packet, first.citingDocumentId)?.text ?? "",
        ),
        citingDocumentId: first.citingDocumentId,
        citingSentence: first.citingSentence,
        citingStart: first.citingStart,
        citingEnd: first.citingEnd,
      },
      knownIds: new Set(members.map((member) =>
        referenceId(member.citingDocumentId, member.citingStart, member.citingEnd))),
      slugs: new Set(keys.map((key) => identitySlug([key]))),
      proposals: members.map((member) => member.satisfiedByDocumentId),
      order,
    };
  });

  return groups.sort(
    (left, right) =>
      left.order[0] - right.order[0] ||
      left.order[1] - right.order[1] ||
      left.reference.citingStart - right.reference.citingStart ||
      (left.reference.name < right.reference.name ? -1 : left.reference.name > right.reference.name ? 1 : 0),
  );
}

/**
 * The signer's answer for this document, if they gave one. Their answer was
 * given against the id shown on an earlier check; the model may have cited a
 * different sentence this time, so the document's identity also counts.
 */
function signerAnswer(
  group: ReferenceGroup,
  resolutions: readonly ReferenceResolution[],
): ReferenceResolution | null {
  for (const resolution of resolutions) {
    if (resolution.referenceId === group.reference.id) return resolution;
    const [citation, slug] = resolution.referenceId.split(IDENTITY_SEPARATOR);
    // An id with no identity part names a sentence only; one with it names a document.
    if (slug === undefined ? group.knownIds.has(citation) : group.slugs.has(slug)) return resolution;
  }
  return null;
}

/**
 * Decides which supplied document answers a reference.
 *
 * The signer's own answer wins outright, including their answer that nothing
 * in the packet covers it. Failing that, the model's match counts only when
 * it names a document that is really in the packet and is not the document
 * that made the reference — a lease does not satisfy its own fee schedule.
 */
function matchFor(
  group: ReferenceGroup,
  packet: Packet,
  resolutions: readonly ReferenceResolution[],
): MatchedReference | null {
  const citing = group.reference.citingDocumentId;
  const answer = signerAnswer(group, resolutions);
  if (answer) {
    const chosen = answer.documentId;
    if (chosen === null) return null;
    // A document the packet does not hold is not an answer, whoever named it.
    if (!findDocument(packet, chosen) || chosen === citing) return null;
    return { reference: group.reference, documentId: chosen, matchedBy: "signer" };
  }

  for (const proposed of group.proposals) {
    if (proposed === null || proposed === citing || !findDocument(packet, proposed)) continue;
    return { reference: group.reference, documentId: proposed, matchedBy: "model" };
  }
  return null;
}

/**
 * Runs the gate: ask what the packet refers to, keep the required documents,
 * verify every requiring sentence, retry the ones that did not match exactly
 * once, merge the names of the same document, then settle each document
 * against the packet.
 */
export async function checkCompleteness({
  packet,
  model,
  resolutions = [],
}: CompletenessCheckInput): Promise<CompletenessCheck> {
  const first = await askModel(model, buildCompletenessUserMessage(packet));

  // ADR 0014: only residential leases are reviewed. A "not a lease" answer
  // must show a sentence from the signer's own text; without one it is
  // reported as unclear rather than as a confident judgment.
  if (first.agreement.kind !== "residential-lease") {
    const evidenceDocument = first.agreement.evidenceDocumentId
      ? findDocument(packet, first.agreement.evidenceDocumentId)
      : undefined;
    const location = evidenceDocument && first.agreement.evidenceSentence
      ? locateQuotation(evidenceDocument.text, first.agreement.evidenceSentence)
      : null;
    return {
      kind: "out-of-scope",
      agreementKind: location ? first.agreement.kind : "unclear",
      description: first.agreement.description,
      evidence: evidenceDocument && location
        ? {
            documentId: evidenceDocument.id,
            sentence: evidenceDocument.text.slice(location.start, location.end),
            start: location.start,
            end: location.end,
          }
        : null,
    };
  }

  const firstPass = locateReferences(first.references, packet);

  let located = [...firstPass.located];
  let droppedReferenceCount = 0;

  if (firstPass.unlocatable.length > 0) {
    const retry = await askModel(
      model,
      buildCompletenessRetryUserMessage(packet, firstPass.unlocatable),
    );
    const secondPass = locateReferences(retry.references, packet);
    if (secondPass.unlocatable.length > 0) {
      return { kind: "unverified", unverifiedReferenceCount: secondPass.unlocatable.length };
    }

    const citationOf = (entry: LocatedReference) =>
      `${referenceId(entry.citingDocumentId, entry.citingStart, entry.citingEnd)}|${entry.name}`;
    const alreadyHeld = new Set(located.map(citationOf));
    const recovered = secondPass.located.filter((entry) => !alreadyHeld.has(citationOf(entry)));
    located = [...located, ...recovered];

    droppedReferenceCount = Math.max(
      0,
      firstPass.unlocatable.length - recovered.length,
    );
    if (droppedReferenceCount > 0) {
      return { kind: "unverified", unverifiedReferenceCount: droppedReferenceCount };
    }
  }

  const matches: MatchedReference[] = [];
  const missing: DocumentReference[] = [];

  for (const group of consolidate(located, packet)) {
    const match = matchFor(group, packet, resolutions);
    if (match) matches.push(match);
    else missing.push(group.reference);
  }

  if (missing.length === 0) {
    return { kind: "complete", matches, droppedReferenceCount };
  }
  return { kind: "incomplete", missing, matches, droppedReferenceCount };
}
