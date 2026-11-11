import type { GoldClauseType, GoldDocument, GoldSet, PlantedClause } from "./corpus";

/**
 * Scores one gold-set run. Pure: no network, no clock, no file system, so
 * tests/gold-set-eval.test.ts can exercise every rule with made-up outcomes.
 * See evals/gold-set/README.md for why each rule is what it is.
 */

/**
 * The gold set's seven types, against the clauses PRD.md's "My red lines"
 * says Blueline flags. Auto-renewal and unilateral modification sit under
 * that table's "any other term" row, which names a consequential rent change.
 * `null` means PRD.md does not name the type or its harm, so it is out of
 * scope: reported for information, never counted as a miss.
 */
export const CLAUSE_TYPE_MAPPING: Readonly<Record<GoldClauseType, string | null>> = {
  "arbitration-and-class-action-waiver": "Waivers of dispute rights, including forced arbitration",
  "fee-escalators-and-late-fees": "Early termination, reassignment, or penalty fees (late fees); a consequential rent change (escalators)",
  "auto-renewal": "Automatic renewal or extension (a named red line since ticket 12)",
  "unilateral-modification": "Any other term with a plausible, material downside: a power to rewrite the terms, fees included, is a consequential rent change",
  "non-compete": null,
  "limitation-of-liability": null,
  "indemnification": null,
};

export const OUT_OF_SCOPE_REASONS: Readonly<Partial<Record<GoldClauseType, string>>> = {
  "non-compete": "Comes from employment agreements, which PRD.md's \"What we are not building\" puts outside the first version.",
  "limitation-of-liability": "PRD.md's red lines do not name it, and its research section lists the evidence for these categories as thin.",
  "indemnification": "PRD.md's red lines do not name it; its research section names indemnity as one of the thinly evidenced categories.",
};

export function inScope(type: GoldClauseType): boolean {
  return CLAUSE_TYPE_MAPPING[type] !== null;
}

export const CHARACTER_CLASSES = {
  "curly quote or apostrophe": /[‘’“”]/,
  "non-breaking space": /[  ]/,
  "fi or fl ligature": /[ﬁﬂ]/,
  "em dash": /—/,
  "two spaces in a row": / {2}/,
} as const;
export type CharacterClass = keyof typeof CHARACTER_CLASSES;

export function characterClasses(sentence: string): CharacterClass[] {
  return (Object.keys(CHARACTER_CLASSES) as CharacterClass[]).filter((name) => CHARACTER_CLASSES[name].test(sentence));
}

/** A flag as the analysis route delivered it, reduced to what scoring needs. */
export interface DeliveredFlag {
  readonly severity: string;
  readonly sourceDocumentId: string;
  readonly sourceSentence: string;
  readonly sourceStart: number;
  readonly sourceEnd: number;
  readonly consequence: string;
}

export type DocumentRun =
  | {
      readonly documentId: string;
      readonly status: "reviewed";
      /** Text of the document as the route returned it in `documents`. */
      readonly reviewedText: string;
      readonly flags: readonly DeliveredFlag[];
      readonly droppedFlagCount: number;
      /** Explanation texts that stated a legal conclusion: repaired, or withheld (ticket 14). */
      readonly legalClaims?: { readonly repaired: number; readonly withheld: number };
      readonly returnedFlagsAllAttempts: number;
    }
  | { readonly documentId: string; readonly status: "blocked"; readonly missing: readonly string[] }
  | { readonly documentId: string; readonly status: "out-of-scope"; readonly agreementKind: string; readonly description: string }
  | { readonly documentId: string; readonly status: "unverified" }
  | { readonly documentId: string; readonly status: "failed"; readonly reason: string };

export interface Rate {
  readonly count: number;
  readonly total: number;
}

export function formatRate({ count, total }: Rate): string {
  const percent = total === 0 ? "n/a" : `${((count / total) * 100).toFixed(1)}%`;
  return `${count}/${total} (${percent})`;
}

export interface ScoredFlag {
  readonly document: string;
  /** Blueline's flags carry no clause type, so this is always null. */
  readonly clauseType: null;
  readonly severity: string;
  readonly quotedSentence: string;
  readonly verbatimInDocument: boolean;
  readonly matchedPlantedClause: string | null;
  readonly matchedPlantedType: GoldClauseType | null;
  readonly matchedPlantedInScope: boolean | null;
  readonly hitsUnusualButHarmless: boolean;
}

