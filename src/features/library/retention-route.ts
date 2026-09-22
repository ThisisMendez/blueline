import { z } from "zod";
import type { AccountsState } from "@/features/auth/session";
import type { ReviewRetention, ReviewStore } from "./store";

export type SaveOutcome =
  | { readonly status: "saved"; readonly retention: ReviewRetention }
  | { readonly status: "failed"; readonly reason: "sign-in-required" | "accounts-unavailable" | "not-found" | "invalid-request" | "storage-unavailable" };

export function createRetentionRoute(dependencies: {
  readonly accounts: () => Promise<AccountsState>;
  readonly store: () => Promise<ReviewStore | null>;
}) {
  return async function POST(request: Request): Promise<Response> {
    const fail = (reason: Extract<SaveOutcome, { status: "failed" }>["reason"], status: number) => Response.json({ status: "failed", reason }, { status });
    try {
      const accounts = await dependencies.accounts();
      if (accounts.kind === "unconfigured") return fail("accounts-unavailable", 503);
      if (accounts.kind !== "signed-in") return fail("sign-in-required", 401);
      const parsed = z.strictObject({ reviewId: z.string().min(1).max(100) }).safeParse(await request.json().catch(() => null));
      if (!parsed.success) return fail("invalid-request", 400);
      const store = await dependencies.store();
      if (!store) return fail("accounts-unavailable", 503);
      const retention = await store.retainForSigner(accounts.signer.id, parsed.data.reviewId);
      if (!retention) return fail("not-found", 404);
      const outcome: SaveOutcome = { status: "saved", retention };
      return Response.json(outcome);
    } catch { return fail("storage-unavailable", 503); }
  };
}
