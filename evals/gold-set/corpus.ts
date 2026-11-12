import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Loads the instructor's gold set exactly as it was copied from
 * ankitvirmani/redline (tests/corpus and tests/fixtures). Paths in
 * manifest.json are relative to the corpus folder, so they resolve here
 * unchanged. Nothing in this file edits or normalizes a character.
 */

export const GOLD_CLAUSE_TYPES = [
  "arbitration-and-class-action-waiver",
  "unilateral-modification",
  "non-compete",
  "auto-renewal",
  "limitation-of-liability",
  "indemnification",
  "fee-escalators-and-late-fees",
] as const;
export type GoldClauseType = (typeof GOLD_CLAUSE_TYPES)[number];

export interface PlantedClause {
  readonly id: string;
  readonly clauseType: GoldClauseType;
  readonly sourceSentence: string;
  readonly expectedSeverityBand: string;
  readonly exit: { readonly text: string; readonly sourceSentence: string } | null;
}

export interface GoldDocument {
  readonly id: string;
  readonly path: string;
  readonly title: string;
  readonly text: string;
  readonly benign: boolean;
  readonly plantedClauses: readonly PlantedClause[];
  readonly unusualButHarmless: readonly string[];
  readonly questionSentences: readonly string[];
}

export interface GoldSet {
  readonly corpus: string;
  readonly version: number;
  readonly documents: readonly GoldDocument[];
}

interface ManifestEntry {
  id: string;
  document: string;
  sidecar: string;
  questions?: string;
  benign: boolean;
  unusualButHarmless: string[];
}

export const CORPUS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "corpus");

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function loadGoldSet(corpusDir: string = CORPUS_DIR): GoldSet {
  const manifest = readJson<{ corpus: string; version: number; documents: ManifestEntry[] }>(
    resolve(corpusDir, "manifest.json"),
  );
  const documents = manifest.documents.map((entry): GoldDocument => {
    const path = resolve(corpusDir, entry.document);
    const sidecar = readJson<{ title: string; plantedClauses: PlantedClause[] }>(resolve(corpusDir, entry.sidecar));
    for (const clause of sidecar.plantedClauses) {
      if (!(GOLD_CLAUSE_TYPES as readonly string[]).includes(clause.clauseType)) {
        throw new Error(`${entry.id} ${clause.id}: unknown clause type ${clause.clauseType}`);
      }
    }
    const questions = entry.questions
      ? readJson<{ grounded?: { expectedSourceSentence: string }[] }>(resolve(corpusDir, entry.questions))
      : null;
    return {
      id: entry.id,
      path,
      title: sidecar.title,
      text: readFileSync(path, "utf8"),
      benign: entry.benign,
      plantedClauses: sidecar.plantedClauses,
      unusualButHarmless: entry.unusualButHarmless,
      questionSentences: (questions?.grounded ?? []).map((question) => question.expectedSourceSentence),
    };
  });
  return { corpus: manifest.corpus, version: manifest.version, documents };
}

/** Every sentence the gold set claims is in a document, labelled by where it came from. */
export function goldSentences(document: GoldDocument): { label: string; sentence: string }[] {
  return [
    ...document.plantedClauses.flatMap((clause) => [
      { label: `${clause.id} sourceSentence`, sentence: clause.sourceSentence },
      ...(clause.exit ? [{ label: `${clause.id} exit.sourceSentence`, sentence: clause.exit.sourceSentence }] : []),
    ]),
    ...document.unusualButHarmless.map((sentence, index) => ({ label: `unusualButHarmless[${index}]`, sentence })),
    ...document.questionSentences.map((sentence, index) => ({ label: `grounded[${index}] expectedSourceSentence`, sentence })),
  ];
}

export function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  let count = 0;
  for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, at + 1)) count++;
  return count;
}
