import type { AnalysisOutcome, ReviewRole } from "@/features/analysis/types";
import type { ExtractedDocument } from "@/features/packet/types";

import { DEFAULT_REVIEW_TITLE } from "../title";

import { FAILURE_MESSAGE, NETWORK_MESSAGE, REJECTION_MESSAGE } from "./messages";

/**
 * One review in one browser tab, from picking a side to reading the report.
 *
 * The state lives in memory only. It is never written to the URL,
 * localStorage, sessionStorage or IndexedDB, so a refresh or a new tab starts
 * with nothing. That is the promise the signed-out intake makes: "This review
 * stays in this tab."
 */

export type ReviewSessionStatus =
  | "idle"
  | "processing"
  | "reviewed"
  | "blocked"
  | "out-of-scope"
  | "failed";

/** A document the signer chose, already reduced to text in their browser. */
export interface SessionDocument extends ExtractedDocument {
  /** The lease is the one document a packet must have, and it goes first. */
  readonly kind: "lease" | "supporting";
  /** The name of the file it came from. The file itself is not kept. */
  readonly fileName: string;
  readonly pageCount: number;
}

/** The analysis answers the session can hold. Rejections and failures become `error`. */
export type SessionOutcome = Extract<
  AnalysisOutcome,
  { readonly status: "reviewed" | "blocked" | "out-of-scope" | "unverified" }
>;

/** The signer's answers about which supplied document covers which reference. */
export type ReferenceChoices = Readonly<Record<string, string | null>>;

export interface ReviewSessionState {
  readonly status: ReviewSessionStatus;
  readonly role: ReviewRole | null;
  /** The lease first, then supporting documents in the order they were added. */
  readonly documents: readonly SessionDocument[];
  /** The review's display title, taken from the lease when it is chosen. */
  readonly title: string | null;
  readonly resolutions: ReferenceChoices;
  readonly outcome?: SessionOutcome;
  /** Plain-English reason the last run failed. Set only when status is `failed`. */
  readonly error?: string;
}

export interface ReviewSessionActions {
  chooseRole(role: ReviewRole): void;
  /** Puts this document in the lease's place, replacing any lease already chosen. */
  setLease(document: SessionDocument): void;
  addSupporting(document: SessionDocument): void;
  removeDocument(documentId: string): void;
  /** Records the signer's answer about a reference; `null` means "not sent yet". */
  choose(referenceId: string, documentId: string | null): void;
  /**
   * Sends the packet. A second call while one is running returns the same
   * run instead of starting another, so a double click is one review.
   */
  start(): Promise<void>;
  /** Runs the same packet again after a failure. */
  retry(): Promise<void>;
  /** Back to the intake with the role and documents kept. */
  returnToIntake(): void;
  /** Forgets everything. */
  reset(): void;
}

export interface ReviewSessionStore {
  getSnapshot(): ReviewSessionState;
  subscribe(listener: () => void): () => void;
  readonly actions: ReviewSessionActions;
}

export const INITIAL_REVIEW_SESSION: ReviewSessionState = {
  status: "idle",
  role: null,
  documents: [],
  title: null,
  resolutions: {},
};

export interface ReviewSessionDependencies {
  /** Defaults to the global `fetch`, read at call time. */
  readonly fetch?: typeof fetch;
}

/** The lease, if one has been chosen. */
export function leaseOf(state: ReviewSessionState): SessionDocument | null {
  return state.documents.find((document) => document.kind === "lease") ?? null;
}

export function supportingOf(state: ReviewSessionState): readonly SessionDocument[] {
  return state.documents.filter((document) => document.kind === "supporting");
}

/**
 * The body the analysis route expects. Titles and text only: there is no
 * field here that could carry a file.
 */
