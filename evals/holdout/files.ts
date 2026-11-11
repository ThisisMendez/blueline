/**
 * Where the holdout's files live, and the development lists a holdout
 * document must never appear in. Shared by the lock test, the freeze script
 * and the holdout runner.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { sha256 } from "./duplicates";
import { holdoutLockSchema, type DevelopmentList, type HoldoutLock } from "./lock";

export const HOLDOUT_DIR = path.resolve("evals/holdout");
export const LOCK_PATH = path.join(HOLDOUT_DIR, "lock.json");
export const MANIFEST_PATH = path.join(HOLDOUT_DIR, "manifest.json");
/** Gitignored. Labels quote holdout text, so they never go in the public repository. */
export const PRIVATE_DIR = path.join(HOLDOUT_DIR, "private");
export const LABELS_DIR = path.join(PRIVATE_DIR, "labels");
export const FROZEN_PATH = path.join(PRIVATE_DIR, "frozen-labels.json");
/** Committed: the hash of the frozen labels, and nothing they quote. */
export const SEAL_PATH = path.join(HOLDOUT_DIR, "frozen-labels.seal.json");

export function readLock(): HoldoutLock {
  return holdoutLockSchema.parse(JSON.parse(readFileSync(LOCK_PATH, "utf8")));
}

export function holdoutManifestIds(): string[] {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as { documents: { id: string }[] };
  return manifest.documents.map((document) => document.id);
}

export function holdoutTextPath(id: string): string {
  return path.join(HOLDOUT_DIR, "text", `${id}.txt`);
}

/** SHA-256 of each holdout document's local text, or null when it isn't on this machine. */
export function localTextHashes(): Record<string, string | null> {
  return Object.fromEntries(holdoutManifestIds().map((id) => {
    const file = holdoutTextPath(id);
    return [id, existsSync(file) ? sha256(readFileSync(file, "utf8")) : null];
  }));
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

/** Every list of documents that development work may read, tune against or show reviewers. */
export function developmentLists(): DevelopmentList[] {
  const lists: DevelopmentList[] = [];
  const corpus = readJson<{ documents: { id: string; available: boolean; sourceUrl: string }[] }>("evals/lease-corpus/manifest.json");
  lists.push({
    name: "evals/lease-corpus/manifest.json",
    ids: corpus.documents.map((document) => document.id),
    sourceUrls: corpus.documents.filter((document) => document.available).map((document) => document.sourceUrl),
  });
  const annotationDir = "evals/lease-corpus/annotations";
  const records = readdirSync(annotationDir).filter((name) => name.endsWith(".json")).map((name) => readJson<{ documentId: string; available: boolean; sha256Text?: string }>(path.join(annotationDir, name)));
  lists.push({
    name: annotationDir,
    ids: records.map((record) => record.documentId),
    textHashes: records.flatMap((record) => (record.available && record.sha256Text ? [record.sha256Text] : [])),
  });
  const gold = readJson<{ documents: { id: string }[] }>("evals/gold-set/corpus/manifest.json");
  lists.push({ name: "evals/gold-set/corpus/manifest.json", ids: gold.documents.map((document) => document.id) });
  const calibration = "evals/lease-corpus/calibration/batch.json";
  if (existsSync(calibration)) {
    lists.push({ name: calibration, ids: readJson<{ documents: { documentId: string }[] }>(calibration).documents.map((document) => document.documentId) });
  }
  const judgeDir = "evals/judge";
  for (const entry of readdirSync(judgeDir)) {
    const batch = path.join(judgeDir, entry, "batch.json");
    if (existsSync(batch)) {
      lists.push({ name: batch, ids: readJson<{ flags: { document: string }[] }>(batch).flags.map((flag) => flag.document) });
    }
  }
  return lists;
}