export interface PlantedResult {
  readonly document: string;
  readonly id: string;
  readonly clauseType: GoldClauseType;
  readonly inScope: boolean;
  readonly found: boolean;
  readonly characterClasses: readonly CharacterClass[];
  /** The gold set's band for this clause, mapped onto Blueline's scale (see SEVERITY_BAND_MAPPING). */
  readonly expectedSeverity: "high" | "medium" | "low";
  /** The most severe flag that found it, or null when nothing did. */
  readonly foundSeverity: "high" | "medium" | "low" | null;
}

/**
 * The gold set grades planted clauses critical, high or moderate; Blueline
 * grades high, medium or low. Critical and high both mean "could change the
 * decision to sign", which is Blueline's high; moderate is Blueline's medium.
 * Nothing in the gold set is graded low.
 */
export const SEVERITY_BAND_MAPPING: Readonly<Record<string, "high" | "medium" | "low">> = {
  critical: "high",
  high: "high",
  moderate: "medium",
};
const SEVERITY_RANK = { high: 3, medium: 2, low: 1 } as const;

export interface GoldReport {
  readonly documents: {
    readonly total: number;
    readonly reviewed: string[];
    readonly blocked: { id: string; missing: readonly string[] }[];
    readonly outOfScope: { id: string; agreementKind: string; description: string }[];
    readonly unverified: string[];
    readonly failed: { id: string; reason: string }[];
  };
  readonly legalClaims: { readonly repaired: number; readonly withheld: number };
  readonly recall: Rate;
  readonly recallByType: Record<GoldClauseType, Rate & { inScope: boolean }>;
  readonly outOfScopeFound: Rate;
  readonly recallByCharacters: {
    readonly withAny: Rate;
    readonly withNone: Rate;
    readonly byClass: Record<CharacterClass, Rate>;
  };
  readonly typeNamedCorrectly: { readonly measurable: false; readonly reason: string };
  readonly groundedness: Rate & { readonly returnedFlagsAllAttempts: number };
  /** Found in-scope clauses whose most severe flag matches the gold band, plus how the rest missed. */
  readonly severity: { readonly agree: Rate; readonly under: number; readonly over: number };
  readonly cleanDocuments: {
    readonly documentsWithNoFlags: Rate;
    readonly flagsOnCleanDocuments: number;
    readonly perDocument: { id: string; flags: number }[];
  };
  readonly unmatchedFlagsOnPlantedDocuments: number;
  readonly flagsOnUnusualButHarmless: number;
  readonly planted: PlantedResult[];
  readonly flags: ScoredFlag[];
}

function span(text: string, sentence: string): [number, number] | null {
  const at = text.indexOf(sentence);
  return at === -1 ? null : [at, at + sentence.length];
}

function overlaps(a: [number, number], b: [number, number]): boolean {
  return a[0] < b[1] && b[0] < a[1];
}

/** Where a delivered flag sits in the document, or null when its quote does not check out. */
function flagSpan(flag: DeliveredFlag, text: string): [number, number] | null {
  if (text.slice(flag.sourceStart, flag.sourceEnd) === flag.sourceSentence) return [flag.sourceStart, flag.sourceEnd];
  return span(text, flag.sourceSentence);
}

const rate = (count: number, total: number): Rate => ({ count, total });

