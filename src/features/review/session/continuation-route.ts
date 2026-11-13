import { z } from "zod";

import type { AccountsState } from "@/features/auth/session";
import type { ReviewStore } from "@/features/library/store";

import { readReviewContinuation, reviewBrowser } from "./continuation";

const actionSchema = z.strictObject({
  action: z.enum(["draft", "save"]),
  token: z.string().min(1).max(3_500_000),
});

const HEADERS = { "Cache-Control": "no-store" };

function error(reason: string, status: number) {
  return Response.json({ reason }, { status, headers: HEADERS });
}

export function createReviewContinuationRoute(dependencies: {
  accounts: () => Promise<AccountsState>;
  store: () => Promise<ReviewStore | null>;
  now: () => Date;
}) {
  return async function POST(request: Request): Promise<Response> {
    const accounts = await dependencies.accounts();
    if (accounts.kind === "unconfigured") return error("unavailable", 503);
    if (accounts.kind !== "signed-in") return error("sign-in-required", 401);
    const parsed = actionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return error("invalid-request", 400);
    const now = dependencies.now();
    const browser = reviewBrowser(request, parsed.data.token);
    const result = browser ? readReviewContinuation(parsed.data.token, now.getTime(), browser) : null;
    if (!result) return error("expired", 410);
    if (parsed.data.action === "draft") {
      const wording = result.review.riskFlags.map(({ id, counterOffer, residualRisk }) => ({
        id, counterOffer, residualRisk,
      }));
      return Response.json({ wording }, { headers: HEADERS });
    }

    try {
      const store = await dependencies.store();
      if (!store) return error("unavailable", 503);
      const signerId = accounts.signer.id;
      const save = () => store.save({
        id: result.id,
        signerId,
        createdAt: now.toISOString(),
        documents: result.documents,
        review: result.review,
      });
      const existing = await store.findForSigner(signerId, result.id);
      if (!existing) {
        try {
          await save();
        } catch (cause) {
          // A concurrent retry by the same owner may have finished first.
          if (!await store.findForSigner(signerId, result.id)) throw cause;
        }
      }
      return Response.json({ reviewId: result.id }, { headers: HEADERS });
    } catch {
      return error("unavailable", 503);
    }
  };
}
