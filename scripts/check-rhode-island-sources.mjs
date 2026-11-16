import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import { checkSource } from "../src/features/site/rhode-island-source-check.mjs";

export { checkSource };

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