export function scoreGoldRun(goldSet: GoldSet, runs: readonly DocumentRun[]): GoldReport {
  const byId = new Map<string, GoldDocument>(goldSet.documents.map((document) => [document.id, document]));
  const planted: PlantedResult[] = [];
  const flags: ScoredFlag[] = [];
  let grounded = 0;
  let deliveredPlusDropped = 0;
  let returnedFlagsAllAttempts = 0;
  let unmatchedFlagsOnPlantedDocuments = 0;
  const cleanPerDocument: { id: string; flags: number }[] = [];

  for (const run of runs) {
    if (run.status !== "reviewed") continue;
    const document = byId.get(run.documentId);
    if (!document) throw new Error(`Run for unknown document ${run.documentId}`);
    // Spans are taken from the text the route reviewed, which is the gold text unchanged.
    const text = run.reviewedText;
    const plantedSpans = document.plantedClauses.map((clause) => ({ clause, at: span(text, clause.sourceSentence) }));
    const harmlessSpans = document.unusualButHarmless.map((sentence) => span(text, sentence)).filter((at) => at !== null);
    const foundIds = new Set<string>();
    const foundSeverity = new Map<string, "high" | "medium" | "low">();

    deliveredPlusDropped += run.flags.length + run.droppedFlagCount;
    returnedFlagsAllAttempts += run.returnedFlagsAllAttempts;
    for (const flag of run.flags) {
      const verbatim = flag.sourceDocumentId === "pasted-lease" && text.includes(flag.sourceSentence);
      if (verbatim) grounded++;
      const at = verbatim ? flagSpan(flag, text) : null;
      const match: PlantedClause | undefined = at
        ? plantedSpans.find((entry) => entry.at && overlaps(entry.at, at))?.clause
        : undefined;
      if (match) {
        foundIds.add(match.id);
        const severity = flag.severity as "high" | "medium" | "low";
        const held = foundSeverity.get(match.id);
        if (!held || SEVERITY_RANK[severity] > SEVERITY_RANK[held]) foundSeverity.set(match.id, severity);
      } else if (!document.benign) unmatchedFlagsOnPlantedDocuments++;
      flags.push({
        document: document.id,
        clauseType: null,
        severity: flag.severity,
        quotedSentence: flag.sourceSentence,
        verbatimInDocument: verbatim,
        matchedPlantedClause: match?.id ?? null,
        matchedPlantedType: match?.clauseType ?? null,
        matchedPlantedInScope: match ? inScope(match.clauseType) : null,
        hitsUnusualButHarmless: at !== null && harmlessSpans.some((harmless) => overlaps(harmless, at)),
      });
    }
    for (const { clause } of plantedSpans) {
      planted.push({
        document: document.id,
        id: clause.id,
        clauseType: clause.clauseType,
        inScope: inScope(clause.clauseType),
        found: foundIds.has(clause.id),
        characterClasses: characterClasses(clause.sourceSentence),
        expectedSeverity: SEVERITY_BAND_MAPPING[clause.expectedSeverityBand] ?? "medium",
        foundSeverity: foundSeverity.get(clause.id) ?? null,
      });
    }
    if (document.benign) cleanPerDocument.push({ id: document.id, flags: run.flags.length });
  }

  const tally = (items: PlantedResult[]) => rate(items.filter((item) => item.found).length, items.length);
  const scoped = planted.filter((item) => item.inScope);
  const recallByType = Object.fromEntries(
    (Object.keys(CLAUSE_TYPE_MAPPING) as GoldClauseType[]).map((type) => [
      type,
      { ...tally(planted.filter((item) => item.clauseType === type)), inScope: inScope(type) },
    ]),
  ) as GoldReport["recallByType"];
  const byClass = Object.fromEntries(
    (Object.keys(CHARACTER_CLASSES) as CharacterClass[]).map((name) => [
      name,
      tally(scoped.filter((item) => item.characterClasses.includes(name))),
    ]),
  ) as Record<CharacterClass, Rate>;

  return {
    documents: {
      total: goldSet.documents.length,
      reviewed: runs.filter((run) => run.status === "reviewed").map((run) => run.documentId),
      blocked: runs.flatMap((run) => (run.status === "blocked" ? [{ id: run.documentId, missing: run.missing }] : [])),
      outOfScope: runs.flatMap((run) => (run.status === "out-of-scope" ? [{ id: run.documentId, agreementKind: run.agreementKind, description: run.description }] : [])),
      unverified: runs.flatMap((run) => (run.status === "unverified" ? [run.documentId] : [])),
      failed: runs.flatMap((run) => (run.status === "failed" ? [{ id: run.documentId, reason: run.reason }] : [])),
    },
    legalClaims: runs.reduce(
      (total, run) => run.status === "reviewed" && run.legalClaims
        ? { repaired: total.repaired + run.legalClaims.repaired, withheld: total.withheld + run.legalClaims.withheld }
        : total,
      { repaired: 0, withheld: 0 },
    ),
    recall: tally(scoped),
    recallByType,
    outOfScopeFound: tally(planted.filter((item) => !item.inScope)),
    recallByCharacters: {
      withAny: tally(scoped.filter((item) => item.characterClasses.length > 0)),
      withNone: tally(scoped.filter((item) => item.characterClasses.length === 0)),
      byClass,
    },
    typeNamedCorrectly: {
      measurable: false,
      reason: "Blueline's risk flags have no clause type field (RiskFlag in src/features/analysis/types.ts), and app code is not changed for this eval.",
    },
    groundedness: { ...rate(grounded, deliveredPlusDropped), returnedFlagsAllAttempts },
    severity: (() => {
      const graded = planted.filter((item) => item.inScope && item.found && item.foundSeverity);
      const agree = graded.filter((item) => item.foundSeverity === item.expectedSeverity).length;
      const under = graded.filter((item) => SEVERITY_RANK[item.foundSeverity!] < SEVERITY_RANK[item.expectedSeverity]).length;
      return { agree: rate(agree, graded.length), under, over: graded.length - agree - under };
    })(),
    cleanDocuments: {
      documentsWithNoFlags: rate(cleanPerDocument.filter((entry) => entry.flags === 0).length, cleanPerDocument.length),
      flagsOnCleanDocuments: cleanPerDocument.reduce((sum, entry) => sum + entry.flags, 0),
      perDocument: cleanPerDocument,
    },
    unmatchedFlagsOnPlantedDocuments,
    flagsOnUnusualButHarmless: flags.filter((flag) => flag.hitsUnusualButHarmless).length,
    planted,
    flags,
  };
}

