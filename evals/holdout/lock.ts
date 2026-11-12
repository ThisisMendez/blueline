/**
 * The holdout lock (decision 1, step 4): which documents are held out, at
 * which version, and with which bytes. Locked before any tuning so that
 * nobody can quietly swap a document or move one into development.
 *
 * Pure checks here; evals/holdout/lock.test.ts runs them against the
 * committed files, and the freeze and run scripts call them before doing
 * anything.
 */
import { z } from "zod";

export const lockedDocumentSchema = z.strictObject({
  id: z.string().min(1),
  replaces: z.string().min(1),
  sourceUrl: z.string().url(),
  version: z.string().min(1),
  sha256Original: z.string().length(64),
  sha256Text: z.string().length(64),
});

export const holdoutLockSchema = z.strictObject({
  lock: z.literal("blueline-real-lease-holdout"),
  lockedOn: z.string(),
  lockedBy: z.string(),
  ownerConfirmed: z.boolean(),
  ownerConfirmedOn: z.string().nullable(),
  note: z.string(),
  documents: z.array(lockedDocumentSchema).min(1),
  duplicateCheck: z.strictObject({
    method: z.string(),
    comparedWith: z.array(z.string()),
    highestOverlap: z.record(z.string(), z.number()),
    duplicatesFound: z.number().int(),
  }),
});
export type HoldoutLock = z.infer<typeof holdoutLockSchema>;

/** A list of document ids that development work may use, named for the error message. */
export interface DevelopmentList {
  readonly name: string;
  readonly ids: readonly string[];
  /** Source URLs of documents in the list that are actually used (available). */
  readonly sourceUrls?: readonly string[];
  /** Text hashes of documents in the list. */
  readonly textHashes?: readonly string[];
}

/**
 * Problems with the lock against what's on disk. `textHashes` maps each
 * holdout id to the SHA-256 of the local text, or null when the text isn't
 * on this machine (it is gitignored); a missing text is not a problem, a
 * different one is.
 */
export function checkLock(
  lock: HoldoutLock,
  textHashes: Readonly<Record<string, string | null>>,
  developmentLists: readonly DevelopmentList[],
): string[] {
  const problems: string[] = [];
  const ids = new Set(lock.documents.map((document) => document.id));
  if (ids.size !== lock.documents.length) problems.push("the lock lists a document twice");
  for (const document of lock.documents) {
    const actual = textHashes[document.id];
    if (actual === undefined) problems.push(`${document.id}: locked but not in the holdout manifest`);
    else if (actual !== null && actual !== document.sha256Text) {
      problems.push(`${document.id}: text hash changed since the lock (locked ${document.sha256Text}, now ${actual})`);
    }
  }
  for (const id of Object.keys(textHashes)) {
    if (!ids.has(id)) problems.push(`${id}: in the holdout manifest but not locked`);
  }
  for (const list of developmentLists) {
    for (const document of lock.documents) {
      if (list.ids.includes(document.id)) problems.push(`${document.id}: holdout document appears in development list ${list.name}`);
      if (list.sourceUrls?.includes(document.sourceUrl)) problems.push(`${document.id}: its source is used in development list ${list.name}`);
      if (list.textHashes?.includes(document.sha256Text)) problems.push(`${document.id}: its text is used in development list ${list.name}`);
    }
  }
  return problems;
}
