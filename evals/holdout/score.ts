/**
 * Scores a candidate run on the holdout against frozen, adjudicated labels
 * (decision 1, step 7). Pure: no files, no network, no clock.
 *
 * The rules, fixed before any holdout scoring (see evals/holdout/README.md):
 *
 * - An adjudicated RISK is a resolved item whose reviewerDecision is "flag",
 *   whatever its materiality (a borderline item the adjudicator decided to
 *   flag is a risk).
 * - A flag FINDS a risk when its quote is verbatim in the reviewed text and
 *   its span overlaps the risk's sentence span in the same document: the
 *   rule evals/gold-set/score.ts uses for planted clauses.
 * - A FALSE FLAG is an emitted flag that overlaps no risk. That includes a
 *   flag on a sentence the adjudicator marked "do-not-flag" (ordinary,
 *   harmless oddity, or borderline-and-not-flagged), and a flag on a
 *   sentence nobody labelled: the reviewers record every risk, so a sentence
 *   not labelled "flag" is not a risk. A flag whose quote doesn't check out
 *   finds nothing and is also a false flag. The breakdown is reported so
 *   these can be told apart.
 * - A CLEAN LEASE is an adjudicated document with no risk. A clean-lease
 *   false alarm is a clean lease, reviewed, with at least one emitted flag.
 * - Only documents the product REVIEWED enter recall, false flags and clean
 *   leases, as in the gold set. Documents blocked, out of scope, failed or
 *   rate-limited are listed separately, and their risks are reported as
 *   "not reviewed" so they're never hidden. Rate-limited is a provider
 *   condition and never counted as model-unreadable.
 */
import type { FrozenLabels } from "./freeze";

export interface CandidateFlag {
  readonly severity: string;
  readonly sourceSentence: string;
  readonly sourceStart: number;
  readonly sourceEnd: number;
}

export type CandidateDocument =
  | { readonly documentId: string; readonly status: "reviewed"; readonly reviewedText: string; readonly flags: readonly CandidateFlag[] }
  | { readonly documentId: string; readonly status: "blocked" | "out-of-scope" | "unverified" | "failed" | "rate-limited" | "model-unreadable"; readonly reason: string };

export interface Rate {
  readonly count: number;
  readonly total: number;
}

export function formatRate({ count, total }: Rate): string {
  return `${count}/${total} (${total === 0 ? "n/a" : `${((count / total) * 100).toFixed(1)}%`})`;
}

export type FalseFlagKind = "do-not-flag item" | "unlabelled sentence" | "quote not in text";

export interface HoldoutReport {
  readonly recall: Rate;
  readonly falseFlags: Rate;
  readonly cleanLeaseFalseAlarms: Rate;
  readonly falseFlagBreakdown: Record<FalseFlagKind, number>;
  readonly missedRisks: { documentId: string; itemId: string; expectedSeverity: string | null }[];
  readonly notReviewed: { documentId: string; status: string; reason: string; risks: number }[];
  readonly rateLimited: number;
  readonly modelUnreadable: number;
}

type Span = [number, number];

function spanOf(text: string, sentence: string): Span | null {
  const at = text.indexOf(sentence);
  return at < 0 ? null : [at, at + sentence.length];
}

function overlaps(a: Span, b: Span): boolean {
  return a[0] < b[1] && b[0] < a[1];
}

function flagSpan(flag: CandidateFlag, text: string): Span | null {
  if (text.slice(flag.sourceStart, flag.sourceEnd) === flag.sourceSentence) return [flag.sourceStart, flag.sourceEnd];
  return spanOf(text, flag.sourceSentence);
}

const rate = (count: number, total: number): Rate => ({ count, total });