export function analysisRequestBody(state: ReviewSessionState): Record<string, unknown> | null {
  const lease = leaseOf(state);
  if (!state.role || !lease) return null;
  const referenced = supportingOf(state).map(({ title, text }) => ({ title, text }));
  const resolutions = Object.entries(state.resolutions).map(([referenceId, documentId]) => ({
    referenceId,
    documentId,
  }));
  return {
    role: state.role,
    text: lease.text,
    title: lease.title,
    ...(referenced.length > 0 ? { referenced } : {}),
    ...(resolutions.length > 0 ? { resolutions } : {}),
  };
}

function statusFor(outcome: SessionOutcome): ReviewSessionStatus {
  switch (outcome.status) {
    case "reviewed":
      return "reviewed";
    case "blocked":
      return "blocked";
    default:
      return "out-of-scope";
  }
}

export function createReviewSessionStore(
  dependencies: ReviewSessionDependencies = {},
): ReviewSessionStore {
  let state: ReviewSessionState = INITIAL_REVIEW_SESSION;
  const listeners = new Set<() => void>();
  let inFlight: Promise<void> | null = null;
  /** Bumped by every start and reset, so a late answer can't land on a newer packet. */
  let generation = 0;

  function set(next: ReviewSessionState) {
    state = next;
    for (const listener of listeners) listener();
  }

  /** A changed packet is a new packet: earlier answers and results no longer describe it. */
  function withDocuments(documents: readonly SessionDocument[]): ReviewSessionState {
    const lease = documents.find((document) => document.kind === "lease");
    return {
      status: state.status === "processing" ? state.status : "idle",
      role: state.role,
      documents,
      title: lease ? lease.title || DEFAULT_REVIEW_TITLE : null,
      resolutions: {},
    };
  }

  async function run(): Promise<void> {
    const body = analysisRequestBody(state);
    if (!body) return;
    const mine = ++generation;
    set({ ...state, status: "processing", outcome: undefined, error: undefined });

    const fail = (error: string) => {
      if (mine === generation) set({ ...state, status: "failed", outcome: undefined, error });
    };

    let outcome: AnalysisOutcome;
    try {
      const send = dependencies.fetch ?? fetch;
      const response = await send("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      outcome = (await response.json()) as AnalysisOutcome;
    } catch {
      fail(NETWORK_MESSAGE);
      return;
    }

    if (outcome.status === "rejected") return fail(REJECTION_MESSAGE[outcome.reason] ?? NETWORK_MESSAGE);
    if (outcome.status === "failed") return fail(FAILURE_MESSAGE[outcome.reason] ?? NETWORK_MESSAGE);
    if (mine !== generation) return;
    set({ ...state, status: statusFor(outcome), outcome, error: undefined });
  }

  const actions: ReviewSessionActions = {
    chooseRole(role) {
      if (state.status === "processing" || state.role === role) return;
      set({ ...state, role, status: "idle", outcome: undefined, error: undefined });
    },
    setLease(document) {
      if (state.status === "processing") return;
      const lease: SessionDocument = { ...document, kind: "lease" };
      set(withDocuments([lease, ...supportingOf(state)]));
    },
    addSupporting(document) {
      if (state.status === "processing") return;
      set(withDocuments([...state.documents, { ...document, kind: "supporting" }]));
    },
    removeDocument(documentId) {
      if (state.status === "processing") return;
      set(withDocuments(state.documents.filter((document) => document.id !== documentId)));
    },
    choose(referenceId, documentId) {
      set({ ...state, resolutions: { ...state.resolutions, [referenceId]: documentId } });
    },
    start() {
      if (inFlight) return inFlight;
      const current: Promise<void> = run().finally(() => {
        if (inFlight === current) inFlight = null;
      });
      inFlight = current;
      return current;
    },
    retry() {
      if (state.status !== "failed") return inFlight ?? Promise.resolve();
      return actions.start();
    },
    returnToIntake() {
      if (state.status === "processing") return;
      set({ ...state, status: "idle", outcome: undefined, error: undefined });
    },
    reset() {
      generation += 1;
      inFlight = null;
      set(INITIAL_REVIEW_SESSION);
    },
  };

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    actions,
  };
}
