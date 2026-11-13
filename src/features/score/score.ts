import type {
  AnalysisOutcome,
  GeneralReview,
  ReviewRole,
  Severity,
} from "@/features/analysis/types";
import type { StoredReview } from "@/features/library/store";

/**
 * The Lease Risk Score (ADR 0016, docs/scoring.md).
 *
 * A deterministic summary of the verified risk flags in one review, for the
 * side the signer picked. It reads nothing but the flags' severities and the
 * review's own record of what it could not verify, so the same review always
 * gets the same score.
 *
 * What it is not: approval to sign, a finding about legality, a probability
 * of harm, or a promise that every risk was found. It only restates, on one
 * scale, what the ranked flag list already says.
 *
 * The rule, version lrs-1:
 *
 *   1. Start at 100. Deduct 16 per distinct High flag, 7 per Medium, 3 per Low.
 *   2. The most serious flag sets the grade band, and the score is clamped
 *      into that band:
 *        two or more High   1 to 59  (F)
 *        exactly one High   60 to 69 (D)
 *        Medium, no High    70 to 79 (C)
 *        Low only           80 to 100 (A or B)
 *        no flags           100      (A)
 *   3. The same rule for both roles.
 *
 * The band caps stop one High flag from landing in C, which the brief's
 * starting rule allowed (a single High scored 79 there). The band floors stop
 * many Low or Medium flags from reaching a grade whose label names
 * high-risk or severe concerns that no flag in the review carries.
 */

export const SCORE_VERSION = "lrs-1";

export type ScoreGrade = "A" | "B" | "C" | "D" | "F";

export interface ScoreCounts {
  readonly high: number;
  readonly medium: number;
  readonly low: number;
  readonly total: number;
}

export type ScoreUnavailableReason =
  /** The packet is missing a document the lease requires (ADR 0005). */
  | "incomplete-packet"
  /** Not a residential lease, or the check couldn't tell (ADR 0014). */
  | "out-of-scope"
  /** Completeness couldn't be verified, so no review ran. */
  | "completeness-unverified"
  /** The model call failed; there is no review. */
  | "review-failed"
  /** The request never reached the model. */
  | "request-rejected"
  /** At least one proposed flag was dropped because its quote didn't match. */
  | "unverified-flags"
  /** Saved before role-aware reviews, so it may have been graded under older rules. */
  | "legacy-review"
  /** Stored data is missing or malformed in a way the rule can't read. */
  | "unscoreable-data";

export type LeaseRiskScore =
  | {
      readonly available: true;
      readonly version: string;
      readonly score: number;
      readonly grade: ScoreGrade;
      readonly label: string;
      readonly counts: ScoreCounts;
    }
  | {
      readonly available: false;
      readonly version: string;
      readonly reason: ScoreUnavailableReason;
      readonly explanation: string;
      readonly counts?: ScoreCounts;
    };

/** The only facts about a flag the score reads. */
export interface ScorableFlag {
  /** Derived from the primary citation, so one finding has one id. */
  readonly id: string;
  readonly severity: Severity;
}

/**
 * What both an in-tab outcome and a reopened saved review can supply.
 *
 * Preference matches and not-found checklist topics have no field here on
 * purpose: they never change the score (ADR 0007).
 */
export type ScoreInput =
  | {
      readonly kind: "reviewed";
      /** Absent on reviews saved before role selection existed. */
      readonly role: ReviewRole | undefined;
      /** Verified flags only. Each one is one finding, however many passages it cites. */
      readonly flags: readonly ScorableFlag[];
      /** Flags the model proposed that never verified. Undefined when unknown. */
      readonly droppedFlagCount: number | undefined;
    }
  | {
      readonly kind: "not-reviewed";
      readonly reason: Exclude<
        ScoreUnavailableReason,
        "unverified-flags" | "legacy-review" | "unscoreable-data"
      >;
    };

/** Points deducted per distinct verified flag. */
export const SEVERITY_DEDUCTIONS: Readonly<Record<Severity, number>> = {
  high: 16,
  medium: 7,
  low: 3,
};

export interface GradeBand {
  readonly grade: ScoreGrade;
  readonly min: number;
  readonly max: number;
  readonly label: string;
}

/** The grade bands, best first. Shown as a table beside the score. */
export const GRADE_BANDS: readonly GradeBand[] = [
  { grade: "A", min: 90, max: 100, label: "Few or no concerns found" },
  { grade: "B", min: 80, max: 89, label: "Minor concerns" },
  { grade: "C", min: 70, max: 79, label: "Notable concerns" },
  { grade: "D", min: 60, max: 69, label: "High-risk concerns" },
  { grade: "F", min: 1, max: 59, label: "Severe concerns found" },
];

/** The heading shown in place of a number when no score is given. */
export const SCORE_UNAVAILABLE_LABEL = "Score unavailable";

/** The "How we score" note shown next to the score. Humanized copy. */
export const HOW_WE_SCORE: { readonly title: string; readonly points: readonly string[] } = {
  title: "How we score",
  points: [
    "A higher score means we found fewer or less serious concerns for your side.",
    "A flag counts once if its exact quote matches your documents. Only flags affect the score.",
    "One High flag gives a D. Two or more give an F.",
    "If we have to leave out a flag because its quote doesn't match, we leave the score blank.",
  ],
};

