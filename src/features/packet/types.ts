/**
 * A document the signer supplied, reduced to the text that was extracted from
 * it. The original bytes are never carried here and are never stored: a
 * document is its id, its signer-facing title, and its extracted text.
 */
export interface ExtractedDocument {
  /** Stable identifier a risk flag cites. Unique within a packet. */
  readonly id: string;
  /** What the signer calls this document on screen. */
  readonly title: string;
  /** The text extracted in the browser, exactly as it will be stored. */
  readonly text: string;
}

/**
 * The complete agreement under review: the lease and, once ticket 03 lands,
 * every document it references. Ticket 01 builds a packet of one.
 */
export interface Packet {
  readonly documents: readonly ExtractedDocument[];
}

/**
 * How many documents one packet may hold: the lease plus the material it
 * refers to. The screen stops offering another slot at this number and the
 * route refuses a body that exceeds it, so the two cannot disagree.
 */
export const MAXIMUM_PACKET_DOCUMENTS = 12;

/** Finds a document by the id a risk flag cited, or null when it is not in the packet. */
export function findDocument(
  packet: Packet,
  documentId: string,
): ExtractedDocument | null {
  return packet.documents.find((document) => document.id === documentId) ?? null;
}
