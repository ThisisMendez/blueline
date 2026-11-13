import { z } from "zod";

import type { AccountsState } from "@/features/auth/session";
import { normaliseTypedTitle } from "@/features/review/title";

import type { ReviewStore } from "./store";

export type RenameFailure =
  | "sign-in-required"
  | "accounts-unavailable"
  | "not-found"
  | "invalid-title"
  | "invalid-request"
  | "storage-unavailable";

export type RenameOutcome =
  | { readonly status: "renamed"; readonly title: string }
  | { readonly status: "failed"; readonly reason: RenameFailure };

const FAILURE_STATUS: Record<RenameFailure, number> = {
  "sign-in-required": 401,
  "accounts-unavailable": 503,
  "not-found": 404,
  "invalid-title": 400,
  "invalid-request": 400,
  "storage-unavailable": 503,
};

/**
 * Renames one of the signed-in signer's own reviews. The signer comes from
 * the session, never the body, and another signer's review answers exactly
 * as a missing one does.
 */
export function createRenameRoute(dependencies: {
  readonly accounts: () => Promise<AccountsState>;
  readonly store: () => Promise<ReviewStore | null>;
}) {
  return async function POST(request: Request): Promise<Response> {
    const fail = (reason: RenameFailure) => {
      const outcome: RenameOutcome = { status: "failed", reason };
      return Response.json(outcome, { status: FAILURE_STATUS[reason] });
    };
    try {
      const accounts = await dependencies.accounts();
      if (accounts.kind === "unconfigured") return fail("accounts-unavailable");
      if (accounts.kind !== "signed-in") return fail("sign-in-required");
      const parsed = z
        .strictObject({ reviewId: z.string().min(1).max(100), title: z.string().max(400) })
        .safeParse(await request.json().catch(() => null));
      if (!parsed.success) return fail("invalid-request");
      const title = normaliseTypedTitle(parsed.data.title);
      if (!title) return fail("invalid-title");
      const store = await dependencies.store();
      if (!store) return fail("accounts-unavailable");
      const renamed = await store.renameForSigner(accounts.signer.id, parsed.data.reviewId, title);
      if (renamed === null) return fail("not-found");
      const outcome: RenameOutcome = { status: "renamed", title: renamed };
      return Response.json(outcome);
    } catch {
      return fail("storage-unavailable");
    }
  };
}