export function scoreHoldout(labels: Pick<FrozenLabels, "documents">, run: readonly CandidateDocument[]): HoldoutReport {
  const byId = new Map(run.map((document) => [document.documentId, document]));
  let risks = 0;
  let found = 0;
  let emitted = 0;
  let falseFlags = 0;
  let cleanReviewed = 0;
  let cleanWithFlag = 0;
  const breakdown: Record<FalseFlagKind, number> = { "do-not-flag item": 0, "unlabelled sentence": 0, "quote not in text": 0 };
  const missedRisks: HoldoutReport["missedRisks"] = [];
  const notReviewed: HoldoutReport["notReviewed"] = [];

  for (const document of labels.documents) {
    const riskItems = document.items.filter((item) => item.reviewerDecision === "flag");
    const outcome = byId.get(document.documentId);
    if (!outcome || outcome.status !== "reviewed") {
      notReviewed.push({
        documentId: document.documentId,
        status: outcome?.status ?? "not-run",
        reason: outcome ? outcome.reason : "no result in the run",
        risks: riskItems.length,
      });
      continue;
    }
    const text = outcome.reviewedText;
    const riskSpans = riskItems.map((item) => ({ item, at: spanOf(text, item.quotedSentence) }));
    const otherSpans = document.items.filter((item) => item.reviewerDecision !== "flag").map((item) => spanOf(text, item.quotedSentence)).filter((at): at is Span => at !== null);
    const foundIds = new Set<string>();
    for (const flag of outcome.flags) {
      emitted++;
      const at = text.includes(flag.sourceSentence) ? flagSpan(flag, text) : null;
      const hits = at ? riskSpans.filter((entry) => entry.at && overlaps(entry.at, at)) : [];
      for (const hit of hits) foundIds.add(hit.item.itemId);
      if (hits.length > 0) continue;
      falseFlags++;
      if (!at) breakdown["quote not in text"]++;
      else if (otherSpans.some((other) => overlaps(other, at))) breakdown["do-not-flag item"]++;
      else breakdown["unlabelled sentence"]++;
    }
    risks += riskItems.length;
    found += foundIds.size;
    for (const item of riskItems) {
      if (!foundIds.has(item.itemId)) missedRisks.push({ documentId: document.documentId, itemId: item.itemId, expectedSeverity: item.expectedSeverity });
    }
    if (riskItems.length === 0) {
      cleanReviewed++;
      if (outcome.flags.length > 0) cleanWithFlag++;
    }
  }

  return {
    recall: rate(found, risks),
    falseFlags: rate(falseFlags, emitted),
    cleanLeaseFalseAlarms: rate(cleanWithFlag, cleanReviewed),
    falseFlagBreakdown: breakdown,
    missedRisks,
    notReviewed,
    rateLimited: run.filter((document) => document.status === "rate-limited").length,
    modelUnreadable: run.filter((document) => document.status === "model-unreadable").length,
  };
}

export function renderHoldoutReport(report: HoldoutReport): string {
  const lines = [
    "Holdout: real-lease evaluation against frozen adjudicated labels",
    "",
    `Real-lease recall (adjudicated risks found / adjudicated risks, reviewed documents): ${formatRate(report.recall)}`,
    `False flags among emitted flags: ${formatRate(report.falseFlags)}`,
    `  on a do-not-flag item: ${report.falseFlagBreakdown["do-not-flag item"]}; on an unlabelled sentence: ${report.falseFlagBreakdown["unlabelled sentence"]}; quote not in text: ${report.falseFlagBreakdown["quote not in text"]}`,
    `Clean-lease false alarms (clean leases with a false flag / clean leases reviewed): ${formatRate(report.cleanLeaseFalseAlarms)}`,
    "",
    `Documents not reviewed: ${report.notReviewed.length} (rate-limited ${report.rateLimited}, model-unreadable ${report.modelUnreadable})`,
    ...report.notReviewed.map((entry) => `  ${entry.documentId}: ${entry.status} (${entry.reason}); ${entry.risks} adjudicated risk(s) not reviewed`),
    "",
    "Missed risks:",
    ...(report.missedRisks.length ? report.missedRisks.map((miss) => `  ${miss.documentId} ${miss.itemId} (expected ${miss.expectedSeverity ?? "no severity"})`) : ["  none"]),
  ];
  return `${lines.join("\n")}\n`;
}
