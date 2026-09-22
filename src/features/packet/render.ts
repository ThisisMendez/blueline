import type { Packet } from "./types";

/**
 * How a packet is laid in front of a model.
 *
 * One format, in one place, because two prompts now read the same packet —
 * the completeness check and the general review — and a flag or a reference
 * comes back naming a document by the id it was given here. If the two
 * prompts drifted apart, an id would mean one thing on the way out and
 * another on the way back.
 */

const DOCUMENT_OPEN = (id: string, title: string) =>
  `=== DOCUMENT id=${id} title="${title}" ===`;
const DOCUMENT_CLOSE = (id: string) => `=== END DOCUMENT id=${id} ===`;

/** Renders every document in the packet, id and title included, in order. */
export function renderDocumentBlocks(packet: Packet): string {
  return packet.documents
    .map(
      (document) =>
        `${DOCUMENT_OPEN(document.id, document.title)}\n${document.text}\n${DOCUMENT_CLOSE(document.id)}`,
    )
    .join("\n\n");
}
