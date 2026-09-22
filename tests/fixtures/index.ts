import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Identifier of the landlord-drafted adhesion lease fixture. */
export const ADHESION_LEASE = "adhesion-lease";

/** Identifier of the plainly written, fair lease fixture. */
export const CLEAN_LEASE = "clean-lease";

/**
 * Identifier of the lease that does not contain its own agreement: it names a
 * fee schedule and a pet addendum, and the terms that decide what leaving
 * early costs live in those documents rather than in this one.
 */
export const REFERENCING_LEASE = "referencing-lease";

/** The fee schedule `referencing-lease` names in its section 5.1. */
export const FEE_SCHEDULE = "fee-schedule";

/** The pet addendum `referencing-lease` names in its section 10.1. */
export const PET_ADDENDUM = "pet-addendum";

/** The fixtures that are leases in their own right and carry a full sidecar. */
export type LeaseFixtureId =
  | typeof ADHESION_LEASE
  | typeof CLEAN_LEASE
  | typeof REFERENCING_LEASE;

/** The fixtures that exist because a lease refers to them. */
export type SupportingFixtureId = typeof FEE_SCHEDULE | typeof PET_ADDENDUM;

export type FixtureId = LeaseFixtureId | SupportingFixtureId;

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

/**
 * A document this fixture refers to, adjudicated the same way a planted flag
 * is: the name as the document states it, the one sentence that makes the
 * reference, and which fixture satisfies it.
 */
export interface FixtureReference {
  /** The name of the referenced document, as the referring text states it. */
  name: string;
  /** Appears byte-for-byte, exactly once, in the referring fixture's text. */
  citingSentence: string;
  /** The fixture a signer would have to supply to satisfy this reference. */
  satisfiedBy: FixtureId;
}

/** What every fixture's sidecar carries, whether or not it is a lease. */
export interface FixtureSidecarBase {
  documentId: FixtureId;
  title: string;
  file: string;
  summary: string;
  plantedFlags: PlantedFlag[];
  harmlessOddities: HarmlessOddity[];
  /**
   * Documents this fixture refers to. Absent on the fixtures written before
   * referencing was in the corpus, which refer to nothing.
   */
  references?: FixtureReference[];
}

export interface FixtureSidecar extends FixtureSidecarBase {
  documentId: LeaseFixtureId;
  checklistTopics: Record<ChecklistTopicId, ChecklistTopic>;
  referencedDocuments: string[];
  qa: {
    answerable: AnswerableQuestion[];
    unanswerable: UnanswerableQuestion[];
  };
  redLines: RedLineExpectation[];
}

/**
 * The sidecar of a document that exists because a lease names it. It carries
 * the adjudicated flags and oddities but none of the lease-only sections: a
 * fee schedule has no dispute-routes topic and answers no question about
 * access to the home.
 */
export interface SupportingFixtureSidecar extends FixtureSidecarBase {
  documentId: SupportingFixtureId;
}

export type AnyFixtureSidecar = FixtureSidecar | SupportingFixtureSidecar;

export interface LoadedFixture {
  text: string;
  sidecar: AnyFixtureSidecar;
}

export interface LoadedLeaseFixture extends LoadedFixture {
  sidecar: FixtureSidecar;
}

export interface LoadedSupportingFixture extends LoadedFixture {
  sidecar: SupportingFixtureSidecar;
}

/** The references a fixture makes, as a list whether or not the sidecar has one. */
export function fixtureReferences(
  sidecar: AnyFixtureSidecar,
): readonly FixtureReference[] {
  return sidecar.references ?? [];
}

function readFixtureFile(name: string): string {
  return readFileSync(fileURLToPath(new URL(name, import.meta.url)), "utf8");
}

function readFixtureBytes(name: string): Buffer {
  return readFileSync(fileURLToPath(new URL(name, import.meta.url)));
}

/** Reads a fixture's extracted text and its adjudication sidecar from disk. */
export function loadFixture(id: LeaseFixtureId): LoadedLeaseFixture;
export function loadFixture(id: SupportingFixtureId): LoadedSupportingFixture;
export function loadFixture(id: FixtureId): LoadedFixture;
export function loadFixture(id: FixtureId): LoadedFixture {
  const text = readFixtureFile(`./${id}.txt`);
  const sidecar = JSON.parse(readFixtureFile(`./${id}.json`)) as AnyFixtureSidecar;
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
