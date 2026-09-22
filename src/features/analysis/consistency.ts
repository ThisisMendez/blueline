import { buildConsistencyUserMessage, CONSISTENCY_SYSTEM_PROMPT } from "./consistency-prompt";
import { ModelError, type ModelClient } from "./model/client";
import {
  CONSISTENCY_SCHEMA_NAME,
  consistencyJsonSchema,
  modelConsistencySchema,
  type ModelConsistency,
} from "./model/consistency-schema";
import type { RiskFlag } from "./types";

/**
 * Shown in place of a residual-risk statement the consistency check could
 * not confirm agrees with its own counter-offer. The counter-offer itself is
 * still shown — the check found nothing wrong with the proposed edit, only
 * with the claim about what it leaves behind, so only that claim is
 * withheld, the same way a risk flag with no verifiable source sentence is
 * withheld rather than shown wrong.
 */
export const RESIDUAL_RISK_UNCONFIRMED =
  "Blueline could not confirm what would remain if this edit were accepted. Read the proposed edit above and judge for yourself what it does not address.";

async function askModel(model: ModelClient, user: string): Promise<ModelConsistency> {
  const raw = await model.complete({
    system: CONSISTENCY_SYSTEM_PROMPT,
    user,
    schemaName: CONSISTENCY_SCHEMA_NAME,
    jsonSchema: consistencyJsonSchema,
  });

  const parsed = modelConsistencySchema.safeParse(raw);
  if (!parsed.success) {
    throw new ModelError(
      "unreadable",
      `The consistency check did not match the expected shape: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"} ${issue.message}`)
        .join("; ")}`,
    );
  }
  return parsed.data;
}

/**
 * Checks every flag's counter-offer against its own residual-risk statement
 * (ADR 0013).
 *
 * This is not citation verification. Citation verification checks a fact —
 * is this sentence in the document — against ground truth the pipeline can
 * read for itself, so a failure withholds the whole flag. This checks a
 * second model's judgment about whether two pieces of the *first* model's
 * own output agree with each other, which is a fuzzier signal than a
 * verbatim match. A "no" here never fails the review or withholds the flag:
 * it replaces only the residual-risk statement, with an honest placeholder
 * in its place.
 *
 * A call failure — the check could not run at all — is a different
 * situation. That follows the same rule as every other model call in this
 * pipeline: it fails the review rather than showing a residual-risk claim
 * nothing has checked.
 */
export async function checkResidualRiskConsistency(
  flags: readonly RiskFlag[],
  model: ModelClient,
): Promise<readonly RiskFlag[]> {
  if (flags.length === 0) return flags;

  const candidates = flags.map((flag, index) => ({
    index,
    sourceSentence: flag.sourceSentence,
    counterOffer: flag.counterOffer,
    residualRisk: flag.residualRisk,
  }));

  const result = await askModel(model, buildConsistencyUserMessage(candidates));
  const verdictByIndex = new Map(result.results.map((entry) => [entry.index, entry]));

  // A missing verdict is not evidence of consistency. Unless the check
  // explicitly says yes, the claim is withheld rather than trusted by default.
  return flags.map((flag, index) => {
    const verdict = verdictByIndex.get(index);
    if (verdict?.consistent === true) return flag;
    return { ...flag, residualRisk: RESIDUAL_RISK_UNCONFIRMED };
  });
}
