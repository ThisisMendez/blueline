/**
 * Freezes the holdout's adjudicated labels (decision 1, step 6).
 *
 *   npx tsx evals/holdout/freeze.ts
 *
 * Runs only when every locked document has two independent reviews and a
 * resolved adjudication in evals/holdout/private/labels/<id>.json, its text
 * still matches the lock, and the owner has confirmed the lock. It writes
 * evals/holdout/private/frozen-labels.json (gitignored: it quotes the leases)
 * and evals/holdout/frozen-labels.seal.json (committed: the hash only).
 *
 * After that the labels can't be edited: the script refuses to freeze twice,
 * the frozen file is made read-only, and anything that reads it checks its
 * hash against the committed seal first. Changing a label means a new,
 * recorded decision by the owner, not an edit.
 */
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { annotationRecordSchema, validateRecord, type AnnotationRecord, annotationItemSchema } from "../lease-corpus/annotation";
import { sha256 } from "./duplicates";
import type { HoldoutLock } from "./lock";
import { z } from "zod";

export const FROZEN_FORMAT = "blueline-holdout-frozen-labels";

export const frozenItemSchema = annotationItemSchema.extend({ disagreement: z.boolean() });
export const frozenDocumentSchema = z.strictObject({
  documentId: z.string(),
  sha256Text: z.string().length(64),
  reviewerIds: z.tuple([z.string(), z.string()]),
  adjudicatorId: z.string(),
  items: z.array(frozenItemSchema),
});
export const frozenPayloadSchema = z.strictObject({
  format: z.literal(FROZEN_FORMAT),
  version: z.literal(1),
  frozenOn: z.string(),
  lockSha256: z.string().length(64),
  documents: z.array(frozenDocumentSchema),
});
export type FrozenPayload = z.infer<typeof frozenPayloadSchema>;
export type FrozenLabels = FrozenPayload & { readonly contentSha256: string };

export const sealSchema = z.strictObject({
  format: z.literal(FROZEN_FORMAT),
  frozenOn: z.string(),
  contentSha256: z.string().length(64),
  documents: z.array(z.string()),
  note: z.string(),
});
export type Seal = z.infer<typeof sealSchema>;

/** Hash of the lock's membership, so frozen labels can't be paired with a different lock. */
export function lockHash(lock: HoldoutLock): string {
  return sha256(JSON.stringify(lock.documents.map((document) => [document.id, document.sha256Original, document.sha256Text])));
}

export function payloadHash(payload: FrozenPayload): string {
  return sha256(JSON.stringify(payload));
}

/**
 * Builds the frozen labels, or lists every reason it can't yet. `texts`
 * holds each locked document's local text (null when missing).
 */
export function buildFrozenLabels(
  lock: HoldoutLock,
  records: Readonly<Record<string, AnnotationRecord | undefined>>,
  texts: Readonly<Record<string, string | null>>,
  frozenOn: string,
): { frozen: FrozenLabels } | { problems: string[] } {
  const problems: string[] = [];
  if (!lock.ownerConfirmed) problems.push("the owner has not confirmed the holdout lock");
  const documents: FrozenPayload["documents"] = [];
  for (const locked of [...lock.documents].sort((a, b) => a.id.localeCompare(b.id))) {
    const record = records[locked.id];
    const text = texts[locked.id] ?? null;
    const where = locked.id;
    if (!record) { problems.push(`${where}: no label record`); continue; }
    if (!record.available) { problems.push(`${where}: record marked unavailable`); continue; }
    if (record.sha256Text !== locked.sha256Text) problems.push(`${where}: record's text hash differs from the lock`);
    if (text === null) problems.push(`${where}: text not on this machine, so quotes can't be checked`);
    else if (sha256(text) !== locked.sha256Text) problems.push(`${where}: local text differs from the lock`);
    for (const problem of validateRecord(record, text)) problems.push(`${where}: ${problem}`);
    const [first, second] = record.reviews;
    if (!first.reviewerId || !second.reviewerId || first.items.length === 0 || second.items.length === 0) {
      problems.push(`${where}: both reviews must be complete`);
    }
    if (record.adjudication.status !== "resolved") problems.push(`${where}: adjudication not resolved`);
    const adjudicator = record.adjudication.adjudicatorId;
    if (adjudicator && (adjudicator === first.reviewerId || adjudicator === second.reviewerId)) {
      problems.push(`${where}: the adjudicator also reviewed this document`);
    }
    if (first.reviewerId && second.reviewerId && adjudicator) {
      documents.push({
        documentId: locked.id,
        sha256Text: locked.sha256Text,
        reviewerIds: [first.reviewerId, second.reviewerId],
        adjudicatorId: adjudicator,
        items: record.adjudication.resolvedItems,
      });
    }
  }
  if (problems.length) return { problems };
  const payload: FrozenPayload = { format: FROZEN_FORMAT, version: 1, frozenOn, lockSha256: lockHash(lock), documents };
  return { frozen: { ...payload, contentSha256: payloadHash(payload) } };
}

