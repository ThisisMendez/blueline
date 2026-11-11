import type { z } from "zod";

import { ModelError, type ModelClient, type ModelRequest } from "./client";

/**
 * Every structured model call on the review path goes through here.
 *
 * The provider is asked for strict, schema-constrained JSON (see
 * openrouter.ts), but a reply can still arrive in the wrong shape: a field
 * left empty where the contract wants null, a topic answered twice, JSON cut
 * off. A reply is used only after it validates against the zod schema the
 * caller supplies. If the first reply does not, the same request is sent once
 * more with the validation problems attached, and that reply is validated
 * too. If it still does not match, the call fails as `unreadable`, exactly as
 * it did before this retry existed, and the existing error handling above
 * takes over.
 *
 * This retry is about shape, and only shape. It is separate from the
 * citation retries in the pipeline, which ask again when a well-formed reply
 * quotes a sentence that is not in the document. A call can use both: a
 * citation retry is itself a structured call and gets its own shape retry.
 */

/** One validation result, reported to whoever is observing (evals, smoke). */
export interface ReplyValidationEvent {
  /** The schema name the call asked for, e.g. `blueline_coverage_checklist`. */
  readonly schemaName: string;
  /** `first` is the original reply; `retry` is the one reply after it. */
  readonly stage: "first" | "retry";
  readonly valid: boolean;
  /** What did not match, when the reply was invalid. */
  readonly issues: string | null;
}

export type ReplyValidationListener = (event: ReplyValidationEvent) => void;

const listeners = new Set<ReplyValidationListener>();

/**
 * Subscribes to validation results from every structured call in this
 * process. For instrumentation (evals and smoke runs count first-pass
 * failures and recoveries); nothing in the product subscribes, so a
 * production request pays nothing for it. Returns the unsubscribe function.
 */
export function observeReplyValidation(listener: ReplyValidationListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Counts of shape problems, as an eval prints them. */
export interface ReplyValidationTally {
  /** Replies that failed validation on the first try. */
  firstPassFailures: number;
  /** Of those, how many the one retry recovered. */
  recovered: number;
  /** Of those, how many were still invalid after the retry (the call failed as unreadable). */
  unrecovered: number;
  /** First-pass failures by schema name. */
  failuresBySchema: Record<string, number>;
}

export function emptyReplyValidationTally(): ReplyValidationTally {
  return { firstPassFailures: 0, recovered: 0, unrecovered: 0, failuresBySchema: {} };
}

/** Adds one event to a tally. */
export function recordReplyValidation(tally: ReplyValidationTally, event: ReplyValidationEvent): void {
  if (event.stage === "first" && !event.valid) {
    tally.firstPassFailures += 1;
    tally.failuresBySchema[event.schemaName] = (tally.failuresBySchema[event.schemaName] ?? 0) + 1;
  }
  if (event.stage === "retry") {
    if (event.valid) tally.recovered += 1;
    else tally.unrecovered += 1;
  }
}

function emit(event: ReplyValidationEvent): void {
  for (const listener of listeners) listener(event);
}

const MAX_ISSUE_TEXT = 1_500;

/** Renders zod issues as one line the model (and a log) can read. */
export function describeIssues(error: z.ZodError): string {
  const text = error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
  return text.length > MAX_ISSUE_TEXT ? `${text.slice(0, MAX_ISSUE_TEXT)}…` : text;
}

/** The note appended to the user message when the first reply was the wrong shape. */
export function invalidReplyNote(issues: string): string {
  return `Your previous reply to this request could not be used, because it did not match the required JSON schema: ${issues}

Answer the same request again, from the beginning. Return only JSON that matches the schema exactly: every required field present, null (never an empty string) where the schema allows null and there is no value, and no fields the schema does not list.`;
}

type Attempt<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly issues: string };

async function attempt<T>(
  model: ModelClient,
  request: ModelRequest,
  schema: z.ZodType<T>,
): Promise<Attempt<T>> {
  let raw: unknown;
  try {
    raw = await model.complete(request);
  } catch (error) {
    // A reply that was not JSON, was empty or was cut off is a malformed
    // reply too, and gets the same single retry. Every other failure
    // (timeout, rate limit, provider down) is not about shape and passes
    // straight through.
    if (error instanceof ModelError && error.kind === "unreadable") {
      return { ok: false, issues: error.message };
    }
    throw error;
  }
  const parsed = schema.safeParse(raw);
  return parsed.success ? { ok: true, value: parsed.data } : { ok: false, issues: describeIssues(parsed.error) };
}

/**
 * Sends a structured request and returns the validated reply.
 *
 * @param label names the call in the error message, e.g. "The coverage checklist".
 * @throws ModelError("unreadable") when the reply is still invalid after one retry.
 */
export async function completeStructured<T>(
  model: ModelClient,
  request: ModelRequest,
  schema: z.ZodType<T>,
  label: string,
): Promise<T> {
  const first = await attempt(model, request, schema);
  emit({ schemaName: request.schemaName, stage: "first", valid: first.ok, issues: first.ok ? null : first.issues });
  if (first.ok) return first.value;

  const retry = await attempt(
    model,
    { ...request, user: `${request.user}\n\n${invalidReplyNote(first.issues)}`, retryAfterInvalidReply: true },
    schema,
  );
  emit({ schemaName: request.schemaName, stage: "retry", valid: retry.ok, issues: retry.ok ? null : retry.issues });
  if (retry.ok) return retry.value;

  throw new ModelError(
    "unreadable",
    `${label} did not match the expected shape, after one retry: ${retry.issues}`,
  );
}
