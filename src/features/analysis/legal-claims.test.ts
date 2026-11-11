import { describe, expect, it } from "vitest";

import { ModelError, type ModelClient } from "./model/client";
import { enforceLegalBoundary, findLegalClaims, LEGAL_REPAIR_SCHEMA_NAME, WITHHELD_SUMMARY, WITHHELD_TEXT } from "./legal-claims";
import type { RiskFlag } from "./types";

describe("finding legal conclusions in generated text", () => {
  it.each([
    "This late fee is likely unenforceable.",
    "A clause like this would be illegal in most states.",
    "Under New York law the landlord must return the deposit within 14 days.",
    "State law caps the deposit at one month's rent.",
    "The law requires the landlord to give 24 hours' notice.",
    "A court would probably not enforce this waiver.",
    "You are legally entitled to a refund.",
    "This lease looks safe to sign.",
    "You should not sign this lease until the fee is removed.",
    "Your landlord is required to accept this change.",
    "This violates tenant protection laws.",
  ])("flags %j", (text) => {
    expect(findLegalClaims(text)).not.toHaveLength(0);
  });

  it.each([
    "If you leave before month 12, you owe the remaining rent, up to \$14,400.",
    "The landlord can keep the whole deposit for any cleaning they decide is needed.",
    "You give up the right to a jury trial and must use arbitration instead.",
    "Local law may affect this.",
    "Ask the landlord to cap the fee at one month's rent.",
    "Using the unit for anything illegal ends the lease early.",
  ])("leaves %j alone", (text) => {
    expect(findLegalClaims(text)).toHaveLength(0);
  });

  it("ignores a phrase the quoted lease sentence itself uses", () => {
    const lease = "After the notice period the law requires, the Operator may sell the contents.";
    expect(findLegalClaims("After the notice period the law requires, your things can be sold.", lease)).toHaveLength(0);
  });
});

const FLAG: RiskFlag = {
  id: "f1",
  severity: "high",
  consequence: "This fee is likely unenforceable under state law, but you could be charged $500.",
  triggeringCondition: "You move out before the end of the term.",
  counterOffer: "Ask to cap the fee at one month's rent.",
  residualRisk: "You would still owe up to one month's rent.",
  sourceSentence: "Tenant shall pay a $500 early termination fee.",
  sourceDocumentId: "pasted-lease",
  sourceStart: 0,
  sourceEnd: 46,
};

function repairModel(reply: unknown): ModelClient & { calls: number } {
  const model = {
    calls: 0,
    async complete(request: { schemaName: string }) {
      model.calls += 1;
      expect(request.schemaName).toBe(LEGAL_REPAIR_SCHEMA_NAME);
      if (reply instanceof Error) throw reply;
      return reply;
    },
  };
  return model as ModelClient & { calls: number };
}

describe("enforcing the legal boundary on a review", () => {
  it("makes no call when nothing states a legal conclusion", async () => {
    const clean = { ...FLAG, consequence: "You could be charged $500." };
    const model = repairModel(null);
    const result = await enforceLegalBoundary("A twelve-month lease.", [clean], model);
    expect(model.calls).toBe(0);
    expect(result.riskFlags[0]).toBe(clean);
    expect(result.legalClaims).toEqual({ repaired: 0, withheld: 0 });
  });

  it("uses a repaired explanation once it no longer states a legal conclusion", async () => {
    const model = repairModel({ summary: null, items: [{ index: 0, consequence: "If you leave early you could be charged $500.", triggeringCondition: FLAG.triggeringCondition, counterOffer: FLAG.counterOffer, residualRisk: FLAG.residualRisk }] });
    const result = await enforceLegalBoundary("A twelve-month lease.", [FLAG], model);
    expect(result.riskFlags[0].consequence).toBe("If you leave early you could be charged $500.");
    expect(result.riskFlags[0].sourceSentence).toBe(FLAG.sourceSentence);
    expect(result.legalClaims).toEqual({ repaired: 1, withheld: 0 });
  });

  it("withholds the text, never the flag, when the repair still states a legal conclusion", async () => {
    const model = repairModel({ summary: null, items: [{ index: 0, consequence: "This is probably illegal, so you may not owe it.", triggeringCondition: FLAG.triggeringCondition, counterOffer: FLAG.counterOffer, residualRisk: FLAG.residualRisk }] });
    const result = await enforceLegalBoundary("A twelve-month lease.", [FLAG], model);
    expect(result.riskFlags).toHaveLength(1);
    expect(result.riskFlags[0].severity).toBe("high");
    expect(result.riskFlags[0].sourceSentence).toBe(FLAG.sourceSentence);
    expect(result.riskFlags[0].consequence).toBe(WITHHELD_TEXT.consequence);
    expect(result.riskFlags[0].counterOffer).toBe(FLAG.counterOffer);
    expect(result.legalClaims).toEqual({ repaired: 0, withheld: 1 });
  });

  it("withholds rather than fails when the repair call itself fails", async () => {
    const model = repairModel(new ModelError("timeout", "slow"));
    const result = await enforceLegalBoundary("Under state law this lease is fine.", [FLAG], model);
    expect(result.summary).toBe(WITHHELD_SUMMARY);
    expect(result.riskFlags).toHaveLength(1);
    expect(result.riskFlags[0].consequence).toBe(WITHHELD_TEXT.consequence);
    expect(result.legalClaims).toEqual({ repaired: 0, withheld: 2 });
  });

  it("drops the residual risk with a withheld counter-offer, since there is no edit left to describe", async () => {
    const pushy = { ...FLAG, consequence: "You could be charged $500.", counterOffer: "Your landlord is required to accept this cap." };
    const model = repairModel({ summary: null, items: [{ index: 0, consequence: pushy.consequence, triggeringCondition: pushy.triggeringCondition, counterOffer: "The landlord must accept this change by law.", residualRisk: pushy.residualRisk }] });
    const result = await enforceLegalBoundary("A twelve-month lease.", [pushy], model);
    expect(result.riskFlags[0].counterOffer).toBe(WITHHELD_TEXT.counterOffer);
    expect(result.riskFlags[0].residualRisk).toBe(WITHHELD_TEXT.residualRisk);
  });
});
