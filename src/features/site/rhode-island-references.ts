import sourceRegister from "../../../docs/legal/rhode-island-sources.json";

import { checkSource, sourceReviewProblem } from "./rhode-island-source-check.mjs";

interface RhodeIslandSource {
  readonly id: string;
  readonly url: string;
  readonly title?: string;
  readonly section?: string;
  readonly reviewedOn?: string;
  readonly reviewBy?: string;
  readonly reviewer?: string;
  readonly sha256?: string;
  readonly amendmentEffectiveOn?: string;
}

export interface RhodeIslandRegister {
  readonly publicLawsYear: number;
  readonly sources: readonly RhodeIslandSource[];
}

interface RhodeIslandReference {
  readonly title: string;
  readonly section: string;
  readonly url: string;
  readonly reviewedOn: string;
}

export function rhodeIslandPilotEnabled(): boolean {
  return process.env.RHODE_ISLAND_RESOURCES_ENABLED === "true";
}

export async function availableRhodeIslandReferences(
  register: RhodeIslandRegister = sourceRegister,
  now: Date = new Date(),
  fetchSource: typeof fetch = fetch,
): Promise<RhodeIslandReference[]> {
  const year = now.getUTCFullYear();
  if (register.publicLawsYear !== year) return [];

  const nowMs = now.getTime();
  const sharedIds = ["chapter-34-18", "chapter-application", "chapter-exclusions", `public-laws-${year}`];
  const sharedSources = sharedIds.map((id) => register.sources.find((source) => source.id === id));
  if (sharedSources.some((source) => !source || sourceReviewProblem(source, nowMs))) return [];

  const candidates = register.sources.filter((source) =>
    source.title && source.section && source.reviewedOn && !sourceReviewProblem(source, nowMs),
  );
  if (!candidates.length) return [];

  const [sharedChecks, sectionChecks] = await Promise.all([
    Promise.all(sharedSources.map((source) => source && checkSource(source, nowMs, fetchSource, 3_000))),
    Promise.all(candidates.map(async (source) => {
      const { title, section, url, reviewedOn } = source;
      const issues = await checkSource(source, nowMs, fetchSource, 3_000);
      return !issues.length && title && section && reviewedOn ? { title, section, url, reviewedOn } : null;
    })),
  ]);
  return sharedChecks.every((issues) => issues?.length === 0)
    ? sectionChecks.filter((source) => source !== null)
    : [];
}
