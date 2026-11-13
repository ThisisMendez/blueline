import { describe, expect, it } from "vitest";

import type { RiskFlag } from "@/features/analysis/types";

import { filterFlags, firstSentences, mentionsFeesOrCharges, sentenceMentionsMoney } from "./report-helpers";

function flag(id: string, severity: RiskFlag["severity"], sourceSentence: string, related: string[] = []): RiskFlag {
  return {
    id,
    severity,
    sourceSentence,
    sourceDocumentId: "lease",
    sourceStart: 0,
    sourceEnd: sourceSentence.length,
    relatedCitations: related.map((sentence, index) => ({
      sourceSentence: sentence,
      sourceDocumentId: "addendum",
      sourceStart: index * 100,
      sourceEnd: index * 100 + sentence.length,
    })),
    consequence: "c",
    triggeringCondition: "t",
    counterOffer: "o",
    residualRisk: "r",
  };
}

describe("firstSentences", () => {
  it("keeps a short summary as it is", () => {
    expect(firstSentences("A one-year lease.")).toBe("A one-year lease.");
    expect(firstSentences("A one-year lease. Rent is due monthly.")).toBe("A one-year lease. Rent is due monthly.");
  });

  it("cuts a longer summary after the second sentence, word for word", () => {
    const summary =
      "The lease runs for twelve months at $1,250.00 a month. The tenant pays a deposit of $2,500! Repairs go to the landlord. Disputes go to arbitration.";
    expect(firstSentences(summary)).toBe(
      "The lease runs for twelve months at $1,250.00 a month. The tenant pays a deposit of $2,500!",
    );
  });

  it("doesn't end a sentence at a common abbreviation", () => {
    expect(firstSentences("The home is at Apt. 4 on Elm St. near the park. Rent is $900. Pets are allowed.")).toBe(
      "The home is at Apt. 4 on Elm St. near the park. Rent is $900.",
    );
  });

  it("returns nothing for an empty summary", () => {
    expect(firstSentences("   ")).toBe("");
  });
});

describe("mentionsFeesOrCharges", () => {
  it.each([
    "A fee of $100 applies for each day that rent is late.",
    "The tenant pays a $50 charge for each returned check.",
    "The landlord may keep the deposit.",
    "Rent is due on the first. A penalty applies after the fifth.",
    "Rent is late after the fifth day.",
    "The landlord may apply a rent increase with 30 days' notice.",
    "Monthly rent is $1,500.",
    "Fees are listed in Schedule B.",
  ])("finds money in %j", (sentence) => {
    expect(sentenceMentionsMoney(sentence)).toBe(true);
  });

  it.each([
    "The tenant shall pay for all pipe repairs.",
    "The landlord may enter with 24 hours' notice.",
    "Any discharge of water must be reported.",
    "Matters that relate to parking are in the rules.",
  ])("finds none in %j", (sentence) => {
    expect(sentenceMentionsMoney(sentence)).toBe(false);
  });

  it("reads a flag's related passages as well as its main one", () => {
    expect(mentionsFeesOrCharges(flag("a", "high", "Repairs are due within one day."))).toBe(false);
    expect(
      mentionsFeesOrCharges(flag("b", "high", "Repairs are due within one day.", ["A $75 charge applies to late repairs."])),
    ).toBe(true);
  });
});

describe("filterFlags", () => {
  const flags = [
    flag("low-fee", "low", "A $10 fee applies to key copies."),
    flag("high-1", "high", "The landlord keeps the whole deposit."),
    flag("medium-1", "medium", "The tenant fixes every appliance."),
    flag("high-2", "high", "The tenant may not leave early."),
  ];

  it("lists the most serious flags first and keeps the review's order inside a severity", () => {
    expect(filterFlags(flags, "all").map((item) => item.id)).toEqual(["high-1", "high-2", "medium-1", "low-fee"]);
  });

  it("keeps that order under every filter", () => {
    expect(filterFlags(flags, "fees").map((item) => item.id)).toEqual(["high-1", "low-fee"]);
    expect(filterFlags(flags, "high").map((item) => item.id)).toEqual(["high-1", "high-2"]);
    expect(filterFlags(flags, "low").map((item) => item.id)).toEqual(["low-fee"]);
  });
});
