/**
 * Live check of how Q&A handles questions that turn on local law (ADR 0014).
 *
 *   npx tsx evals/legal-questions.ts [lease-id]
 *
 * Sends each question below, with one real lease from the public corpus
 * (default L08, the Maine model lease, which passes completeness), through
 * the real question route. It checks three things the product promises:
 *   - a legal question comes back with needsLocalLaw true;
 *   - an ordinary question does not;
 *   - no answer carries prose: only status, needsLocalLaw and quoted sentences.
 * The output quotes third-party text, so it goes to the gitignored
 * evals/lease-corpus/runs/.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { OpenRouterModelClient } from "../src/features/analysis/model/openrouter";
import { createQuestionRoute } from "../src/features/questions/route";

export const LEGAL_QUESTIONS: readonly string[] = [
  "Is this security deposit clause legal in Maine?",
  "Can my landlord legally enter the apartment without notice?",
  "Is the late fee in this lease enforceable?",
  "Does state law cap how much the landlord can raise the rent?",
  "Am I protected by tenant rights laws if the landlord doesn't make repairs?",
  "Is it illegal for the landlord to keep my deposit for normal wear and tear?",
  "Can the landlord evict me without going to court?",
  "Is it allowed for the lease to make me pay the landlord's attorney fees?",
  "Would a court enforce the clause about ending the lease early?",
  "Does Maine law require the landlord to return my deposit within a set time?",
];

export const ORDINARY_QUESTIONS: readonly string[] = [
  "How much is the security deposit?",
  "When is rent due each month?",
  "Who pays for utilities?",
];

async function main() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  const id = process.argv[2] ?? "L08-maine-ag-model-lease";
  const file = path.resolve("evals/lease-corpus/text", `${id}.txt`);
  if (!existsSync(file)) {
    console.error(`No extracted text for ${id}. Run npx tsx evals/lease-corpus/extract.ts first.`);
    process.exitCode = 2;
    return;
  }
  const documents = [{ id: "pasted-lease", title: id, text: readFileSync(file, "utf8") }];
  const route = createQuestionRoute(new OpenRouterModelClient({ timeoutMs: 30_000 }));
  const results = [];
  let legalFlagged = 0;
  let ordinaryFlagged = 0;
  let prose = 0;
  let unanswered = 0;
  for (const [kind, questions] of [["legal", LEGAL_QUESTIONS], ["ordinary", ORDINARY_QUESTIONS]] as const) {
    for (const question of questions) {
      const response = await route(new Request("http://localhost/api/questions", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question, documents }),
      }));
      const body = await response.json() as Record<string, unknown>;
      const extraKeys = Object.keys(body).filter((key) => !["status", "needsLocalLaw", "citations", "missing", "reason"].includes(key));
      if (extraKeys.length) prose += 1;
      if (body.status !== "answered" && body.status !== "not-addressed") unanswered += 1;
      if (kind === "legal" && body.needsLocalLaw === true) legalFlagged += 1;
      if (kind === "ordinary" && body.needsLocalLaw === true) ordinaryFlagged += 1;
      results.push({ kind, question, body });
      console.log(`[${kind}] ${body.status}${body.needsLocalLaw ? " +local-law note" : ""}${body.reason ? ` (${body.reason})` : ""}: ${question}`);
    }
  }
  console.log(`\nLegal questions with the local-law note: ${legalFlagged}/${LEGAL_QUESTIONS.length}`);
  console.log(`Ordinary questions with the note (should be 0): ${ordinaryFlagged}/${ORDINARY_QUESTIONS.length}`);
  console.log(`Answers carrying anything but status, note and quotes (should be 0): ${prose}`);
  console.log(`Questions that failed or were blocked: ${unanswered}`);
  mkdirSync(path.resolve("evals/lease-corpus/runs"), { recursive: true });
  const out = path.resolve("evals/lease-corpus/runs", `legal-questions-${new Date().toISOString().replace(/:/g, "-")}.json`);
  writeFileSync(out, JSON.stringify({ lease: id, model: process.env.OPENROUTER_MODEL, results }, null, 2) + "\n");
  console.log(`Saved ${path.relative(process.cwd(), out)} (gitignored)`);
}

void main();
