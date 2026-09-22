import { getAccountsState } from "@/features/auth/session";
import { openReviewStore } from "@/features/library/supabase-store";
import { OpenRouterModelClient } from "@/features/analysis/model/openrouter";
import { openRedLineStore } from "./supabase-store";
import type { RedLineDependencies } from "./routes";

export function redLineDependencies(): RedLineDependencies {
  return { model: new OpenRouterModelClient({ siteUrl: process.env.NEXT_PUBLIC_SITE_URL }), accounts: getAccountsState, reviews: openReviewStore, preferences: openRedLineStore };
}
