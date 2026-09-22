import { getAccountsState } from "@/features/auth/session";
import { openReviewStore } from "@/features/library/supabase-store";

import { OpenRouterModelClient } from "../model/openrouter";
import type { AnalysisRouteDependencies } from "./route";

/**
 * Production wiring for the analysis route.
 *
 * Every dependency that touches configuration is a function, resolved inside
 * the request. Constructing the OpenRouter client reads nothing; the two
 * environment variables are read when a call is actually made, and a Supabase
 * client is only built when both of its variables are present. That is why
 * the app boots with none of them set.
 */
export function productionDependencies(): AnalysisRouteDependencies {
  return {
    model: new OpenRouterModelClient({
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    }),
    accounts: getAccountsState,
    store: openReviewStore,
    now: () => new Date(),
    newReviewId: () => crypto.randomUUID(),
  };
}
