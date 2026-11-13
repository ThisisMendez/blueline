import { WITHHELD_TEXT } from "@/features/analysis/legal-claims";
import { rankFlags, type RiskFlag } from "@/features/analysis/types";

export function discussionShortlist(flags: readonly RiskFlag[], draftableFlagIds?: readonly string[]): RiskFlag[] {
  const shortlist: RiskFlag[] = [];
  for (const flag of rankFlags(flags)) {
    const wording = flag.counterOffer.trim();
    const draftable = draftableFlagIds ? draftableFlagIds.includes(flag.id) : wording && wording !== WITHHELD_TEXT.counterOffer;
    if (flag.severity === "low" || !draftable) continue;
    if (shortlist.some((item) => item.id === flag.id)) continue;
    shortlist.push(flag);
    if (shortlist.length === 3) break;
  }
  return shortlist;
}

export function discussionDraft(flags: readonly RiskFlag[]): string {
  const requests = flags.map((flag) => {
    const quotes = [flag, ...(flag.relatedCitations ?? [])]
      .map(({ sourceSentence }) => `“${sourceSentence}”`).join("\n");
    return [quotes, flag.counterOffer].join("\n\n");
  });
  return [
    "Hi,",
    "",
    "Could we discuss the following lease wording?",
    "",
    requests.join("\n\n"),
    "",
    "Thanks",
  ].join("\n");
}
