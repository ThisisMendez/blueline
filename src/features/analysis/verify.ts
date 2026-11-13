import { locateQuotation } from "@/features/packet/normalize";
import {
  findDocument,
  type ExtractedDocument,
  type Packet,
} from "@/features/packet/types";

import type { CandidateFlag } from "./model/schema";
import type { ReviewCitation, RiskFlag } from "./types";

/**
 * Citation verification (ADR 0001).
 *
 * A flag the model produced becomes a flag the signer sees only if its
 * quotation can be found in the named document's extracted text. When it can,
 * the sentence the signer reads is cut from that extracted text at the
 * recorded offsets — not copied from the model's reply. That is the whole
 * guarantee: the words on screen are literally the words in their document.
 */

export type RejectionReason = "unknown-document" | "quotation-not-found";

export interface RejectedFlag {
  readonly consequence: string;
  readonly triggeringCondition: string;
  readonly reason: RejectionReason;
  readonly sourceDocumentId: string;
  /** The quotation as the model wrote it, used to name it in the retry. */
  readonly quotation: string;
}

export interface VerificationResult {
  readonly verified: readonly RiskFlag[];
  readonly rejected: readonly RejectedFlag[];
}

/** A quotation found in a packet document, with where it sits in that text. */
export interface LocatedCitation {
  readonly document: ExtractedDocument;
  readonly start: number;
  readonly end: number;
  /** The slice of the document's own text, never the model's echo of it. */
  readonly sentence: string;
}

/**
 * The one citation check in the product. A quotation counts when the packet
 * holds the document it was attributed to and that document's extracted text
 * contains the quotation; the sentence that comes back is cut from the
 * document, so the words on screen are literally the words in the signer's
 * copy. Risk flags verify this way, and so does a found checklist topic.
 */
export function locateCitation(
  packet: Packet,
  sourceDocumentId: string,
  quotation: string,
): LocatedCitation | null {
  const document = findDocument(packet, sourceDocumentId);
  if (!document) return null;

  const location = locateQuotation(document.text, quotation);
  if (!location) return null;

  return {
    document,
    start: location.start,
    end: location.end,
    sentence: document.text.slice(location.start, location.end),
  };
}

/** The id a flag keeps: derived from its citation, so it is stable. */
export function flagId(
  sourceDocumentId: string,
  sourceStart: number,
  sourceEnd: number,
): string {
  return `${sourceDocumentId}#${sourceStart}-${sourceEnd}`;
}

function toReviewCitation(citation: LocatedCitation): ReviewCitation {
  return {
    sourceSentence: citation.sentence,
    sourceDocumentId: citation.document.id,
    sourceStart: citation.start,
    sourceEnd: citation.end,
  };
}

/** Verifies each candidate's quotation against the packet's extracted text. */
export function verifyFlags(
  candidates: readonly CandidateFlag[],
  packet: Packet,
): VerificationResult {
  const verified: RiskFlag[] = [];
  const rejected: RejectedFlag[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    const citations = new Map<string, ReviewCitation>();
    for (const source of [candidate, ...candidate.relatedCitations]) {
      const located = locateCitation(packet, source.sourceDocumentId, source.sourceSentence);
      if (!located) {
        rejected.push({
          consequence: candidate.consequence,
          triggeringCondition: candidate.triggeringCondition,
          reason: findDocument(packet, source.sourceDocumentId) ? "quotation-not-found" : "unknown-document",
          sourceDocumentId: source.sourceDocumentId,
          quotation: source.sourceSentence,
        });
        citations.clear();
        break;
      }
      citations.set(flagId(located.document.id, located.start, located.end), toReviewCitation(located));
    }

    const [primary, ...relatedCitations] = citations.values();
    if (!primary) continue;
    const id = flagId(primary.sourceDocumentId, primary.sourceStart, primary.sourceEnd);
    if (seen.has(id)) continue;
    seen.add(id);

    verified.push({
      id,
      title: candidate.title,
      nextStep: candidate.nextStep,
      severity: candidate.severity,
      consequence: candidate.consequence,
      triggeringCondition: candidate.triggeringCondition,
      counterOffer: candidate.counterOffer,
      residualRisk: candidate.residualRisk,
      ...primary,
      relatedCitations,
    });
  }

  return { verified, rejected };
}
