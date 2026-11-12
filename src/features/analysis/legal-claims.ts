import { ModelError, type ModelClient } from "./model/client";
import { modelLegalRepairSchema } from "./model/legal-repair-schema";
import { completeStructured } from "./model/structured";
import type { RiskFlag } from "./types";

/**
 * The Layer 1 legal boundary, checked in code (ADR 0014).
 *
 * Blueline describes what the lease says and what could follow from it. It
 * never states what a law requires or allows, never says a term is legal,
 * illegal or enforceable, and never tells the signer to sign or not. The
 * prompts say so; this module checks the generated prose for it, because a
 * disclaimer the output contradicts is worse than none.
 *
 * Deterministic patterns are one guardrail, not the whole system: they catch
 * the common phrasings, and the prompts carry the rest. A match that also
 * appears in the flag's own quoted sentence is the lease talking, not
 * Blueline, so it never counts.
 *
 * A hit is repaired once, from the verified lease sentence, and checked
 * again. If the repair still states a legal conclusion, that text is
 * withheld and replaced with a fixed notice. The flag itself, its quoted
 * sentence and its severity always stay: a possibly serious risk is never
 * dropped because its explanation overreached.
 */

const PATTERNS: readonly RegExp[] = [
  // A term judged legal or not: "this fee is likely unenforceable", "a clause
  // like this would be illegal". The subject must be the term itself, so
  // "even if you believed the use was lawful" is not a conclusion.
  /\b(?:it|this|that|term|terms|clause|clauses|provision|provisions|fee|fees|charge|charges|penalty|penalties|waiver|waivers|lease|agreement|requirement|restriction|deduction|deductions)\b(?:\s+\w+){0,3}?\s+(?:is|are|would\s+be|could\s+be|may\s+be|might\s+be|will\s+be|seems|appears)\s+(?:to\s+be\s+)?(?:(?:not|likely|probably|possibly|generally|usually|clearly)\s+)?(?:legal|illegal|lawful|unlawful|enforceable|unenforceable|void|invalid|legally\s+valid|legally\s+binding)\b/i,
  /\bunenforceable\b/i,
  /\bagainst the law\b/i,
  /\b(?:violates?|breach(?:es)?|contrary to|prohibited by|permitted by|allowed by|required by)\s+(?:the\s+)?(?:\w+\s+){0,2}(?:law|laws|statute|statutes|regulations?|code)\b/i,
  /\bunder\s+(?:the\s+)?(?:\w+\s+){0,3}(?:law|laws|statute|statutes|act)\b/i,
  /\b(?:state|federal|local|city|county|tenant|landlord-tenant|housing|consumer)\s+(?:law|laws|statute|statutes)\b/i,
  /\bthe\s+law\s+(?:requires|allows|permits|prohibits|forbids|caps|limits|protects|says|gives)\b/i,
  /\blegally\s+(?:required|obligated|entitled|allowed|permitted|binding|valid|protected)\b/i,
  /\b(?:courts?|judges?)\s+(?:would|will|generally|usually|typically|often|may|might|tend)\b/i,
  /\byou\s+(?:are|'re)\s+(?:legally\s+)?(?:protected|entitled)\b/i,
  /\bsafe\s+to\s+sign\b/i,
  /\b(?:you\s+should(?:\s+not|n't)?|do\s+not|don't)\s+sign\b/i,
  /\b(?:must|required\s+to|obligated\s+to|has\s+to|have\s+to)\s+accept\s+(?:this|these|the|your)\b/i,
];

export interface LegalClaimHit {
  readonly field: string;
  readonly match: string;
}

/**
 * Proposed lease wording quoted inside a counter-offer. Drafting phrases such
 * as "to the extent permitted by applicable law" belong in a lease and are
 * not Blueline stating a legal conclusion, so quoted wording is set aside.
 */
const QUOTED_WORDING = /(?:^|[\s:(])(?:'[^']{12,}'|"[^"]{12,}"|\u201c[^\u201d]{12,}\u201d|\u2018[^\u2019]{12,}\u2019)/g;

/**
 * Legal-conclusion phrases in `text`, ignoring any the quoted lease sentence
 * itself contains. With `ignoreQuotedWording`, proposed lease wording in
 * quotes is set aside first.
 */
export function findLegalClaims(text: string, sourceSentence = "", ignoreQuotedWording = false): string[] {
  const source = sourceSentence.toLowerCase();
  // The one sanctioned mention of law: it states a limit, not a conclusion.
  let checked = text.replace(/\blocal law may affect this\b/gi, "");
  if (ignoreQuotedWording) checked = checked.replace(QUOTED_WORDING, " ");
  const hits: string[] = [];
  for (const pattern of PATTERNS) {
    const match = checked.match(pattern);
    if (!match || source.includes(match[0].toLowerCase())) continue;
    // "any notice period required by law" points at whatever the law says
    // without saying it, as leases do. That is a reference, not a conclusion.
    const before = checked.slice(Math.max(0, (match.index ?? 0) - 40), match.index ?? 0);
    if (/\b(?:any|whatever)\b(?:\s+\w+){0,4}\s*$/i.test(before)) continue;
    // "after the legally required notice period": an attributive reference
    // to a requirement, not a statement of what it is.
    if (/^legally\s+required\b/i.test(match[0]) && /\b(?:the|a|an)\s+$/i.test(before)) continue;
    hits.push(match[0]);
  }
  return hits;
}

const FLAG_FIELDS = ["consequence", "triggeringCondition", "counterOffer", "residualRisk"] as const;
type FlagField = (typeof FLAG_FIELDS)[number];

export const WITHHELD_TEXT: Readonly<Record<FlagField, string>> = {
  consequence:
    "Blueline couldn't describe this term without stating a legal conclusion it can't support, so that explanation isn't shown. Read the quoted sentence and judge it yourself.",
  triggeringCondition: "Not shown, for the same reason.",
  counterOffer:
    "No proposed edit is shown for this term, because the one drafted stated a legal conclusion Blueline can't support.",
  residualRisk: "Not shown, because no proposed edit is shown.",
};

export const WITHHELD_SUMMARY =
  "We couldn't write a summary of this agreement without stating a legal conclusion we can't support, so it isn't shown. The flags below quote your lease directly.";

export const LEGAL_REPAIR_SCHEMA_NAME = "blueline_legal_repair";

const REPAIR_SYSTEM_PROMPT = `You rewrite explanations of lease terms so that they describe only what the lease says and what could follow from it.

Each item gives the exact lease sentence and some explanation fields that state a legal conclusion: what a law requires or allows, whether a term is legal, illegal or enforceable, what a court would do, or whether to sign. Rewrite every field you are given so it keeps the practical meaning (the money, deadline, obligation or lost option, and when it would matter) and drops the legal conclusion. Where the effect could depend on local law, you may say "local law may affect this" and nothing more. Use only the lease sentence. Do not add facts, figures or dates it doesn't contain.`;

export const legalRepairJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    summary: { type: ["string", "null"] },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          index: { type: "integer" },
          consequence: { type: "string" },
          triggeringCondition: { type: "string" },
          counterOffer: { type: "string" },
          residualRisk: { type: "string" },
        },
        required: ["index", "consequence", "triggeringCondition", "counterOffer", "residualRisk"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "items"],
  additionalProperties: false,
};

interface RepairReply {
  readonly summary: string | null;
  readonly items: readonly { index: number; consequence: string; triggeringCondition: string; counterOffer: string; residualRisk: string }[];
}

export interface LegalClaimOutcome {
  readonly summary: string;
  readonly riskFlags: readonly RiskFlag[];
  /** How many texts stated a legal conclusion and were repaired, and how many were withheld. */
  readonly legalClaims: { readonly repaired: number; readonly withheld: number };
}

function fieldHasClaim(field: FlagField, text: string, sourceSentence: string): boolean {
  return findLegalClaims(text, sourceSentence, field === "counterOffer").length > 0;
}

function flagHasClaim(flag: RiskFlag): boolean {
  return FLAG_FIELDS.some((field) => fieldHasClaim(field, flag[field], flag.sourceSentence));
}

/**
 * Checks the summary and every flag's prose, repairs what states a legal
 * conclusion once, and withholds whatever still does.
 */
export async function enforceLegalBoundary(
  summary: string,
  flags: readonly RiskFlag[],
  model: ModelClient,
): Promise<LegalClaimOutcome> {
  const summaryHit = findLegalClaims(summary).length > 0;
  const flagged = flags.map((flag, index) => ({ flag, index })).filter(({ flag }) => flagHasClaim(flag));
  if (!summaryHit && flagged.length === 0) {
    return { summary, riskFlags: flags, legalClaims: { repaired: 0, withheld: 0 } };
  }

  let reply: RepairReply | null = null;
  try {
    reply = await completeStructured(model, {
      system: REPAIR_SYSTEM_PROMPT,
      user: JSON.stringify({
        summary: summaryHit ? summary : null,
        items: flagged.map(({ flag, index }) => ({
          index,
          leaseSentence: flag.sourceSentence,
          consequence: flag.consequence,
          triggeringCondition: flag.triggeringCondition,
          counterOffer: flag.counterOffer,
          residualRisk: flag.residualRisk,
        })),
      }),
      schemaName: LEGAL_REPAIR_SCHEMA_NAME,
      jsonSchema: legalRepairJsonSchema,
    }, modelLegalRepairSchema, "The legal repair");
  } catch (error) {
    // A repair that can't run is a failed repair, not a failed review: the
    // texts are withheld below and the flags stay.
    if (!(error instanceof ModelError)) throw error;
  }

  let repaired = 0;
  let withheld = 0;

  let finalSummary = summary;
  if (summaryHit) {
    const candidate = reply?.summary ?? null;
    if (candidate && findLegalClaims(candidate).length === 0) {
      finalSummary = candidate;
      repaired += 1;
    } else {
      finalSummary = WITHHELD_SUMMARY;
      withheld += 1;
    }
  }

  const byIndex = new Map((reply?.items ?? []).map((item) => [item.index, item]));
  const riskFlags = flags.map((flag, index) => {
    if (!flagHasClaim(flag)) return flag;
    const candidate = byIndex.get(index);
    const next: { -readonly [K in keyof RiskFlag]: RiskFlag[K] } = { ...flag };
    for (const field of FLAG_FIELDS) {
      const original = flag[field];
      if (!fieldHasClaim(field, original, flag.sourceSentence)) continue;
      const rewritten = candidate?.[field];
      if (rewritten && !fieldHasClaim(field, rewritten, flag.sourceSentence)) {
        next[field] = rewritten;
        repaired += 1;
      } else {
        next[field] = WITHHELD_TEXT[field];
        withheld += 1;
        // An edit with no shown counter-offer has nothing for a residual risk to describe.
        if (field === "counterOffer") next.residualRisk = WITHHELD_TEXT.residualRisk;
      }
    }
    return next;
  });

  return { summary: finalSummary, riskFlags, legalClaims: { repaired, withheld } };
}
