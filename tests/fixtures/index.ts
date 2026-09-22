import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Identifier of the landlord-drafted adhesion lease fixture. */
export const ADHESION_LEASE = "adhesion-lease";

/** Identifier of the plainly written, fair lease fixture. */
export const CLEAN_LEASE = "clean-lease";

export type FixtureId = typeof ADHESION_LEASE | typeof CLEAN_LEASE;

/** Identifier of the PDF that opens correctly and holds no text at all. */
export const TEXTLESS_LEASE = "textless-lease";

/**
 * The PDFs in the corpus. `adhesion-lease.pdf` is the adhesion lease laid out
 * as selectable text; `textless-lease.pdf` is the document a scan looks like
 * to a reader. Both are written by `make-pdfs.ts` and committed.
 */
export type FixturePdfId = typeof ADHESION_LEASE | typeof TEXTLESS_LEASE;

/** The published coverage checklist, in the order the product lists it. */
export const CHECKLIST_TOPIC_IDS = [
  "deposit-deductions-and-return",
  "early-exit-costs",
  "rent-changes",
  "repairs",
  "access-to-the-home",
  "dispute-routes",
] as const;

export type ChecklistTopicId = (typeof CHECKLIST_TOPIC_IDS)[number];

export type Severity = "high" | "medium" | "low";

export type FlagCategory = "deposit" | "early-exit" | "dispute-rights" | "other";

/**
 * A risk flag an independent reviewer adjudicated in the fixture before any
 * Blueline output was seen.
 */
export interface PlantedFlag {
  id: string;
  category: FlagCategory;
  /** Appears byte-for-byte, exactly once, in the fixture's text. */
  sourceSentence: string;
  expectedSeverity: Severity;
  consequence: string;
  triggeringCondition: string;
  counterOffer: string;
  residualRisk: string;
}

/** Unusual wording that carries no material downside, used to count false alarms. */
export interface HarmlessOddity {
  sourceSentence: string;
  why: string;
}

export type ChecklistTopic =
  | { present: true; sourceSentence: string }
  | { present: false };

export interface AnswerableQuestion {
  question: string;
  expectedSourceSentence: string;
  expectedAnswer: string;
}

export interface UnanswerableQuestion {
  question: string;
}

/** A first-person red line a lease signer might write, and the term it matches. */
export interface RedLineExpectation {
  redLine: string;
  expectedMatchSentence: string;
  why: string;
}

export interface FixtureSidecar {
  documentId: FixtureId;
  title: string;
  file: string;
  summary: string;
  plantedFlags: PlantedFlag[];
  harmlessOddities: HarmlessOddity[];
  checklistTopics: Record<ChecklistTopicId, ChecklistTopic>;
  referencedDocuments: string[];
  qa: {
    answerable: AnswerableQuestion[];
    unanswerable: UnanswerableQuestion[];
  };
  redLines: RedLineExpectation[];
}

export interface LoadedFixture {
  text: string;
  sidecar: FixtureSidecar;
}

function readFixtureFile(name: string): string {
  return readFileSync(fileURLToPath(new URL(name, import.meta.url)), "utf8");
}

function readFixtureBytes(name: string): Buffer {
  return readFileSync(fileURLToPath(new URL(name, import.meta.url)));
}

/** Reads a fixture's extracted text and its adjudication sidecar from disk. */
export function loadFixture(id: FixtureId): LoadedFixture {
  const text = readFixtureFile(`./${id}.txt`);
  const sidecar = JSON.parse(readFixtureFile(`./${id}.json`)) as FixtureSidecar;
  return { text, sidecar };
}

/**
 * Reads a fixture PDF's bytes, in the shape a browser hands over from
 * `File.arrayBuffer()`, so a test feeds the extractor what the screen does.
 */
export function loadFixturePdf(id: FixturePdfId): ArrayBuffer {
  const bytes = readFixtureBytes(`./${id}.pdf`);
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}
