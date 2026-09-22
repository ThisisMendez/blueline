import { getAccountsState } from "@/features/auth/session";
import { openReviewStore } from "@/features/library/supabase-store";
import { createRetentionRoute } from "@/features/library/retention-route";

export const POST = createRetentionRoute({ accounts: getAccountsState, store: openReviewStore });
