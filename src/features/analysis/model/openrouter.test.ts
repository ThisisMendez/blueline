import { afterEach, expect, it, vi } from "vitest";
import { OpenRouterModelClient } from "./openrouter";

const request = { system: "Review synthetic text", user: "Synthetic lease", schemaName: "test", jsonSchema: { type: "object" } };
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it("sends the configured model and required Fireworks structured-output settings", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "synthetic-test-key");
  vi.stubEnv("OPENROUTER_MODEL", "configured-test-model");
  const fetcher = vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content: '{"ok":true}' }, finish_reason: "stop" }] }));
  vi.stubGlobal("fetch", fetcher);
  expect(await new OpenRouterModelClient().complete(request)).toEqual({ ok: true });
  const [endpoint, options] = fetcher.mock.calls[0];
  expect(endpoint).toBe("https://openrouter.ai/api/v1/chat/completions");
  expect(JSON.parse(options.body)).toMatchObject({
    model: "configured-test-model",
    provider: { order: ["fireworks"], allow_fallbacks: false, require_parameters: true },
    reasoning: { effort: "low" },
    response_format: { type: "json_schema", json_schema: { name: "test", strict: true, schema: request.jsonSchema } },
  });
});

it.each([
  [429, { error: { message: "Limited" } }, "rate-limited"],
  [400, { error: { message: "Provider cannot satisfy parameters" } }, "unavailable"],
  [200, { error: { message: "Provider failed" } }, "unavailable"],
  [200, { choices: [{ message: { content: "broken JSON" } }] }, "unreadable"],
  [200, { choices: [{ message: { content: "{}" }, finish_reason: "length" }] }, "unreadable"],
] as const)("preserves failure for HTTP %s payload %j", async (status, body, kind) => {
  vi.stubEnv("OPENROUTER_API_KEY", "synthetic-test-key");
  vi.stubEnv("OPENROUTER_MODEL", "configured-test-model");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body, { status })));
  await expect(new OpenRouterModelClient().complete(request)).rejects.toMatchObject({ kind });
});

it("does not send a request when the model is missing", async () => {
  vi.stubEnv("OPENROUTER_MODEL", "");
  vi.stubEnv("OPENROUTER_API_KEY", "synthetic-test-key");
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  await expect(new OpenRouterModelClient().complete(request)).rejects.toMatchObject({ kind: "not-configured" });
  expect(fetcher).not.toHaveBeenCalled();
});
