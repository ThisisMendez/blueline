import type { Packet } from "@/features/packet/types";

import { runCoverageChecklist } from "./coverage";
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
 *
 * The published coverage checklist is asked as its own question, after the
 * flags and against the same packet. Two questions, two calls: "what could
 * cost this signer" and "where does this agreement address each of our six
 * topics" have different answers, different failure modes and different
 * retries. An unverifiable flag is withheld, and an unresolved checklist
 * citation fails the review. Its result lands in its own field and never
 * joins the ranked flags.
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

    // A new citation alone does not establish that an earlier failed flag
    // was corrected. Match its explanation so unrelated retry flags cannot
    // erase the record of verification failures.
    const unmatchedRecoveries = [...recovered];
    let recoveredFailures = 0;
    for (const rejected of firstPass.rejected) {
      const index = unmatchedRecoveries.findIndex((flag) =>
        flag.consequence === rejected.consequence &&
        flag.triggeringCondition === rejected.triggeringCondition,
      );
      if (index >= 0) {
        recoveredFailures += 1;
        unmatchedRecoveries.splice(index, 1);
      }
    }
    droppedFlagCount = Math.max(
      firstPass.rejected.length - recoveredFailures,
      secondPass.rejected.length,
    );
  }

  if (flags.length === 0 && droppedFlagCount > 0) {
    throw new ModelError("verification-failed", "No proposed risk flags passed citation verification.");
  }

  const coverage = await runCoverageChecklist({ packet, model });

  const riskFlags = rankFlags(flags);
  // Absences do not make a review dirty. A lease can be silent on repairs
  // and still carry nothing that would cost the signer.
  const clean = riskFlags.length === 0;

  return {
    summary: first.summary,
    riskFlags,
    coverage,
    clean,
    cleanStatement: clean ? CLEAN_REVIEW_STATEMENT : null,
    droppedFlagCount,
  };
}