/** Signer-facing explanations for each unavailable reason. Humanized copy. */
export const UNAVAILABLE_EXPLANATIONS: Readonly<Record<ScoreUnavailableReason, string>> = {
  "incomplete-packet":
    "We can't score this lease until you add the documents it refers to.",
  "out-of-scope":
    "We only score residential leases, and we couldn't confirm this is one.",
  "completeness-unverified":
    "We couldn't confirm that every document the lease refers to is here, so there's no score.",
  "review-failed": "The review didn't finish, so there's nothing to score.",
  "request-rejected": "The review didn't run, so there's nothing to score.",
  "unverified-flags":
    "We left out at least one possible flag because its quote didn't match your lease. A score without it could look better than it should, so we aren't showing one.",
  "legacy-review":
    "This review was saved before we started scoring. Run it again to get a score.",
  "unscoreable-data":
    "We couldn't read this saved review well enough to score it. Run it again to get a score.",
};

const SEVERITY_ORDER: readonly Severity[] = ["high", "medium", "low"];

function isSeverity(value: unknown): value is Severity {
  return typeof value === "string" && (SEVERITY_ORDER as readonly string[]).includes(value);
}

function unavailable(reason: ScoreUnavailableReason, counts?: ScoreCounts): LeaseRiskScore {
  return {
    available: false,
    version: SCORE_VERSION,
    reason,
    explanation: UNAVAILABLE_EXPLANATIONS[reason],
    ...(counts ? { counts } : {}),
  };
}

/**
 * Counts each finding once. A flag already carries its related passages, so
 * one flag is one finding. Two entries with the same id are the same finding
 * and keep the more serious severity. Null when a severity is unreadable.
 */
export function countDistinctFlags(flags: readonly ScorableFlag[]): ScoreCounts | null {
  const byId = new Map<string, Severity>();
  for (const flag of flags) {
    const severity: unknown = flag?.severity;
    if (!isSeverity(severity) || typeof flag.id !== "string") return null;
    const held = byId.get(flag.id);
    if (!held || SEVERITY_ORDER.indexOf(severity) < SEVERITY_ORDER.indexOf(held)) {
      byId.set(flag.id, severity);
    }
  }
  const counts = { high: 0, medium: 0, low: 0 };
  for (const severity of byId.values()) counts[severity] += 1;
  return { ...counts, total: counts.high + counts.medium + counts.low };
}

/** The band the most serious flags put a review in: [min, max]. */
function bandLimits(counts: ScoreCounts): readonly [number, number] {
  if (counts.high >= 2) return [1, 59];
  if (counts.high === 1) return [60, 69];
  if (counts.medium > 0) return [70, 79];
  if (counts.low > 0) return [80, 100];
  return [100, 100];
}

/** The number on its own, from counts. Exported for the validation table and tests. */
export function scoreFromCounts(counts: ScoreCounts): number {
  const raw =
    100 -
    SEVERITY_DEDUCTIONS.high * counts.high -
    SEVERITY_DEDUCTIONS.medium * counts.medium -
    SEVERITY_DEDUCTIONS.low * counts.low;
  const [min, max] = bandLimits(counts);
  return Math.min(max, Math.max(min, raw));
}

/** The band a score falls in. */
export function gradeFor(score: number): GradeBand {
  const band = GRADE_BANDS.find((candidate) => score >= candidate.min && score <= candidate.max);
  if (!band) throw new RangeError(`Score ${score} is outside 1 to 100.`);
  return band;
}

export function scoreReview(input: ScoreInput): LeaseRiskScore {
  if (input.kind === "not-reviewed") return unavailable(input.reason);

  // Reviews saved before role selection may have been graded by an older
  // severity rubric and drop count, so the same rule can't be shown to hold.
  if (input.role !== "renter" && input.role !== "landlord") {
    return unavailable("legacy-review");
  }

  const counts = countDistinctFlags(input.flags);
  const dropped = input.droppedFlagCount;
  if (!counts || typeof dropped !== "number" || !Number.isInteger(dropped) || dropped < 0) {
    return unavailable("unscoreable-data");
  }

  // A dropped flag's severity is never stored, so nothing can show it would
  // have left the score unchanged. Withhold rather than understate.
  if (dropped > 0) return unavailable("unverified-flags", counts);

  const score = scoreFromCounts(counts);
  const band = gradeFor(score);
  return { available: true, version: SCORE_VERSION, score, grade: band.grade, label: band.label, counts };
}

function scoreGeneralReview(review: GeneralReview | null | undefined): LeaseRiskScore {
  if (!review || !Array.isArray(review.riskFlags)) return unavailable("unscoreable-data");
  return scoreReview({
    kind: "reviewed",
    role: review.role,
    flags: review.riskFlags,
    droppedFlagCount: review.droppedFlagCount,
  });
}

/** Scores a review held in the tab, straight from the analysis route's answer. */
export function scoreFromOutcome(outcome: AnalysisOutcome): LeaseRiskScore {
  switch (outcome.status) {
    case "reviewed":
      return scoreGeneralReview(outcome.review);
    case "blocked":
      return scoreReview({ kind: "not-reviewed", reason: "incomplete-packet" });
    case "out-of-scope":
      return scoreReview({ kind: "not-reviewed", reason: "out-of-scope" });
    case "unverified":
      return scoreReview({ kind: "not-reviewed", reason: "completeness-unverified" });
    case "failed":
      return scoreReview({ kind: "not-reviewed", reason: "review-failed" });
    case "rejected":
      return scoreReview({ kind: "not-reviewed", reason: "request-rejected" });
  }
}

/**
 * Scores a reopened saved review. Only complete, in-scope packets are ever
 * saved, so the stored review itself decides: role present, severities
 * readable, drop count known and zero.
 */
export function scoreFromStoredReview(stored: Pick<StoredReview, "review">): LeaseRiskScore {
  return scoreGeneralReview(stored?.review);
}
