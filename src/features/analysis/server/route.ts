import { z } from "zod";

import type { AccountsState } from "@/features/auth/session";
import type { ReviewStore } from "@/features/library/store";
import { checkCompleteness } from "@/features/packet/completeness";
import {
  MAXIMUM_PACKET_DOCUMENTS,
  type ExtractedDocument,
  type Packet,
} from "@/features/packet/types";

import { ModelError, type ModelClient } from "../model/client";
import { runGeneralReview } from "../review";
import type {
  AnalysisFailure,
  AnalysisOutcome,
  AnalysisRejection,
} from "../types";

/**
 * The analysis route, as a factory over its dependencies.
 *
 * `src/app/api/analysis/route.ts` composes this with the production wiring;
 * tests compose it with a model client built from the fixture corpus and an
 * in-memory store, and drive the same handler the browser does.
 */

export interface AnalysisRouteDependencies {
  readonly model: ModelClient;
  /** Resolved per request, never at module scope. */
  readonly accounts: () => Promise<AccountsState>;
  /** Null when accounts are not configured, and then nothing is persisted. */
  readonly store: () => Promise<ReviewStore | null>;
  readonly now: () => Date;
  readonly newReviewId: () => string;
}

/** The id the lease is cited by, whether it was pasted or read out of a PDF. */
export const PASTED_DOCUMENT_ID = "pasted-lease";

/**
 * The id of a document supplied alongside the lease, by its place in the
 * packet. The lease is document 1, so the first referenced document is
 * `supplied-2` — the numbering the screen shows the signer.
 */
export function suppliedDocumentId(position: number): string {
  return `supplied-${position}`;
}

const suppliedDocumentSchema = z.strictObject({
  text: z.string(),
  title: z.string().trim().min(1).max(200),
});

const resolutionSchema = z.strictObject({
  referenceId: z.string().trim().min(1).max(300),
  documentId: z.string().trim().min(1).max(100).nullable(),
});

/**
 * Text in, nothing else. There is no file field to send, which is what keeps
 * original bytes out of the product rather than a policy about deleting them.
 * A packet of several documents is several pieces of text and nothing more.
 */
const analysisRequestSchema = z.strictObject({
  text: z.string(),
  title: z.string().trim().min(1).max(200).optional(),
  /** The documents the lease refers to, in the order the signer added them. */
  referenced: z.array(suppliedDocumentSchema).max(MAXIMUM_PACKET_DOCUMENTS - 1).optional(),
  /** The signer's own answers about which supplied document covers which reference. */
  resolutions: z.array(resolutionSchema).max(50).optional(),
});

const REJECTION_STATUS: Record<AnalysisRejection, number> = {
  "malformed-request": 400,
  "empty-text": 400,
  "not-signed-in": 401,
};

const FAILURE_STATUS: Record<AnalysisFailure, number> = {
  "model-not-configured": 503,
  "model-timeout": 504,
  "model-rate-limited": 429,
  "model-unavailable": 502,
  "model-unreadable": 502,
};

function failureFor(error: ModelError): AnalysisFailure {
  switch (error.kind) {
    case "not-configured":
      return "model-not-configured";
    case "timeout":
      return "model-timeout";
    case "rate-limited":
      return "model-rate-limited";
    case "unreadable":
      return "model-unreadable";
    default:
      return "model-unavailable";
  }
}

function reject(reason: AnalysisRejection): Response {
  const outcome: AnalysisOutcome = { status: "rejected", reason };
  return Response.json(outcome, { status: REJECTION_STATUS[reason] });
}

export function createAnalysisRoute(
  dependencies: AnalysisRouteDependencies,
): (request: Request) => Promise<Response> {
  return async function POST(request: Request): Promise<Response> {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return reject("malformed-request");
    }

    const parsed = analysisRequestSchema.safeParse(body);
    if (!parsed.success) return reject("malformed-request");
    if (parsed.data.text.trim().length === 0) return reject("empty-text");

    const accounts = await dependencies.accounts();
    // Configured accounts mean the spec's rule applies: signed in before
    // anything is pasted. With accounts absent there is nobody to sign in as,
    // and the review runs unsaved rather than behind a pretend session.
    if (accounts.kind === "signed-out") return reject("not-signed-in");

    const lease: ExtractedDocument = {
      id: PASTED_DOCUMENT_ID,
      title: parsed.data.title ?? "Lease text you pasted",
      text: parsed.data.text,
    };
    const referenced: ExtractedDocument[] = (parsed.data.referenced ?? [])
      .filter((supplied) => supplied.text.trim().length > 0)
      .map((supplied, index) => ({
        id: suppliedDocumentId(index + 2),
        title: supplied.title,
        text: supplied.text,
      }));
    const packet: Packet = { documents: [lease, ...referenced] };

    // ADR 0005: completeness first. A packet that names a document nobody
    // supplied never reaches the pipeline below, so there is no partial
    // review to withhold — the review was never run.
    let completeness;
    try {
      completeness = await checkCompleteness({
        packet,
        model: dependencies.model,
        resolutions: parsed.data.resolutions ?? [],
      });
    } catch (error) {
      if (error instanceof ModelError) {
        const reason = failureFor(error);
        const outcome: AnalysisOutcome = { status: "failed", reason };
        return Response.json(outcome, { status: FAILURE_STATUS[reason] });
      }
      throw error;
    }

    if (completeness.kind === "incomplete") {
      // Not an error: the signer asked a fair question and this is the
      // answer. Nothing is persisted, because there is no review to keep.
      const outcome: AnalysisOutcome = {
        status: "blocked",
        documents: packet.documents,
        completeness,
      };
      return Response.json(outcome, { status: 200 });
    }

    let review;
    try {
      review = await runGeneralReview({ packet, model: dependencies.model });
    } catch (error) {
      if (error instanceof ModelError) {
        const reason = failureFor(error);
        const outcome: AnalysisOutcome = { status: "failed", reason };
        return Response.json(outcome, { status: FAILURE_STATUS[reason] });
      }
      throw error;
    }

    let reviewId: string | null = null;
    let persisted = false;

    if (accounts.kind === "signed-in") {
      const store = await dependencies.store();
      if (store) {
        reviewId = dependencies.newReviewId();
        await store.save({
          id: reviewId,
          signerId: accounts.signer.id,
          createdAt: dependencies.now().toISOString(),
          documents: packet.documents,
          review,
        });
        persisted = true;
      }
    }

    const outcome: AnalysisOutcome = {
      status: "reviewed",
      reviewId,
      persisted,
      documents: packet.documents,
      completeness,
      review,
    };
    return Response.json(outcome, { status: 200 });
  };
}
