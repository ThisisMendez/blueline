import { CHECKLIST_TOPIC_IDS, type ChecklistTopicId } from "@/features/analysis/checklist";
import type { GeneralReview, ReviewCitation, ReviewRole, RiskFlag } from "@/features/analysis/types";

const clauses = {
  deposit: "The landlord will send an itemized list of deductions and return the remaining deposit within 21 days after the renter returns the keys.",
  earlyExit: "If the renter moves out early, rent remains due through the last day of the term even if a new renter has started paying rent for the same apartment.",
  lateFee: "If rent is unpaid on the sixth day of the month, a $40 late fee applies for each day the balance remains unpaid.",
  guestFee: "A $75 charge applies for each overnight guest, including a guest who visits for one night.",
  repairs: "Send repair requests to the management office by email at repairs@example.com.",
  reimbursement: "The landlord will reimburse any contractor the renter hires for a reported repair, with no prior approval or spending limit.",
  credit: "If the apartment is not ready at noon on the first day of the term, the renter may deduct one month of rent from the first payment.",
} as const;

type Clause = keyof typeof clauses;

export const sampleDocument = {
  id: "sample-lease",
  title: "Maple Court sample lease",
  text: [
    "Maple Court Residential Lease",
    "",
    "1. Apartment and term",
    "The landlord rents Apartment 2 at Maple Court to the renter from April 1 through March 31.",
    "",
    "2. Rent and deposit",
    "Rent is $1,650 per month and is due on the first day of each month. The security deposit is $1,650.",
    clauses.deposit,
    clauses.lateFee,
    "",
    "3. Guests",
    clauses.guestFee,
    "",
    "4. Early move-out",
    clauses.earlyExit,
    "",
    "5. Repairs and move-in",
    clauses.repairs,
    clauses.reimbursement,
    clauses.credit,
  ].join("\n"),
} as const;

function cite(clause: Clause): ReviewCitation {
  const sourceSentence = clauses[clause];
  const sourceStart = sampleDocument.text.indexOf(sourceSentence);
  return {
    sourceSentence,
    sourceDocumentId: sampleDocument.id,
    sourceStart,
    sourceEnd: sourceStart + sourceSentence.length,
  };
}

function flag(clause: Clause, finding: Omit<RiskFlag, keyof ReviewCitation | "id">): RiskFlag {
  return { id: clause, ...cite(clause), ...finding };
}

const topicClauses: Partial<Record<ChecklistTopicId, Clause>> = {
  "deposit-deductions-and-return": "deposit",
  "early-exit-costs": "earlyExit",
  repairs: "repairs",
};

const flags: Record<ReviewRole, readonly RiskFlag[]> = {
  renter: [
    flag("earlyExit", {
      severity: "high",
      title: "Rent after you move out",
      consequence: "You could owe rent for months after leaving, even after someone else starts paying for the apartment.",
      triggeringCondition: "You move out before the lease ends.",
      nextStep: "Ask for rent to end when the replacement renter starts paying.",
      counterOffer: "Could we change this so my rent stops when a replacement renter begins paying or when my lease ends, whichever comes first?",
      residualRisk: "You could still owe rent while the apartment is vacant.",
    }),
    flag("lateFee", {
      severity: "medium",
      title: "Daily late fee",
      consequence: "Five days of late charges would add $200 to your balance.",
      triggeringCondition: "Your rent is still unpaid on the sixth day of the month.",
      nextStep: "Ask for a single late fee with an agreed cap.",
      counterOffer: "Could we use a single late fee of [agreed amount] for the month?",
      residualRisk: "The agreed charge would still apply if the payment is late.",
    }),
    flag("guestFee", {
      severity: "medium",
      title: "Charge for an overnight guest",
      consequence: "One overnight visit would cost you $75.",
      triggeringCondition: "You have an overnight guest, even for one night.",
      nextStep: "Ask what guest policy the landlord needs and whether ordinary visits can be free.",
      counterOffer: "Could we agree on a guest policy that allows ordinary overnight visits without a fee?",
      residualRisk: "Longer stays may still need approval under the agreed guest policy.",
    }),
  ],
  landlord: [
    flag("reimbursement", {
      severity: "high",
      title: "Open-ended repair costs",
      consequence: "You could be billed for work you did not approve, with no limit spelled out in the lease.",
      triggeringCondition: "The renter reports a repair and hires a contractor.",
      nextStep: "Describe who arranges ordinary repairs and how the renter can get urgent help.",
      counterOffer: "Send routine repair requests to [repair contact]. The landlord will arrange the work or confirm who will arrange it in writing. For urgent repairs, use [emergency contact and procedure].",
      residualRisk: "You may still need to arrange urgent work or pay for it.",
    }),
    flag("credit", {
      severity: "medium",
      title: "Full rent credit for a brief delay",
      consequence: "You could lose a full month of rent if the apartment is ready a few hours late.",
      triggeringCondition: "The apartment is unavailable at noon on the first day of the lease.",
      nextStep: "Agree on a credit that reflects the delay and explain how the renter can claim it.",
      counterOffer: "If move-in is delayed, the landlord will notify the renter and apply [agreed credit] for [period covered]. The parties can arrange a revised move-in date in writing.",
      residualRisk: "A longer delay could still cause costs or require a new move-in plan.",
    }),
  ],
};

export function sampleReview(role: ReviewRole): GeneralReview {
  return {
    role,
    summary: "This lease covers a one-year rental at Maple Court for $1,650 a month. It lists a security deposit, charges for late rent and guests, and a contact for reporting repairs.",
    riskFlags: flags[role],
    coverage: {
      items: CHECKLIST_TOPIC_IDS.map((topicId) => {
        const clause = topicClauses[topicId];
        return clause ? { topicId, status: "found", ...cite(clause) } : { topicId, status: "not-found" };
      }),
    },
    clean: false,
    cleanStatement: null,
    droppedFlagCount: 0,
  };
}
