import { CHECKLIST_TOPIC_IDS } from "@/features/analysis/checklist";
import { CHECKLIST_SCHEMA_NAME } from "@/features/analysis/model/checklist-schema";
import { ANALYSIS_SCHEMA_NAME } from "@/features/analysis/model/schema";
import { COMPLETENESS_SCHEMA_NAME } from "@/features/analysis/model/completeness-schema";
import type { ModelClient } from "@/features/analysis/model/client";
import { QUESTION_SCHEMA_NAME } from "@/features/questions/contract";
import { RED_LINES_SCHEMA_NAME } from "@/features/red-lines/contract";
import { normalizeText } from "@/features/packet/normalize";
import { createFixtureModelClient } from "./fixture-model-client";

const reference = "The attached Fee Addendum forms part of this lease.";
export const lateFee = "Tenant shall pay a late fee of $100 per day until outstanding rent is paid.";
export const cap = "Total late fees may not exceed $300 per month.";
const exit = "Tenant shall pay four months of rent for ending the lease early.";
export const repairs = "Landlord shall complete every requested repair within one day.";
export const access = "Tenant shall provide access within seven days after a written request.";
const notices = "Any notice to end the lease must be delivered in person exactly 60 days before the end date.";
export const repairRedLine = "I need more than one day to make repairs.";
export const lease = [
  "Residential lease between the landlord and tenant.",
  reference, notices, lateFee, exit, repairs,
].join("\n");
export const addendum = ["Fee Addendum", cap, access].join("\n");

function finding(
  sourceDocumentId: string,
  title: string,
  severity: string,
  sourceSentence: string,
  consequence: string,
  nextStep: string,
  relatedCitations: readonly { sourceDocumentId: string; sourceSentence: string }[] = [],
  triggeringCondition = "The cited obligation is triggered.",
) {
  return {
    title, severity, sourceSentence, consequence, nextStep, relatedCitations,
    sourceDocumentId,
    triggeringCondition,
    counterOffer: "The parties will agree to a written schedule before the obligation begins.",
    residualRisk: "The parties still need to agree on the schedule.",
  };
}

const baselineModel = createFixtureModelClient();
export const roleFixtureModel: ModelClient = {
  async complete(request) {
    const documents = [...request.user.matchAll(/=== DOCUMENT id=(\S+) title="[^"]*" ===\n([\s\S]*?)\n=== END DOCUMENT id=\1 ===/g)];
    const leaseId = documents.find((document) => normalizeText(document[2]) === normalizeText(lease))?.[1];
    const addendumId = documents.find((document) => normalizeText(document[2]) === normalizeText(addendum))?.[1];
    if (!leaseId) return baselineModel.complete(request);

    if (request.schemaName === COMPLETENESS_SCHEMA_NAME) {
      return {
        agreement: { kind: "residential-lease", description: "a residential lease", evidenceDocumentId: null, evidenceSentence: null },
        references: [{
          name: "Fee Addendum", requirement: "required", citingDocumentId: leaseId, citingSentence: reference,
          satisfiedByDocumentId: addendumId ?? null,
        }],
      };
    }
    if (request.schemaName === CHECKLIST_SCHEMA_NAME) {
      const sources: Partial<Record<(typeof CHECKLIST_TOPIC_IDS)[number], string>> = {
        "early-exit-costs": exit, repairs, "access-to-the-home": access,
      };
      return { topics: CHECKLIST_TOPIC_IDS.map((topicId) => {
        const sourceSentence = sources[topicId];
        const sourceDocumentId = topicId === "access-to-the-home" ? addendumId : leaseId;
        return sourceSentence && sourceDocumentId
          ? { topicId, status: "found", sourceDocumentId, sourceSentence }
          : { topicId, status: "not-found", sourceDocumentId: null, sourceSentence: null };
      }) };
    }
    if (![ANALYSIS_SCHEMA_NAME, QUESTION_SCHEMA_NAME, RED_LINES_SCHEMA_NAME].includes(request.schemaName)) {
      return baselineModel.complete(request);
    }
    const role = /^Review role: (renter|landlord)$/m.exec(request.user)?.[1];
    if (!role) throw new Error("The selected perspective did not reach the review model.");
    if (request.schemaName === QUESTION_SCHEMA_NAME) {
      const question = JSON.parse(request.user.split("\n")[0].slice("Question: ".length)) as string;
      if (question !== "What is my deadline?" || !addendumId) {
        return { status: "not-addressed", needsLocalLaw: false, citations: [] };
      }
      return { status: "answered", needsLocalLaw: false, citations: [{
        sourceDocumentId: role === "landlord" ? leaseId : addendumId,
        sourceSentence: role === "landlord" ? repairs : access,
      }] };
    }
    if (request.schemaName === RED_LINES_SCHEMA_NAME) {
      return { matches: role === "landlord" ? [{
        redLineIndex: 0, sourceDocumentId: leaseId, sourceSentence: repairs,
        explanation: "The lease gives you one day to make repairs.",
      }] : [] };
    }
    if (!addendumId) throw new Error("The fee addendum is needed for this fixture.");
    const related = [{ sourceDocumentId: addendumId, sourceSentence: cap }];
    const noticeFlag = finding(
      leaseId, "Narrow notice window", "medium", notices,
      "Missing the single delivery date can create a dispute about when the lease ends.",
      "Ask for a delivery window and written acknowledgment.",
    );
    return {
      summary: "Rent carries a $100 daily late fee with a $300 monthly cap.",
      flags: role === "renter" ? [
        finding(leaseId, "Early-exit payment", "high", exit, "Leaving early costs four months of rent.", "Ask to reduce the exit payment."),
        finding(leaseId, "Daily late charge", "medium", lateFee, "You could owe $300 after three late days.", "Ask for a smaller one-time fee.", related),
        noticeFlag,
      ] : [
        finding(leaseId, "Daily late charge", "low", lateFee, "A $100 daily charge up to $300 can make a late balance harder to collect.", "Consider a flat fee to simplify collections.", related),
        finding(leaseId, "Repair and access timelines conflict", "high", repairs, "The one-day repair deadline may come before you can get access.", "Align the repair deadline with access.", [{ sourceDocumentId: addendumId, sourceSentence: access }], "The lease leaves it unclear which deadline takes priority when access takes more than one day."),
        noticeFlag,
      ],
    };
  },
};