export function renderGoldReport(report: GoldReport, header: readonly string[]): string {
  const lines = [...header, ""];
  const { documents } = report;
  const excluded = documents.blocked.length + documents.outOfScope.length + documents.unverified.length + documents.failed.length;
  lines.push(`Documents: ${documents.total} in manifest; ${documents.reviewed.length} reviewed; ${excluded} left out of every denominator.`);
  for (const entry of documents.failed) lines.push(`  left out, model call failed: ${entry.id} (${entry.reason})`);
  for (const entry of documents.blocked) lines.push(`  left out, blocked as incomplete: ${entry.id} (missing: ${entry.missing.join("; ")})`);
  for (const entry of documents.outOfScope) lines.push(`  left out, blocked as out of scope (${entry.agreementKind}): ${entry.id} (${entry.description})`);
  for (const id of documents.unverified) lines.push(`  left out, completeness could not be verified: ${id}`);
  lines.push("");
  lines.push(`Legal-conclusion texts (ticket 14): ${report.legalClaims.repaired} repaired, ${report.legalClaims.withheld} withheld`);
  lines.push(`Recall (in-scope planted clauses found): ${formatRate(report.recall)}`);
  for (const [type, value] of Object.entries(report.recallByType)) {
    lines.push(`  ${value.inScope ? "in scope    " : "out of scope"} ${type}: ${formatRate(value)}`);
  }
  lines.push(`Out-of-scope planted clauses flagged anyway (information only, never a miss): ${formatRate(report.outOfScopeFound)}`);
  lines.push(`Named the right type: not measurable. ${report.typeNamedCorrectly.reason}`);
  lines.push("");
  lines.push("Recall by characters in the planted sentence (in-scope only):");
  lines.push(`  has at least one: ${formatRate(report.recallByCharacters.withAny)}`);
  lines.push(`  has none: ${formatRate(report.recallByCharacters.withNone)}`);
  for (const [name, value] of Object.entries(report.recallByCharacters.byClass)) lines.push(`  ${name}: ${formatRate(value)}`);
  lines.push("");
  lines.push(`Severity agreement (found in-scope clauses whose most severe flag matches the gold band; critical and high = high, moderate = medium): ${formatRate(report.severity.agree)}; graded lower: ${report.severity.under}; graded higher: ${report.severity.over}`);
  lines.push(`Groundedness (delivered flags quoted verbatim / all flags the model returned, delivered + dropped): ${formatRate(report.groundedness)}`);
  lines.push(`  raw flags across every model attempt, retries included: ${report.groundedness.returnedFlagsAllAttempts}`);
  lines.push("");
  lines.push(`Clean documents with no flags: ${formatRate(report.cleanDocuments.documentsWithNoFlags)}; flags on clean documents: ${report.cleanDocuments.flagsOnCleanDocuments}`);
  for (const entry of report.cleanDocuments.perDocument) lines.push(`  ${entry.id}: ${entry.flags} flag(s)`);
  lines.push(`Flags on planted documents that matched no planted clause: ${report.unmatchedFlagsOnPlantedDocuments}`);
  lines.push(`Flags on an unusual-but-harmless sentence: ${report.flagsOnUnusualButHarmless}`);
  lines.push("");
  lines.push("Planted clauses:");
  for (const item of report.planted) {
    const chars = item.characterClasses.length ? ` [${item.characterClasses.join(", ")}]` : "";
    lines.push(`  ${item.found ? "FOUND" : item.inScope ? "MISS " : "-    "} ${item.document} ${item.id} ${item.clauseType}${item.inScope ? "" : " (out of scope)"}${chars}`);
  }
  lines.push("");
  lines.push("Flags:");
  for (const flag of report.flags) {
    lines.push(`  [${flag.severity}] ${flag.document} type=${flag.clauseType ?? "none (product names no type)"} matched=${flag.matchedPlantedClause ?? "no"}${flag.matchedPlantedType ? ` (${flag.matchedPlantedType})` : ""} verbatim=${flag.verbatimInDocument ? "yes" : "NO"}`);
    lines.push(`    "${flag.quotedSentence}"`);
  }
  lines.push("");
  lines.push("A model wrote this gold set. These numbers are an upper bound and never a promise to a reader.");
  return `${lines.join("\n")}\n`;
}
