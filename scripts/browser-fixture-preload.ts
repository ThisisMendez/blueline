import { existsSync, readFileSync } from "node:fs";

import { assertFixtureInvocation, createBrowserFixtureFetch } from "./browser-fixture-fetch";

const mode = assertFixtureInvocation(process.argv, process.env.BLUELINE_BROWSER_FIXTURES);
// Empty values also prevent Next's dotenv loading from restoring real settings.
process.env.NEXT_PUBLIC_SUPABASE_URL = "";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";
process.env.OPENROUTER_API_KEY = "browser-fixture-only";
process.env.OPENROUTER_MODEL = "browser-fixture-only";
process.env.NEXT_TELEMETRY_DISABLED = "1";

const marker = ".next/browser-fixtures-build-id";
if (mode === "start") {
  if (!existsSync(marker) || !existsSync(".next/BUILD_ID")
    || readFileSync(marker, "utf8") !== readFileSync(".next/BUILD_ID", "utf8")) {
    throw new Error("Run npm run build:fixtures before start:fixtures. Supabase settings must be blank at build time too.");
  }
  const delay = Number(process.env.BLUELINE_FIXTURE_DELAY_MS ?? "250");
  if (!Number.isInteger(delay) || delay < 0 || delay > 5000) throw new Error("BLUELINE_FIXTURE_DELAY_MS must be an integer from 0 to 5000.");
  globalThis.fetch = createBrowserFixtureFetch(globalThis.fetch.bind(globalThis), delay);
}
console.log(`[Blueline browser fixtures] DETERMINISTIC SYNTHETIC MODE (${mode}); accounts disabled; fixture documents only. Not a live model evaluation.`);