/** Problems with a frozen file against its committed seal and the lock; empty when it can be used. */
export function verifyFrozen(raw: string, sealRaw: string, lock: HoldoutLock): string[] {
  let parsed: unknown;
  let seal: Seal;
  try {
    parsed = JSON.parse(raw);
    seal = sealSchema.parse(JSON.parse(sealRaw));
  } catch {
    return ["frozen labels or seal can't be read"];
  }
  const { contentSha256, ...rest } = parsed as Record<string, unknown>;
  const payload = frozenPayloadSchema.safeParse(rest);
  if (!payload.success) return ["frozen labels don't match the expected format"];
  const problems: string[] = [];
  const actual = payloadHash(payload.data);
  if (actual !== contentSha256) problems.push("frozen labels were edited after freezing (hash doesn't match the file's own)");
  if (actual !== seal.contentSha256) problems.push("frozen labels don't match the committed seal");
  if (payload.data.lockSha256 !== lockHash(lock)) problems.push("frozen labels were made against a different holdout lock");
  return problems;
}

/** Writes the frozen file and the seal. Refuses if either already exists. */
export function writeFrozen(frozen: FrozenLabels, frozenPath: string, sealPath: string): void {
  if (existsSync(frozenPath) || existsSync(sealPath)) {
    throw new Error("Labels are already frozen. They can't be edited or frozen again; a change needs a new, recorded owner decision and a new holdout version.");
  }
  mkdirSync(path.dirname(frozenPath), { recursive: true });
  const seal: Seal = {
    format: FROZEN_FORMAT,
    frozenOn: frozen.frozenOn,
    contentSha256: frozen.contentSha256,
    documents: frozen.documents.map((document) => document.documentId),
    note: "Hash of evals/holdout/private/frozen-labels.json, which is kept privately because it quotes the leases. Any edit to the labels breaks this hash, and the holdout runner refuses to run.",
  };
  writeFileSync(frozenPath, JSON.stringify(frozen, null, 2) + "\n", { flag: "wx" });
  chmodSync(frozenPath, 0o444);
  writeFileSync(sealPath, JSON.stringify(seal, null, 2) + "\n", { flag: "wx" });
}

async function main() {
  const files = await import("./files");
  const lock = files.readLock();
  const records: Record<string, AnnotationRecord | undefined> = {};
  const texts: Record<string, string | null> = {};
  for (const document of lock.documents) {
    const labelFile = path.join(files.LABELS_DIR, `${document.id}.json`);
    records[document.id] = existsSync(labelFile) ? annotationRecordSchema.parse(JSON.parse(readFileSync(labelFile, "utf8"))) : undefined;
    const textFile = files.holdoutTextPath(document.id);
    texts[document.id] = existsSync(textFile) ? readFileSync(textFile, "utf8") : null;
  }
  const result = buildFrozenLabels(lock, records, texts, new Date().toISOString());
  if ("problems" in result) {
    console.error("Not frozen:");
    for (const problem of result.problems) console.error(`  ${problem}`);
    process.exitCode = 1;
    return;
  }
  writeFrozen(result.frozen, files.FROZEN_PATH, files.SEAL_PATH);
  console.log(`Frozen ${result.frozen.documents.length} documents. Hash ${result.frozen.contentSha256}. Commit ${path.relative(process.cwd(), files.SEAL_PATH)}; keep the frozen file private.`);
}

if (process.argv[1]?.endsWith(path.join("holdout", "freeze.ts"))) void main();
