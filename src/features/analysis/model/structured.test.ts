import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { ModelError, type ModelClient, type ModelRequest } from "./client";
import {
  completeStructured,
  emptyReplyValidationTally,
  observeReplyValidation,
  recordReplyValidation,
  type ReplyValidationEvent,
} from "./structured";

const schema = z.object({ answer: z.string().min(1) });
const request: ModelRequest = { system: "system", user: "question", schemaName: "test_schema", jsonSchema: { type: "object" } };

/** A client that hands back the queued replies in order; an Error in the queue is thrown. */
function scripted(...replies: unknown[]): ModelClient & { readonly requests: ModelRequest[] } {
  const requests: ModelRequest[] = [];
  return {
    requests,
    async complete(next) {
      requests.push(next);
      const reply = replies.shift();
      if (reply instanceof Error) throw reply;
      return reply;
    },
  };
}

let stop: (() => void) | null = null;
afterEach(() => {
  stop?.();
  stop = null;
});

function watch(): ReplyValidationEvent[] {
  const events: ReplyValidationEvent[] = [];
  stop = observeReplyValidation((event) => events.push(event));
  return events;
}

describe("a structured model call", () => {
  it("uses a valid first reply as it is, with one call", async () => {
    const events = watch();
    const model = scripted({ answer: "yes" });
    await expect(completeStructured(model, request, schema, "The test")).resolves.toEqual({ answer: "yes" });
    expect(model.requests).toHaveLength(1);
    expect(events).toEqual([{ schemaName: "test_schema", stage: "first", valid: true, issues: null }]);
  });

  it("retries once with the validation problems when the first reply is the wrong shape, and uses a valid retry", async () => {
    const events = watch();
    const model = scripted({ answer: "" }, { answer: "yes" });
    await expect(completeStructured(model, request, schema, "The test")).resolves.toEqual({ answer: "yes" });

    expect(model.requests).toHaveLength(2);
    const retry = model.requests[1];
    expect(retry.retryAfterInvalidReply).toBe(true);
    expect(retry.user.startsWith(request.user)).toBe(true);
    expect(retry.user).toContain("answer:");
    expect(retry.system).toBe(request.system);
    expect(retry.schemaName).toBe(request.schemaName);
    expect(model.requests[0].retryAfterInvalidReply).toBeUndefined();
    expect(events.map(({ stage, valid }) => ({ stage, valid }))).toEqual([
      { stage: "first", valid: false },
      { stage: "retry", valid: true },
    ]);
  });

  it("fails as unreadable when the retry is also the wrong shape, after exactly two calls", async () => {
    const events = watch();
    const model = scripted({ wrong: true }, { still: "wrong" });
    const failure = completeStructured(model, request, schema, "The test");
    await expect(failure).rejects.toBeInstanceOf(ModelError);
    await expect(failure).rejects.toMatchObject({ kind: "unreadable" });
    expect(model.requests).toHaveLength(2);
    expect(events.map(({ stage, valid }) => ({ stage, valid }))).toEqual([
      { stage: "first", valid: false },
      { stage: "retry", valid: false },
    ]);
  });

  it("treats a reply that was not JSON at all as malformed, and retries it", async () => {
    const model = scripted(new ModelError("unreadable", "The model's answer was not valid JSON."), { answer: "yes" });
    await expect(completeStructured(model, request, schema, "The test")).resolves.toEqual({ answer: "yes" });
    expect(model.requests[1].user).toContain("not valid JSON");
  });

  it.each(["rate-limited", "timeout", "unavailable", "not-configured"] as const)(
    "does not retry a %s failure, which is not about shape",
    async (kind) => {
      const model = scripted(new ModelError(kind, "provider trouble"), { answer: "yes" });
      await expect(completeStructured(model, request, schema, "The test")).rejects.toMatchObject({ kind });
      expect(model.requests).toHaveLength(1);
    },
  );

  it("stops reporting to an observer once it unsubscribes", async () => {
    const events = watch();
    stop?.();
    stop = null;
    await completeStructured(scripted({ answer: "yes" }), request, schema, "The test");
    expect(events).toEqual([]);
  });
});

describe("the reply validation tally", () => {
  it("counts first-pass failures, recoveries and failures that stayed invalid", () => {
    const tally = emptyReplyValidationTally();
    const events: ReplyValidationEvent[] = [
      { schemaName: "a", stage: "first", valid: true, issues: null },
      { schemaName: "a", stage: "first", valid: false, issues: "x" },
      { schemaName: "a", stage: "retry", valid: true, issues: null },
      { schemaName: "b", stage: "first", valid: false, issues: "y" },
      { schemaName: "b", stage: "retry", valid: false, issues: "y" },
    ];
    for (const event of events) recordReplyValidation(tally, event);
    expect(tally).toEqual({ firstPassFailures: 2, recovered: 1, unrecovered: 1, failuresBySchema: { a: 1, b: 1 } });
  });
});
