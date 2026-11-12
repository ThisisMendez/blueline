import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { countOccurrences, type GoldSet } from "./corpus";
import type { LabelOverlay } from "./score";

/**
 * Loads the proposed label corrections (label-corrections.json). The original
 * gold-set labels stay where they are; this file only says which sentences in
 * the three benign documents conflict with the owner's materiality standard.
 */

export const OVERLAY_PATH = resolve(dirname(fileURLToPath(import.meta.url)), "label-corrections.json");

export function loadLabelOverlay(path: string = OVERLAY_PATH): { overlay: LabelOverlay; sha256: string } {
  const raw = readFileSync(path);
  return {
    overlay: JSON.parse(raw.toString("utf8")) as LabelOverlay,
    sha256: createHash("sha256").update(raw).digest("hex"),
  };
}

/** Problems with an overlay: a sentence that is not in its document exactly once, or one on a document that is not benign. Empty when sound. */
export function overlayProblems(goldSet: GoldSet, overlay: LabelOverlay): string[] {
  const problems: string[] = [];
  for (const entry of overlay.corrections) {
    const document = goldSet.documents.find((candidate) => candidate.id === entry.document);
    if (!document) {
      problems.push(`${entry.document}: no such document`);
      continue;
    }
    if (!document.benign) problems.push(`${entry.document}: corrections apply to benign documents only`);
    const count = countOccurrences(document.text, entry.sentence);
    if (count !== 1) problems.push(`${entry.document}: sentence appears ${count} times, expected once: "${entry.sentence}"`);
  }
  return problems;
}
