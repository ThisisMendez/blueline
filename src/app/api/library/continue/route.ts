import { getAccountsState } from "@/features/auth/session";
import { openReviewStore } from "@/features/library/supabase-store";
import { createReviewContinuationRoute } from "@/features/review/session/continuation-route";

export const POST = createReviewContinuationRoute({
  accounts: getAccountsState,
  store: openReviewStore,
  now: () => new Date(),
});
