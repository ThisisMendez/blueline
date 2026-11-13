import { WITHHELD_TEXT } from "@/features/analysis/legal-claims";
import { rankFlags, type RiskFlag } from "@/features/analysis/types";

export function discussionShortlist(flags: readonly RiskFlag[]): RiskFlag[] {
  const shortlist: RiskFlag[] = [];
  for (const flag of rankFlags(flags)) {
    const wording = flag.counterOffer.trim();
    if (flag.severity === "low" || !wording || wording === WITHHELD_TEXT.counterOffer) continue;
    if (shortlist.some((item) => item.id === flag.id)) continue;
    shortlist.push(flag);
    if (shortlist.length === 3) break;
  }
  return shortlist;
}

export function discussionDraft(flag: RiskFlag): string {
  const quotes = [flag, ...(flag.relatedCitations ?? [])]
    .map(({ sourceSentence }) => `“${sourceSentence}”`)
    .join("\n");
  return [
    "Hi,",
    "",
    "Could we discuss the following lease wording?",
    "",
    quotes,
    "",
    flag.counterOffer,
    "",
    "Thanks",
  ].join("\n");
}
