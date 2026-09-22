import { describe, expect, it } from "vitest";

import type { ModelClient, ModelRequest } from "./model/client";
import { ModelError } from "./model/client";
import { CONSISTENCY_SCHEMA_NAME } from "./model/consistency-schema";
import { checkResidualRiskConsistency, RESIDUAL_RISK_UNCONFIRMED } from "./consistency";
import type { RiskFlag } from "./types";

function flag(overrides: Partial<RiskFlag> = {}): RiskFlag {
  return {
    id: "doc#0-10",
    severity: "high",
    consequence: "Loses a month of rent.",
    triggeringCondition: "Vacates early.",
    counterOffer: "Cap the charge at the documented cost.",
    residualRisk: "Could still owe up to the documented cost.",
    sourceSentence: "The Resident forfeits the deposit.",
    sourceDocumentId: "doc",
    sourceStart: 0,
    sourceEnd: 10,
    ...overrides,
  };
}

/** A client that answers a fixed verdict list for the one call it expects. */
function clientAnswering(
  results: readonly { index: number; consistent: boolean; reason: string }[],
): ModelClient & { readonly requests: ModelRequest[] } {
  const requests: ModelRequest[] = [];
  return {
    requests,
    async complete(request) {
      requests.push(request);
      return { results };
    },
  };
}

describe("checkResidualRiskConsistency", () => {
  it("returns an empty list unchanged without calling the model", async () => {
    const client = clientAnswering([]);
    const result = await checkResidualRiskConsistency([], client);
    expect(result).toEqual([]);
    expect(client.requests).toHaveLength(0);
  });

  it("leaves a flag the model confirms as consistent unchanged", async () => {
    const client = clientAnswering([{ index: 0, consistent: true, reason: "consistent" }]);
    const flags = [flag()];
    const result = await checkResidualRiskConsistency(flags, client);
    expect(result).toEqual(flags);
  });

  it("replaces only residualRisk on a flag the model marks inconsistent", async () => {
    const client = clientAnswering([
      { index: 0, consistent: false, reason: "The draft removes the waiver but the risk statement still assumes it applies." },
    ]);
    const original = flag();
    const [result] = await checkResidualRiskConsistency([original], client);

    expect(result.residualRisk).toBe(RESIDUAL_RISK_UNCONFIRMED);
    expect(result.counterOffer).toBe(original.counterOffer);
    expect(result.severity).toBe(original.severity);
    expect(result.sourceSentence).toBe(original.sourceSentence);
  });

  it("treats a missing verdict as unconfirmed rather than trusting it by default", async () => {
    // The model answered for index 0 but silently dropped index 1.
    const client = clientAnswering([{ index: 0, consistent: true, reason: "consistent" }]);
    const flags = [flag({ id: "doc#0-10" }), flag({ id: "doc#20-30", sourceStart: 20, sourceEnd: 30 })];

    const result = await checkResidualRiskConsistency(flags, client);

    expect(result[0].residualRisk).toBe(flags[0].residualRisk);
    expect(result[1].residualRisk).toBe(RESIDUAL_RISK_UNCONFIRMED);
  });

  it("checks every flag in a single call, not one per flag", async () => {
    const client = clientAnswering([
      { index: 0, consistent: true, reason: "consistent" },
      { index: 1, consistent: true, reason: "consistent" },
      { index: 2, consistent: true, reason: "consistent" },
    ]);
    const flags = [flag(), flag(), flag()];

    await checkResidualRiskConsistency(flags, client);

    expect(client.requests).toHaveLength(1);
    expect(client.requests[0].schemaName).toBe(CONSISTENCY_SCHEMA_NAME);
  });

  it("fails the same way any other model call fails when the check itself cannot run", async () => {
    const client: ModelClient = {
      async complete() {
        throw new ModelError("rate-limited", "Too many requests.");
      },
    };
    await expect(checkResidualRiskConsistency([flag()], client)).rejects.toMatchObject({
      kind: "rate-limited",
    });
  });

  it("fails when the model's answer does not match the expected shape", async () => {
    const client: ModelClient = {
      async complete() {
        return { results: [{ index: 0 }] }; // missing consistent/reason
      },
    };
    await expect(checkResidualRiskConsistency([flag()], client)).rejects.toMatchObject({
      kind: "unreadable",
    });
  });
});
