import { ModelError, type ModelClient } from "@/features/analysis/model/client";
import {
  COMPLETENESS_SCHEMA_NAME,
  completenessJsonSchema,
  modelCompletenessSchema,
  type CandidateReference,
  type ModelCompleteness,
} from "@/features/analysis/model/completeness-schema";

import {
  COMPLETENESS_SYSTEM_PROMPT,
  buildCompletenessRetryUserMessage,
  buildCompletenessUserMessage,
} from "./completeness-prompt";
import { locateQuotation } from "./normalize";
import { findDocument, type Packet } from "./types";

/**
 * The completeness gate (ADR 0005).
 *
 * A complete agreement is the lease and every document it references. This
 * module answers one question about a packet — is anything it names absent —
 * and it answers it before any review runs, because a partial review of an
 * incomplete agreement is the false reassurance the product exists to avoid.
 *
 * Nothing here produces a summary or a flag, and nothing here can. The gate's
 * two outcomes are separate types: a complete agreement carries only matched
 * references, and an incomplete one carries no analysis of any kind. The
 * blocked path never reaches the review pipeline, so there is no partial
 * review to suppress.
 */

/** A document the agreement refers to, located in the text that refers to it. */
export interface DocumentReference {
  /** Derived from the citation, so the same sentence always gets the same id. */
  readonly id: string;
  /** The referenced document's name, as the agreement states it. */
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
  /** Named, with the sentence that names them, in the order the lease names them. */
  readonly missing: readonly DocumentReference[];
  /** References that were answered, so the signer can correct a wrong one. */
  readonly matches: readonly MatchedReference[];
  readonly droppedReferenceCount: number;
}

export type CompletenessCheck = CompleteAgreement | IncompleteAgreement;

export interface CompletenessCheckInput {
  readonly packet: Packet;
  readonly model: ModelClient;
  /** The signer's corrections to the automatic matching, by reference id. */
  readonly resolutions?: readonly ReferenceResolution[];
}

/** The id a reference keeps: derived from its citation, so it is stable. */
export function referenceId(
  citingDocumentId: string,
  citingStart: number,
  citingEnd: number,
): string {
  return `${citingDocumentId}#${citingStart}-${citingEnd}`;
}

interface LocatedReference {
  readonly reference: DocumentReference;
  /** What the model said answers it, unchecked. */
  readonly satisfiedByDocumentId: string | null;
}

interface LocationResult {
  readonly located: readonly LocatedReference[];
  /** Quotations that were not in the document they were attributed to. */
  readonly unlocatable: readonly string[];
}

async function askModel(
  model: ModelClient,
  user: string,
): Promise<ModelCompleteness> {
  const raw = await model.complete({
    system: COMPLETENESS_SYSTEM_PROMPT,
    user,
    schemaName: COMPLETENESS_SCHEMA_NAME,
    jsonSchema: completenessJsonSchema,
  });

  const parsed = modelCompletenessSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ModelError(
      "unreadable",
      `The completeness check did not match the expected shape: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"} ${issue.message}`)
        .join("; ")}`,
    );
  }
  return parsed.data;
}

/**
 * Locates each reference's sentence in the document it was attributed to.
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
  const seen = new Set<string>();

  for (const candidate of candidates) {
    const document = findDocument(packet, candidate.citingDocumentId);
    if (!document) {
      unlocatable.push(candidate.citingSentence);
      continue;
    }

    const location = locateQuotation(document.text, candidate.citingSentence);
    if (!location) {
      unlocatable.push(candidate.citingSentence);
      continue;
    }

    const id = referenceId(document.id, location.start, location.end);
    if (seen.has(id)) continue;
    seen.add(id);

    located.push({
      reference: {
        id,
        name: candidate.name,
        citingDocumentId: document.id,
        citingSentence: document.text.slice(location.start, location.end),
        citingStart: location.start,
        citingEnd: location.end,
      },
      satisfiedByDocumentId: candidate.satisfiedByDocumentId,
    });
  }

  return { located, unlocatable };
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
  located: LocatedReference,
  packet: Packet,
  resolutions: ReadonlyMap<string, string | null>,
): MatchedReference | null {
  if (resolutions.has(located.reference.id)) {
    const chosen = resolutions.get(located.reference.id) ?? null;
    if (chosen === null) return null;
    // A document the packet does not hold is not an answer, whoever named it.
    if (!findDocument(packet, chosen) || chosen === located.reference.citingDocumentId) return null;
    return { reference: located.reference, documentId: chosen, matchedBy: "signer" };
  }

  const proposed = located.satisfiedByDocumentId;
  if (proposed === null) return null;
  if (proposed === located.reference.citingDocumentId) return null;
  if (!findDocument(packet, proposed)) return null;

  return { reference: located.reference, documentId: proposed, matchedBy: "model" };
}

/**
 * Runs the gate: ask what the packet refers to, verify every citing sentence,
 * retry the ones that did not match exactly once, drop whatever still does
 * not match, then settle each surviving reference against the packet.
 */
export async function checkCompleteness({
  packet,
  model,
  resolutions = [],
}: CompletenessCheckInput): Promise<CompletenessCheck> {
  const first = await askModel(model, buildCompletenessUserMessage(packet));
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
      throw new ModelError("verification-failed", "The document references could not be verified.");
    }

    const alreadyHeld = new Set(located.map((entry) => entry.reference.id));
    const recovered = secondPass.located.filter(
      (entry) => !alreadyHeld.has(entry.reference.id),
    );
    located = [...located, ...recovered];

    droppedReferenceCount = Math.max(
      0,
      firstPass.unlocatable.length - recovered.length,
    );
    if (droppedReferenceCount > 0) {
      throw new ModelError("verification-failed", "The completeness retry left unverified document references.");
    }
  }

  const byReferenceId = new Map(
    resolutions.map((resolution) => [resolution.referenceId, resolution.documentId]),
  );

  const matches: MatchedReference[] = [];
  const missing: DocumentReference[] = [];

  for (const entry of located) {
    const match = matchFor(entry, packet, byReferenceId);
    if (match) matches.push(match);
    else missing.push(entry.reference);
  }

  if (missing.length === 0) {
    return { kind: "complete", matches, droppedReferenceCount };
  }
  return { kind: "incomplete", missing, matches, droppedReferenceCount };
}
