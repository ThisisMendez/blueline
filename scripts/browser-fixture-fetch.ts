import { z } from "zod";

import { normalizeText } from "../src/features/packet/normalize";
import { loadFixture, type FixtureId } from "../tests/fixtures";
import { createFixtureModelClient } from "../tests/support/fixture-model-client";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const FIXTURE_IDS: readonly FixtureId[] = ["adhesion-lease", "clean-lease", "referencing-lease", "fee-schedule", "pet-addendum"];
const requestSchema = z.object({
  messages: z.tuple([
    z.object({ role: z.literal("system"), content: z.string() }),
    z.object({ role: z.literal("user"), content: z.string() }),
  ]),
  response_format: z.object({
    type: z.literal("json_schema"),
    json_schema: z.object({ name: z.string(), schema: z.record(z.string(), z.unknown()) }),
  }),
});

/** Test transport only; the production app never imports this module. */
export function createBrowserFixtureFetch(networkFetch: typeof fetch, delayMs = 0): typeof fetch {
  const knownTexts = new Set(FIXTURE_IDS.map((id) => normalizeText(loadFixture(id).text)));
  const model = createFixtureModelClient();
  return async function fixtureFetch(input, init): Promise<Response> {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url !== ENDPOINT) return networkFetch(input, init);
    const request = new Request(input, init);
    if (request.method !== "POST") return Response.json({ error: { message: "Fixture transport requires POST." } }, { status: 400 });
    let body;
    try { body = requestSchema.parse(await request.json()); }
    catch { return Response.json({ error: { message: "Fixture transport received an unsupported request." } }, { status: 400 }); }
    const user = body.messages[1].content;
    const documents = [...user.matchAll(/=== DOCUMENT id=(\S+) title="([^"]*)" ===\n([\s\S]*?)\n=== END DOCUMENT id=\1 ===/g)];
    // Equality is intentional: a known fixture plus arbitrary added text is not a fixture.
    const openings = user.match(/=== DOCUMENT id=/g)?.length ?? 0;
    const closings = user.match(/=== END DOCUMENT id=/g)?.length ?? 0;
    if (!documents.length || documents.length !== openings || documents.length !== closings
      || documents.some((document) => !knownTexts.has(normalizeText(document[3])))) {
      return Response.json({ error: { message: "Browser fixture mode accepts only the synthetic documents in tests/fixtures." } }, { status: 422 });
    }
    if (delayMs > 0) await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    const result = await model.complete({
      system: body.messages[0].content, user,
      schemaName: body.response_format.json_schema.name,
      jsonSchema: body.response_format.json_schema.schema,
    });
    return Response.json({ choices: [{ message: { content: JSON.stringify(result) }, finish_reason: "stop" }] });
  };
}

/** Restrict the preload to explicit fixture builds and loopback-only servers. */
export function assertFixtureInvocation(argv: readonly string[], enabled: string | undefined): "build" | "start" {
  if (enabled !== "1" || !argv[1]?.replaceAll("\\", "/").endsWith("/next/dist/bin/next")) {
    throw new Error("Use npm run build:fixtures or npm run start:fixtures for the browser fixture harness.");
  }
  const [command, ...options] = argv.slice(2);
  if (command === "build" && options.length === 0) return "build";
  if (command !== "start" || options[0] !== "--hostname" || options[1] !== "127.0.0.1") {
    throw new Error("The browser fixture server must bind only to 127.0.0.1.");
  }
  const extra = options.slice(2);
  if (extra.length && (extra.length !== 2 || !["--port", "-p"].includes(extra[0])
    || !/^\d+$/.test(extra[1]) || Number(extra[1]) < 1 || Number(extra[1]) > 65535)) {
    throw new Error("Fixture start accepts only an optional --port or -p value.");
  }
  return "start";
}
