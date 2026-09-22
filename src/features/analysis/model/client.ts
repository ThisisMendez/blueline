/**
 * The port every model call goes through. This module holds no network code
 * and no provider names: it is the seam the analysis pipeline is written
 * against, so tests can hand the pipeline a client built from the fixture
 * corpus and exercise everything else for real.
 */

export interface ModelRequest {
  readonly system: string;
  readonly user: string;
  /** Names the structured-output schema for the provider. */
  readonly schemaName: string;
  /** JSON Schema the response must satisfy. */
  readonly jsonSchema: Record<string, unknown>;
}

export interface ModelClient {
  /** Resolves with the model's structured output, already JSON-parsed. */
  complete(request: ModelRequest): Promise<unknown>;
}

/** Why a model call could not produce usable output. */
export type ModelErrorKind =
  | "not-configured"
  | "timeout"
  | "rate-limited"
  | "unavailable"
  | "verification-failed"
  | "unreadable";

/** Thrown by a {@link ModelClient} when a call cannot produce usable output. */
export class ModelError extends Error {
  readonly kind: ModelErrorKind;

  constructor(kind: ModelErrorKind, message: string) {
    super(message);
    this.name = "ModelError";
    this.kind = kind;
  }
}
