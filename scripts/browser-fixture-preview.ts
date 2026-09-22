import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const command = process.argv[2];
if (command !== "build" && command !== "start") throw new Error("Expected build or start.");
if (command === "build" && process.argv.length !== 3) throw new Error("Fixture build accepts no options.");

const environment = {
  ...process.env,
  BLUELINE_BROWSER_FIXTURES: "1",
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
  OPENROUTER_API_KEY: "browser-fixture-only",
  OPENROUTER_MODEL: "browser-fixture-only",
  NEXT_TELEMETRY_DISABLED: "1",
};
const args = command === "build"
  ? ["node_modules/next/dist/bin/next", "build"]
  : ["--import", "tsx", "--import", "./scripts/browser-fixture-preload.ts", "node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", ...process.argv.slice(3)];
console.log(`[Blueline browser fixtures] DETERMINISTIC SYNTHETIC MODE (${command}); accounts disabled. Not a live model evaluation.`);
// Build workers inherit only ordinary Node options, never the start-only preload.
const child = spawn(process.execPath, args, { stdio: "inherit", env: environment });
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
child.on("error", () => { console.error("The browser fixture process could not start."); process.exitCode = 1; });
child.on("exit", (code) => {
  if (command === "build" && code === 0) writeFileSync(".next/browser-fixtures-build-id", readFileSync(".next/BUILD_ID"));
  process.exitCode = code ?? 1;
});
