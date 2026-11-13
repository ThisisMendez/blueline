import { rankFlags, type RiskFlag, type Severity } from "@/features/analysis/types";

/**
 * Pure helpers behind the report screen. No model call and no guessing: the
 * "About this agreement" text is cut from the review's own summary, and the
 * fee filter reads only the verified sentences a flag cites.
 */

/** Short titles that end in a full stop but don't end a sentence. */
const ABBREVIATIONS = /\b(?:No|Nos|Mr|Mrs|Ms|Dr|St|Ave|Apt|Rd|Inc|Ltd|Co|Corp|Jr|Sr|vs|etc|e\.g|i\.e|approx|U\.S)\.$/i;

/**
 * The first `count` sentences of a text, unchanged. A sentence ends at `.`,
 * `!` or `?` (optionally followed by a closing quote or bracket) and then
 * whitespace. Common abbreviations such as "No." or "Apt." don't end one.
 * Amounts like "$1,250.00" never split because there is no space after the
 * full stop.
 */
export function firstSentences(text: string, count = 2): string {
  const trimmed = text.trim();
  if (!trimmed || count <= 0) return "";

  const boundary = /[.!?]["'”’)\]]*\s+/g;
  let found = 0;
  let match: RegExpExecArray | null;
  while ((match = boundary.exec(trimmed)) !== null) {
    const before = trimmed.slice(0, match.index + 1);
    if (ABBREVIATIONS.test(before)) continue;
    found += 1;
    if (found === count) return trimmed.slice(0, match.index + match[0].trimEnd().length);
  }
  return trimmed;
}

/**
 * Money words a cited sentence can contain. Deliberately narrow and literal:
 * a dollar sign, or one of fee, charge, deposit, penalty, late, or a rent
 * increase. Whole words only, so "relate" or "discharge" don't count.
 */
const MONEY_PATTERN =
  /\$|\b(?:fees?|charges?|charged|deposits?|penalt(?:y|ies)|late|rent increases?|increases? (?:in|to|of) (?:the )?rent|rent (?:will|may|shall) increase)\b/i;

/** True when a sentence mentions money in one of the ways above. */
export function sentenceMentionsMoney(sentence: string): boolean {
  return MONEY_PATTERN.test(sentence);
}

/**
 * True when a verified flag's cited sentence, or any passage it cites with
 * it, mentions fees or charges. Reads only the quoted lease text, never the
 * model's explanation, so the filter can't be talked into a match.
 */
export function mentionsFeesOrCharges(flag: Pick<RiskFlag, "sourceSentence" | "relatedCitations">): boolean {
  if (sentenceMentionsMoney(flag.sourceSentence)) return true;
  return (flag.relatedCitations ?? []).some((citation) => sentenceMentionsMoney(citation.sourceSentence));
}

export type FlagFilter = "all" | Severity | "fees";

export const FLAG_FILTERS: readonly { readonly value: FlagFilter; readonly label: string }[] = [
  { value: "all", label: "All" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "fees", label: "Mentions fees or charges" },
];

export function matchesFlagFilter(flag: RiskFlag, filter: FlagFilter): boolean {
  if (filter === "all") return true;
  if (filter === "fees") return mentionsFeesOrCharges(flag);
  return flag.severity === filter;
}

/** The flags a filter shows, most serious first, keeping the review's order within a severity. */
export function filterFlags(flags: readonly RiskFlag[], filter: FlagFilter): RiskFlag[] {
  return rankFlags(flags).filter((flag) => matchesFlagFilter(flag, filter));
}
