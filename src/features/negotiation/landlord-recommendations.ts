import { COVERAGE_CHECKLIST, type ChecklistTopicId } from "@/features/analysis/checklist";
import { WITHHELD_TEXT } from "@/features/analysis/legal-claims";
import { rankFlags, type CoverageChecklist, type ReviewCitation, type RiskFlag } from "@/features/analysis/types";

const TOPIC_ACTIONS: Record<ChecklistTopicId, { check: string; draft: string }> = {
  "deposit-deductions-and-return": {
    check: "Spell out which deductions you will document and when you will return the balance.",
    draft: "The landlord will explain any deductions in writing. The remaining deposit will be returned by [return deadline] using [payment method].",
  },
  "early-exit-costs": {
    check: "Spell out the notice, any costs, and when the renter stops owing rent if they leave early.",
    draft: "To request an early move-out, the renter should give [notice] to [contact]. The renter owes [agreed costs] until [end point].",
  },
  "rent-changes": {
    check: "Confirm when the rent can change and how you will tell the renter.",
    draft: "The rent may change [when a change can take effect]. The landlord will give [notice] by [delivery method].",
  },
  repairs: {
    check: "Name a repair contact. Say who handles urgent repairs and which costs each side pays.",
    draft: "Send repair requests to [repair contact]. For urgent repairs, call [emergency contact]. Repair costs are handled as follows: [who pays for what].",
  },
  "access-to-the-home": {
    check: "Spell out when you may enter, how you give notice, and what counts as an emergency.",
    draft: "The landlord may enter for [reasons]. The landlord will give [notice] by [delivery method]. For [emergencies], the landlord may enter using [emergency procedure].",
  },
  "dispute-routes": {
    check: "Give both sides a contact for disagreements and a next step if direct discussion fails.",
    draft: "Either party may raise a concern with [contact] by [delivery method]. If discussion does not resolve the concern, either party may use [next step].",
  },
};

export interface LandlordRecommendation {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly citations: readonly ReviewCitation[];
  readonly draft: string;
  readonly kind: "flag" | "missing" | "confirm";
}

function overlaps(left: ReviewCitation, right: ReviewCitation) {
  return left.sourceDocumentId === right.sourceDocumentId
    && left.sourceStart < right.sourceEnd && right.sourceStart < left.sourceEnd;
}

export function landlordRecommendations(
  flags: readonly RiskFlag[],
  coverage: CoverageChecklist,
  draftableFlagIds?: readonly string[],
): LandlordRecommendation[] {
  const eligibleIds = draftableFlagIds ? new Set(draftableFlagIds) : undefined;
  const ranked = rankFlags(flags).filter((flag) => eligibleIds
    ? eligibleIds.has(flag.id)
    : flag.counterOffer.trim() && flag.counterOffer.trim() !== WITHHELD_TEXT.counterOffer);
  const cited: LandlordRecommendation[] = [];
  for (const flag of ranked) {
    if (cited.some(({ id }) => id === flag.id)) continue;
    cited.push({
      id: flag.id,
      kind: "flag",
      title: flag.title ?? "Clarify this term",
      detail: flag.consequence,
      citations: [flag, ...(flag.relatedCitations ?? [])],
      draft: flag.counterOffer,
    });
    if (cited.length === 5) break;
  }
  const items = new Map(coverage.items.map((item) => [item.topicId, item]));
  const missing = COVERAGE_CHECKLIST.flatMap((topic): LandlordRecommendation[] =>
    items.get(topic.id)?.status === "not-found" ? [{
      id: topic.id,
      kind: "missing",
      title: topic.name,
      detail: TOPIC_ACTIONS[topic.id].check,
      citations: [],
      draft: TOPIC_ACTIONS[topic.id].draft,
    }] : [],
  );
  const shortlist = [...cited.slice(0, 1), ...missing, ...cited.slice(1)].slice(0, 5);
  if (shortlist.length >= 3) return shortlist;

  const checked: LandlordRecommendation[] = [];
  const unrecorded: LandlordRecommendation[] = [];
  for (const topic of COVERAGE_CHECKLIST) {
    const item = items.get(topic.id);
    if (item?.status === "not-found") continue;
    const action = TOPIC_ACTIONS[topic.id];
    const check: LandlordRecommendation = {
      id: topic.id,
      kind: "confirm",
      title: topic.name,
      detail: action.check,
      citations: item ? [item] : [],
      draft: action.draft,
    };
    if (item && !shortlist.some(({ citations }) => citations.some((citation) => overlaps(citation, item)))) {
      checked.push(check);
    } else {
      unrecorded.push({ ...check, citations: [] });
    }
  }
  return [...shortlist, ...checked, ...unrecorded].slice(0, 3);
}
