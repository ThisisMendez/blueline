import { locateQuotation } from "@/features/packet/normalize";
import { findDocument, type Packet } from "@/features/packet/types";

import type { CandidateFlag } from "./model/schema";
import type { RiskFlag } from "./types";

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
  readonly reason: RejectionReason;
  readonly sourceDocumentId: string;
  /** The quotation as the model wrote it, used to name it in the retry. */
  readonly quotation: string;
}

export interface VerificationResult {
  readonly verified: readonly RiskFlag[];
  readonly rejected: readonly RejectedFlag[];
}

/** The id a flag keeps: derived from its citation, so it is stable. */
export function flagId(
  sourceDocumentId: string,
  sourceStart: number,
  sourceEnd: number,
): string {
  return `${sourceDocumentId}#${sourceStart}-${sourceEnd}`;
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
    const document = findDocument(packet, candidate.sourceDocumentId);
    if (!document) {
      rejected.push({
        reason: "unknown-document",
        sourceDocumentId: candidate.sourceDocumentId,
        quotation: candidate.sourceSentence,
      });
      continue;
    }

    const location = locateQuotation(document.text, candidate.sourceSentence);
    if (!location) {
      rejected.push({
        reason: "quotation-not-found",
        sourceDocumentId: candidate.sourceDocumentId,
        quotation: candidate.sourceSentence,
      });
      continue;
    }

    const id = flagId(document.id, location.start, location.end);
    if (seen.has(id)) continue;
    seen.add(id);

    verified.push({
      id,
      severity: candidate.severity,
      consequence: candidate.consequence,
      triggeringCondition: candidate.triggeringCondition,
      // The signer reads the document's own words, not the model's echo.
      sourceSentence: document.text.slice(location.start, location.end),
      sourceDocumentId: document.id,
      sourceStart: location.start,
      sourceEnd: location.end,
    });
  }

  return { verified, rejected };
}
