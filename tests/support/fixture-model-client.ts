import type { ModelClient, ModelRequest } from "@/features/analysis/model/client";
import { COMPLETENESS_SCHEMA_NAME } from "@/features/analysis/model/completeness-schema";
import { normalizeText } from "@/features/packet/normalize";

import {
  fixtureReferences,
  loadFixture,
  type FixtureId,
  type LoadedFixture,
} from "../fixtures/index";

/**
 * A model client that answers from the fixture corpus.
 *
 * It is not a canned response: it reads the documents out of the prompt it
 * was handed, matches each one to a fixture by its text, and builds the reply
 * from that fixture's adjudicated sidecar, under the document ids the caller
 * actually used. Everything downstream of it — the completeness gate,
 * verification, the retry, the drop, ranking, persistence, the screens — runs
 * for real.
 *
 * It answers two questions, told apart by the schema the caller asked for:
 * what the packet refers to, and what the packet says. Both come out of the
 * same sidecars, so a reference the corpus adjudicated is the reference the
 * gate sees.
 *
 * Matching compares the product's normalised form of both texts, because the
 * same lease arrives with different line breaks depending on whether it was
 * pasted or lifted out of a PDF. A real model reading the PDF would quote the
 * sentence the same way, and the verifier already normalises before it looks.
 */

const DOCUMENT_PATTERN =
  /=== DOCUMENT id=(\S+) title="([^"]*)" ===\n([\s\S]*?)\n=== END DOCUMENT id=\1 ===/g;

/**
 * A sentence in no fixture, used to drive the drop and retry paths. The
 * fixture suite asserts the corpus never grows a sentence like it.
 */
export const UNQUOTABLE_SENTENCE =
  "The Resident shall deliver a written weather report to the Landlord before the first day of each month.";

export type FixtureModelBehaviour =
  /** Every adjudicated flag, quoted exactly. */
  | "correct"
  /** One flag carries a quotation that is in no document, on every call. */
  | "unquotable-flag"
  /** That flag is unquotable on the first call and exact on the retry. */
  | "unquotable-then-correct";

export interface FixtureModelClient extends ModelClient {
  /** Every request the pipeline made, in order. */
  readonly requests: readonly ModelRequest[];
  readonly callCount: number;
  /** Requests that asked the completeness schema. */
  readonly completenessRequests: readonly ModelRequest[];
  /** Requests that asked the general-review schema. */
  readonly analysisRequests: readonly ModelRequest[];
}

interface PromptDocument {
  readonly id: string;
  readonly text: string;
}

interface IdentifiedDocument extends PromptDocument {
  readonly fixture: LoadedFixture | null;
}

interface ModelFlagPayload {
  severity: string;
  consequence: string;
  triggeringCondition: string;
  sourceDocumentId: string;
  sourceSentence: string;
}

interface ModelReferencePayload {
  name: string;
  citingDocumentId: string;
  citingSentence: string;
  satisfiedByDocumentId: string | null;
}

function readDocuments(userMessage: string): PromptDocument[] {
  const documents: PromptDocument[] = [];
  for (const match of userMessage.matchAll(DOCUMENT_PATTERN)) {
    documents.push({ id: match[1], text: match[3] });
  }
  return documents;
}

const ALL_FIXTURE_IDS: readonly FixtureId[] = [
  "adhesion-lease",
  "clean-lease",
  "referencing-lease",
  "fee-schedule",
  "pet-addendum",
];

export interface FixtureModelClientOptions {
  readonly behaviour?: FixtureModelBehaviour;
  /** Which fixtures the client can recognise. Defaults to the whole corpus. */
  readonly fixtures?: readonly FixtureId[];
  /**
   * Completeness: reference names whose citing sentence comes back in no
   * document, on every call, so the gate retries and then drops them.
   */
  readonly unquotableReferences?: readonly string[];
  /**
   * Completeness: reference name to the fixture the model claims satisfies
   * it, overriding what the packet actually holds. `null` makes the model
   * miss a document the signer really did supply.
   */
  readonly mismatchedReferences?: Readonly<Record<string, FixtureId | null>>;
}

