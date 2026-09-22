/**
 * The consistency-check prompt. See model/consistency-schema.ts for what
 * this call is for and why its "no" answers are handled differently from a
 * failed citation.
 */

export const CONSISTENCY_SYSTEM_PROMPT = `You check one thing: whether a drafted counter-offer and its own stated residual risk agree with each other, for the same lease clause.

For each numbered item below you are given the original clause, the proposed counter-offer, and the residual risk statement written for that counter-offer.

Mark an item inconsistent only when the residual risk statement describes something the counter-offer's own text contradicts — for example, claiming a specific right, charge, or condition still applies when the counter-offer changes or removes it, or claiming something is resolved when the counter-offer leaves it untouched. Do not mark an item inconsistent because you would have drafted the counter-offer differently, because the residual risk seems incomplete, or because the compromise seems weak to the landlord or the signer. Judge only whether the two texts you were given agree with each other.

Answer for every item, in the order given.`;

export interface ConsistencyCandidate {
  readonly index: number;
  readonly sourceSentence: string;
  readonly counterOffer: string;
  readonly residualRisk: string;
}

/** Renders each flag's clause, counter-offer, and residual risk for the model to check against each other. */
export function buildConsistencyUserMessage(
  candidates: readonly ConsistencyCandidate[],
): string {
  const rendered = candidates
    .map(
      (candidate) => `${candidate.index}. Original clause: "${candidate.sourceSentence}"
Counter-offer: "${candidate.counterOffer}"
Residual risk: "${candidate.residualRisk}"`,
    )
    .join("\n\n");

  return `Check each item below for internal consistency.\n\n${rendered}`;
}
