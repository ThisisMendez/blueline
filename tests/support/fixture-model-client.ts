import type { ModelClient, ModelRequest } from "@/features/analysis/model/client";

import { loadFixture, type FixtureId, type LoadedFixture } from "../fixtures/index";

/**
 * A model client that answers from the fixture corpus.
 *
 * It is not a canned response: it reads the documents out of the prompt it
 * was handed, matches each one to a fixture by its text, and builds the reply
 * from that fixture's adjudicated sidecar, under the document ids the caller
 * actually used. Everything downstream of it — verification, the retry, the
 * drop, ranking, persistence, the screens — runs for real.
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
}

interface PromptDocument {
  readonly id: string;
  readonly text: string;
}

interface ModelFlagPayload {
  severity: string;
  consequence: string;
  triggeringCondition: string;
  sourceDocumentId: string;
  sourceSentence: string;
}

function readDocuments(userMessage: string): PromptDocument[] {
  const documents: PromptDocument[] = [];
  for (const match of userMessage.matchAll(DOCUMENT_PATTERN)) {
    documents.push({ id: match[1], text: match[3] });
  }
  return documents;
}

const ALL_FIXTURE_IDS: readonly FixtureId[] = ["adhesion-lease", "clean-lease"];

export interface FixtureModelClientOptions {
  readonly behaviour?: FixtureModelBehaviour;
  /** Which fixtures the client can recognise. Defaults to the whole corpus. */
  readonly fixtures?: readonly FixtureId[];
}

export function createFixtureModelClient(
  options: FixtureModelClientOptions = {},
): FixtureModelClient {
  const behaviour = options.behaviour ?? "correct";
  const corpus: LoadedFixture[] = (options.fixtures ?? ALL_FIXTURE_IDS).map(loadFixture);
  const requests: ModelRequest[] = [];

  function fixtureFor(document: PromptDocument): LoadedFixture | null {
    return (
      corpus.find((fixture) => document.text.includes(fixture.text.trim())) ?? null
    );
  }

  function flagsFor(document: PromptDocument, spoilFirstFlag: boolean): ModelFlagPayload[] {
    const fixture = fixtureFor(document);
    if (!fixture) return [];

    const flags: ModelFlagPayload[] = fixture.sidecar.plantedFlags.map((planted) => ({
      severity: planted.expectedSeverity,
      consequence: planted.consequence,
      triggeringCondition: planted.triggeringCondition,
      sourceDocumentId: document.id,
      sourceSentence: planted.sourceSentence,
    }));

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

  return {
    get requests() {
      return requests;
    },
    get callCount() {
      return requests.length;
    },
    async complete(request: ModelRequest): Promise<unknown> {
      requests.push(request);
      const attempt = requests.length;

      const spoilFirstFlag =
        behaviour === "unquotable-flag" ||
        (behaviour === "unquotable-then-correct" && attempt === 1);

      const documents = readDocuments(request.user);
      const summary =
        documents
          .map((document) => fixtureFor(document)?.sidecar.summary)
          .filter((value): value is string => Boolean(value))
          .join(" ") || "No document text was supplied.";

      return {
        summary,
        flags: documents.flatMap((document) => flagsFor(document, spoilFirstFlag)),
      };
    },
  };
}