export function createFixtureModelClient(
  options: FixtureModelClientOptions = {},
): FixtureModelClient {
  const behaviour = options.behaviour ?? "correct";
  const corpus: LoadedFixture[] = (options.fixtures ?? ALL_FIXTURE_IDS).map((id) =>
    loadFixture(id),
  );
  const unquotableReferences = new Set(options.unquotableReferences ?? []);
  const mismatched = options.mismatchedReferences ?? {};
  const requests: ModelRequest[] = [];

  function fixtureFor(document: PromptDocument): LoadedFixture | null {
    const supplied = normalizeText(document.text);
    return (
      corpus.find((fixture) => supplied.includes(normalizeText(fixture.text))) ?? null
    );
  }

  function identify(userMessage: string): IdentifiedDocument[] {
    return readDocuments(userMessage).map((document) => ({
      ...document,
      fixture: fixtureFor(document),
    }));
  }

  function flagsFor(
    document: IdentifiedDocument,
    spoilFirstFlag: boolean,
  ): ModelFlagPayload[] {
    if (!document.fixture) return [];

    const flags: ModelFlagPayload[] = document.fixture.sidecar.plantedFlags.map(
      (planted) => ({
        severity: planted.expectedSeverity,
        consequence: planted.consequence,
        triggeringCondition: planted.triggeringCondition,
        sourceDocumentId: document.id,
        sourceSentence: planted.sourceSentence,
      }),
    );

    if (!spoilFirstFlag) return flags;

    if (flags.length === 0) {
      return [
        {
          severity: "medium",
          consequence: "The Resident would owe an extra duty every month.",
          triggeringCondition: "Each month of the Term begins.",
          sourceDocumentId: document.id,
          sourceSentence: UNQUOTABLE_SENTENCE,
        },
      ];
    }

    return flags.map((flag, index) =>
      index === 0 ? { ...flag, sourceSentence: UNQUOTABLE_SENTENCE } : flag,
    );
  }

  /** What the packet refers to, read off the sidecars of what was supplied. */
  function referencesIn(documents: IdentifiedDocument[]): ModelReferencePayload[] {
    const payloads: ModelReferencePayload[] = [];

    for (const document of documents) {
      if (!document.fixture) continue;

      for (const reference of fixtureReferences(document.fixture.sidecar)) {
        const wanted = Object.hasOwn(mismatched, reference.name)
          ? mismatched[reference.name]
          : reference.satisfiedBy;

        const satisfying = documents.find(
          (candidate) => candidate.fixture?.sidecar.documentId === wanted,
        );

        payloads.push({
          name: reference.name,
          citingDocumentId: document.id,
          citingSentence: unquotableReferences.has(reference.name)
            ? UNQUOTABLE_SENTENCE
            : reference.citingSentence,
          satisfiedByDocumentId: satisfying?.id ?? null,
        });
      }
    }

    return payloads;
  }

  function completenessRequests(): ModelRequest[] {
    return requests.filter((request) => request.schemaName === COMPLETENESS_SCHEMA_NAME);
  }

  function analysisRequests(): ModelRequest[] {
    return requests.filter((request) => request.schemaName !== COMPLETENESS_SCHEMA_NAME);
  }

  return {
    get requests() {
      return requests;
    },
    get callCount() {
      return requests.length;
    },
    get completenessRequests() {
      return completenessRequests();
    },
    get analysisRequests() {
      return analysisRequests();
    },
    async complete(request: ModelRequest): Promise<unknown> {
      requests.push(request);
      const documents = identify(request.user);

      if (request.schemaName === COMPLETENESS_SCHEMA_NAME) {
        return { references: referencesIn(documents) };
      }

      // The spoiled-flag behaviours count their own calls, so a completeness
      // check in front of the review does not shift which attempt is which.
      const attempt = analysisRequests().length;
      const spoilFirstFlag =
        behaviour === "unquotable-flag" ||
        (behaviour === "unquotable-then-correct" && attempt === 1);

      const summary =
        documents
          .map((document) => document.fixture?.sidecar.summary)
          .filter((value): value is string => Boolean(value))
          .join(" ") || "No document text was supplied.";

      return {
        summary,
        flags: documents.flatMap((document) => flagsFor(document, spoilFirstFlag)),
      };
    },
  };
}
