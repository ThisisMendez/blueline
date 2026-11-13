import { getAccountsState } from "@/features/auth/session";
import { createRenameRoute } from "@/features/library/rename-route";
import { openReviewStore } from "@/features/library/supabase-store";

export const POST = createRenameRoute({ accounts: getAccountsState, store: openReviewStore });
