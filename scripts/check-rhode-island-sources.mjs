import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const REVIEW_INTERVAL = 30 * 24 * 60 * 60 * 1000;
const DAY_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

export async function checkSource(source, now, fetchSource = fetch) {
  const issues = [];
  const reviewedAt = Date.parse(source.reviewedOn);
  const deadline = Date.parse(source.reviewBy);
  if (!/^[a-f0-9]{64}$/.test(source.sha256 ?? "") || !source.reviewer?.trim() ||
      !DAY_FORMAT.test(source.reviewedOn ?? "") || !DAY_FORMAT.test(source.reviewBy ?? "") ||
      !Number.isFinite(reviewedAt) || !Number.isFinite(deadline) || reviewedAt > now ||
      deadline <= reviewedAt || deadline > reviewedAt + REVIEW_INTERVAL) {
    issues.push("Missing or invalid reviewed baseline");
  } else if (now >= deadline) {
    issues.push("Review deadline passed");
  }

  try {
    const response = await fetchSource(source.url, {
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      issues.push(`Source returned HTTP ${response.status}`);
    } else {
      const bytes = Buffer.from(await response.arrayBuffer());
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      if (!bytes.length) issues.push("Source returned no content");
      else if (source.sha256 && sha256 !== source.sha256) issues.push("Source changed");
      else if (!source.sha256) issues.push(`Candidate fingerprint ${sha256}`);
    }
  } catch {
    issues.push("Source could not be fetched");
  }
  return issues;
}

async function main() {
  const register = JSON.parse(await readFile(new URL("../docs/legal/rhode-island-sources.json", import.meta.url), "utf8"));
  const now = new Date();
  let needsReview = register.publicLawsYear !== now.getUTCFullYear();
  if (needsReview) console.log("Add the current year's public-laws index.");
  for (const { source, issues } of await Promise.all(register.sources.map(async (source) => ({
    source, issues: await checkSource(source, now.getTime()),
  })))) {
    console.log(`${source.id} — ${issues.join(". ") || "Matches reviewed source"}`);
    if (issues.length) needsReview = true;
  }
  process.exitCode = needsReview ? 1 : 0;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main();
