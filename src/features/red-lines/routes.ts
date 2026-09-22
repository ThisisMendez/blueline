import { z } from "zod";
import { ModelError, type ModelClient } from "@/features/analysis/model/client";
import type { AccountsState } from "@/features/auth/session";
import type { ReviewStore } from "@/features/library/store";
import { redLinesSchema, type RedLineOutcome } from "./contract";
import { matchRedLines } from "./match";
import type { RedLineStore } from "./store";

export interface RedLineDependencies {
  readonly model: ModelClient;
  readonly accounts: () => Promise<AccountsState>;
  readonly preferences: () => Promise<RedLineStore | null>;
  readonly reviews: () => Promise<ReviewStore | null>;
}
const saveSchema = z.strictObject({ lines: redLinesSchema });
const rerunSchema = z.strictObject({ reviewId: z.string().min(1).max(100) });
const respond = (outcome: RedLineOutcome, status = 200) => Response.json(outcome, { status });
const fail = (reason: string, status: number) => respond({ status: "failed", reason }, status);

export function createRedLineRoutes(dependencies: RedLineDependencies) {
  async function authorize() {
    const accounts = await dependencies.accounts();
    if (accounts.kind === "unconfigured") return fail("accounts-unavailable", 503);
    if (accounts.kind !== "signed-in") return fail("sign-in-required", 401);
    return accounts.signer;
  }
  return {
    async preferences(request: Request): Promise<Response> {
      try {
        const signer = await authorize();
        if (signer instanceof Response) return signer;
        const store = await dependencies.preferences();
        if (!store) return fail("accounts-unavailable", 503);
        if (request.method === "GET") return respond({ status: "preferences", lines: await store.read(signer.id) });
        if (request.method !== "PUT") return fail("invalid-request", 405);
        const parsed = saveSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return fail("invalid-request", 400);
        await store.save(signer.id, parsed.data.lines);
        return respond({ status: "preferences", lines: parsed.data.lines });
      } catch { return fail("storage-unavailable", 503); }
    },
    async matches(request: Request): Promise<Response> {
      try {
        const signer = await authorize();
        if (signer instanceof Response) return signer;
        const parsed = rerunSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return fail("invalid-request", 400);
        const reviews = await dependencies.reviews();
        const preferences = await dependencies.preferences();
        if (!reviews || !preferences) return fail("accounts-unavailable", 503);
        const review = await reviews.findForSigner(signer.id, parsed.data.reviewId);
        if (!review) return fail("review-not-found", 404);
        const lines = await preferences.read(signer.id);
        const matches = await matchRedLines({ documents: review.documents }, lines, dependencies.model);
        return respond({ status: "matched", matches });
      } catch (error) {
        if (error instanceof ModelError) return fail(error.kind, error.kind === "rate-limited" ? 429 : error.kind === "timeout" ? 504 : 502);
        return fail("storage-unavailable", 503);
      }
    },
  };
}
