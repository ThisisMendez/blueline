/**
 * Judge accuracy and repeatability on a failure-enriched batch (decision 5).
 * Pure, so it is tested with synthetic verdicts.
 *
 * Definitions, fixed before any judge run:
 * - A HUMAN FAIL is a flag the human reviewer's locked overall verdict FAILs.
 * - A PASS CONTROL is a flag picked as a control (it matches a planted
 *   material clause) that the human also PASSes. A control the human FAILs
 *   counts among the human FAILs and is listed, never quietly dropped.
 * - On each repeat, the judge CATCHES a human FAIL when it returns FAIL, and
 *   INCORRECTLY FAILS a PASS control when it returns FAIL. A repeat with no
 *   readable verdict for a flag (provider error, rate limit, bad reply)
 *   catches nothing and fails nothing; missing verdicts are counted.
 * - By majority, the judge's verdict on a flag is whatever it returned on
 *   more than half of the repeats; otherwise it has no majority.
 * - A flag is REPEATABLE when every repeat returned a readable verdict and
 *   they were all the same. The denominator is every flag rerun.
 *
 * Accuracy and repeatability are reported separately, and every figure is
 * labelled "failure-enriched batch": the batch was picked to hold flags
 * likely to fail, so these rates say nothing about flags in general.
 */
import type { Overall } from "./verdicts";

export interface Rate {
  readonly count: number;
  readonly total: number;
}

export function formatRate({ count, total }: Rate): string {
  return `${count}/${total} (${total === 0 ? "n/a" : `${((count / total) * 100).toFixed(1)}%`})`;
}

export interface JudgeMetrics {
  readonly label: "failure-enriched batch";
  readonly repeats: number;
  readonly humanFails: number[];
  readonly passControls: number[];
  readonly controlsHumanFailed: number[];
  readonly failsCaught: { readonly perRepeat: Rate[]; readonly byMajority: Rate };
  readonly controlsIncorrectlyFailed: { readonly perRepeat: Rate[]; readonly byMajority: Rate };
  readonly repeatability: Rate;
  readonly missingVerdicts: number;
}

export function majority(verdicts: readonly (Overall | null)[]): Overall | null {
  const fails = verdicts.filter((verdict) => verdict === "FAIL").length;
  const passes = verdicts.filter((verdict) => verdict === "PASS").length;
  if (fails * 2 > verdicts.length) return "FAIL";
  if (passes * 2 > verdicts.length) return "PASS";
  return null;
}

export function judgeMetrics(input: {
  readonly human: Readonly<Record<number, Overall>>;
  readonly roles: Readonly<Record<number, "control" | "likely-fail">>;
  /** One map per repeat: flag number to the judge's overall verdict, or null when none was readable. */
  readonly repeats: readonly Readonly<Record<number, Overall | null>>[];
}): JudgeMetrics {
  const numbers = Object.keys(input.human).map(Number).sort((a, b) => a - b);
  const humanFails = numbers.filter((number) => input.human[number] === "FAIL");
  const passControls = numbers.filter((number) => input.roles[number] === "control" && input.human[number] === "PASS");
  const controlsHumanFailed = numbers.filter((number) => input.roles[number] === "control" && input.human[number] === "FAIL");
  const verdictsFor = (number: number) => input.repeats.map((repeat) => repeat[number] ?? null);
  const perRepeat = (flags: number[]) => input.repeats.map((repeat) => ({ count: flags.filter((number) => repeat[number] === "FAIL").length, total: flags.length }));
  const byMajority = (flags: number[]) => ({ count: flags.filter((number) => majority(verdictsFor(number)) === "FAIL").length, total: flags.length });
  const repeatable = numbers.filter((number) => {
    const verdicts = verdictsFor(number);
    return verdicts.length > 0 && verdicts.every((verdict) => verdict !== null && verdict === verdicts[0]);
  });
  return {
    label: "failure-enriched batch",
    repeats: input.repeats.length,
    humanFails,
    passControls,
    controlsHumanFailed,
    failsCaught: { perRepeat: perRepeat(humanFails), byMajority: byMajority(humanFails) },
    controlsIncorrectlyFailed: { perRepeat: perRepeat(passControls), byMajority: byMajority(passControls) },
    repeatability: { count: repeatable.length, total: numbers.length },
    missingVerdicts: numbers.reduce((sum, number) => sum + verdictsFor(number).filter((verdict) => verdict === null).length, 0),
  };
}

export function renderJudgeMetrics(metrics: JudgeMetrics, header: readonly string[]): string {
  const lines = [...header, "", `All figures: ${metrics.label}. Picked to hold flags likely to fail, so they don't describe flags in general.`, ""];
  lines.push("Accuracy");
  lines.push(`  Human FAILs caught by the judge, by majority of ${metrics.repeats} repeats: ${formatRate(metrics.failsCaught.byMajority)}`);
  metrics.failsCaught.perRepeat.forEach((rate, index) => lines.push(`    repeat ${index + 1}: ${formatRate(rate)}`));
  lines.push(`  PASS controls the judge failed, by majority: ${formatRate(metrics.controlsIncorrectlyFailed.byMajority)}`);
  metrics.controlsIncorrectlyFailed.perRepeat.forEach((rate, index) => lines.push(`    repeat ${index + 1}: ${formatRate(rate)}`));
  if (metrics.controlsHumanFailed.length) lines.push(`  Controls the human failed (counted as human FAILs, not controls): ${metrics.controlsHumanFailed.join(", ")}`);
  lines.push("");
  lines.push("Repeatability");
  lines.push(`  Flags with the same verdict on every repeat / flags rerun: ${formatRate(metrics.repeatability)}`);
  lines.push(`  Missing judge verdicts (provider error, rate limit or unreadable reply): ${metrics.missingVerdicts}`);
  return `${lines.join("\n")}\n`;
}
