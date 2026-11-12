import { ModelError, type ModelClient, type ModelRequest } from "./client";

/**
 * The only place in the product that talks to a network. Server-side only:
 * nothing under a `"use client"` boundary may import this module, because
 * `OPENROUTER_API_KEY` is read here.
 *
 * The model id is whatever `OPENROUTER_MODEL` holds. There is no default and
 * no fallback: a missing variable is a configuration error the operator has
 * to see, not something to paper over with a guess.
 *
 * Structured output: every request carries `response_format` of type
 * `json_schema` with `strict: true`, and is pinned to Fireworks with
 * `require_parameters: true` and no fallbacks, so it is only served by an
 * endpoint that supports schema-constrained output (OpenRouter lists
 * Fireworks as supporting `response_format` and `structured_outputs` for the
 * configured model; checked 2026-11-11). Strict decoding constrains the JSON
 * shape, not every rule zod checks afterwards (one answer per checklist
 * topic, citation fields that agree with a status), so replies are still
 * validated and retried once in structured.ts.
 *
 * Repeatability: `temperature: 0` is the only sampling control sent. `seed`
 * would be the next lever, but Fireworks does not list it for this model, and
 * with `require_parameters: true` an unsupported parameter makes the request
 * unroutable rather than ignored.
 */

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_TIMEOUT_MS = 90_000;

export interface OpenRouterModelClientOptions {
  readonly timeoutMs?: number;
  /** Sent for OpenRouter's attribution headers. */
  readonly siteUrl?: string;
  readonly appTitle?: string;
}

interface OpenRouterChoice {
  readonly message?: { readonly content?: string | null };
  readonly error?: { readonly code?: number; readonly message?: string };
  readonly finish_reason?: string | null;
}

interface OpenRouterBody {
  readonly choices?: readonly OpenRouterChoice[];
  readonly error?: { readonly code?: number; readonly message?: string };
}

function requireEnv(name: "OPENROUTER_API_KEY" | "OPENROUTER_MODEL"): string {
  // Literal property access, so the value is never inlined into a client bundle.
  const value = name === "OPENROUTER_API_KEY"
    ? process.env.OPENROUTER_API_KEY
    : process.env.OPENROUTER_MODEL;

  if (!value) {
    throw new ModelError("not-configured", `${name} is not set.`);
  }
  return value;
}

export class OpenRouterModelClient implements ModelClient {
  private readonly timeoutMs: number;
  private readonly siteUrl: string | undefined;
  private readonly appTitle: string;

  constructor(options: OpenRouterModelClientOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.siteUrl = options.siteUrl;
    this.appTitle = options.appTitle ?? "Blueline Redline";
  }

  async complete(request: ModelRequest): Promise<unknown> {
    // Read at call time, never at module scope, so an unconfigured deployment
    // still boots and still reports the problem in one place.
    const apiKey = requireEnv("OPENROUTER_API_KEY");
    const model = requireEnv("OPENROUTER_MODEL");
    const free = model.endsWith(":free");
    const provider = process.env.OPENROUTER_PROVIDER?.trim() || (free ? "" : "fireworks");
    if (!provider) {
      throw new ModelError("not-configured", "OPENROUTER_PROVIDER is required for a free model.");
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-OpenRouter-Title": this.appTitle,
    };
    if (this.siteUrl) headers["HTTP-Referer"] = this.siteUrl;

    let response: Response;
    try {
      response = await fetch(ENDPOINT, {
        method: "POST",
        headers,
        signal: AbortSignal.timeout(this.timeoutMs),
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: request.system },
            { role: "user", content: request.user },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: request.schemaName,
              strict: true,
              schema: request.jsonSchema,
            },
          },
          provider: {
            only: [provider],
            allow_fallbacks: false,
            require_parameters: true,
            ...(free ? { max_price: { prompt: 0, completion: 0, request: 0 } } : {}),
          },
          reasoning: { effort: "low" },
          temperature: 0,
        }),
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError")
      ) {
        throw new ModelError("timeout", "The analysis request timed out.");
      }
      throw new ModelError(
        "unavailable",
        error instanceof Error ? error.message : "The analysis request failed.",
      );
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as OpenRouterBody | null;
      const message = body?.error?.message ?? response.statusText;
      if (response.status === 429) {
        throw new ModelError("rate-limited", message);
      }
      throw new ModelError("unavailable", `${response.status}: ${message}`);
    }

    const body = (await response.json().catch(() => null)) as OpenRouterBody | null;
    if (body?.error) {
      throw new ModelError("unavailable", body.error.message ?? "The provider returned an error.");
    }
    const choice = body?.choices?.[0];

    // An error can arrive inside a 200, attached to the choice.
    if (choice?.error) {
      throw new ModelError(
        "unavailable",
        choice.error.message ?? "The model returned an error.",
      );
    }

    const content = choice?.message?.content;
    if (typeof content !== "string" || content.length === 0) {
      throw new ModelError("unreadable", "The model returned no content.");
    }
    if (choice?.finish_reason === "length") {
      throw new ModelError("unreadable", "The model's answer was cut off before it ended.");
    }

    try {
      return JSON.parse(content) as unknown;
    } catch {
      throw new ModelError("unreadable", "The model's answer was not valid JSON.");
    }
  }
}
