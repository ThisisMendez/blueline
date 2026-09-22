import type { Packet } from "@/features/packet/types";

import { ModelError, type ModelClient } from "./model/client";
import {
  ANALYSIS_SCHEMA_NAME,
  analysisJsonSchema,
  modelAnalysisSchema,
  type ModelAnalysis,
} from "./model/schema";
import {
  ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisUserMessage,
  buildRetryUserMessage,
} from "./prompt";
import { CLEAN_REVIEW_STATEMENT, rankFlags, type GeneralReview } from "./types";
import { verifyFlags, type VerificationResult } from "./verify";

export interface GeneralReviewInput {
  readonly packet: Packet;
  readonly model: ModelClient;
}

async function askModel(model: ModelClient, user: string): Promise<ModelAnalysis> {
  const raw = await model.complete({
    system: ANALYSIS_SYSTEM_PROMPT,
    user,
    schemaName: ANALYSIS_SCHEMA_NAME,
    jsonSchema: analysisJsonSchema,
  });

  const parsed = modelAnalysisSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ModelError(
      "unreadable",
      `The analysis did not match the expected shape: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"} ${issue.message}`)
        .join("; ")}`,
    );
  }
  return parsed.data;
}

/**
 * The pipeline: ask the model, verify every citation, retry the ones that did
 * not match exactly once, drop whatever still does not match, and rank what
 * survives.
 *
 * A flag never leaves this function without offsets into the extracted text,
 * and the count of dropped flags travels with the review so the smoke script
 * and the evaluator corpus can report it rather than guess at it.
 */
export async function runGeneralReview({
  packet,
  model,
}: GeneralReviewInput): Promise<GeneralReview> {
  const first = await askModel(model, buildAnalysisUserMessage(packet));
  const firstPass: VerificationResult = verifyFlags(first.flags, packet);

  let flags = [...firstPass.verified];
  let droppedFlagCount = 0;

  if (firstPass.rejected.length > 0) {
    const retry = await askModel(
      model,
      buildRetryUserMessage(
        packet,
        firstPass.rejected.map((rejection) => rejection.quotation),
      ),
    );
    const secondPass = verifyFlags(retry.flags, packet);

    const alreadyHeld = new Set(flags.map((flag) => flag.id));
    const recovered = secondPass.verified.filter((flag) => !alreadyHeld.has(flag.id));
    flags = [...flags, ...recovered];

    droppedFlagCount = Math.max(0, firstPass.rejected.length - recovered.length);
  }

  const riskFlags = rankFlags(flags);
  const clean = riskFlags.length === 0;

  return {
    summary: first.summary,
    riskFlags,
    clean,
    cleanStatement: clean ? CLEAN_REVIEW_STATEMENT : null,
    droppedFlagCount,
  };
}
