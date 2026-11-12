import { z } from "zod";

/**
 * The zod form of the legal-repair reply (the JSON Schema it is checked
 * against is `legalRepairJsonSchema` in legal-claims.ts). It accepts exactly
 * what `isRepairReply` there accepts, so legal-claims.ts can send its repair
 * call through `completeStructured` and get the same one shape retry as every
 * other structured call. A repair that still fails after that keeps its
 * existing handling: the texts are withheld and the flags stay.
 */
export const modelLegalRepairSchema = z.object({
  summary: z.string().nullable(),
  items: z.array(z.object({
    index: z.number(),
    consequence: z.string(),
    triggeringCondition: z.string(),
    counterOffer: z.string(),
    residualRisk: z.string(),
  })),
});

export type ModelLegalRepair = z.infer<typeof modelLegalRepairSchema>;
