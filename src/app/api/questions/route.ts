import { OpenRouterModelClient } from "@/features/analysis/model/openrouter";
import { createQuestionRoute } from "@/features/questions/route";

export const POST = createQuestionRoute(new OpenRouterModelClient({ siteUrl: process.env.NEXT_PUBLIC_SITE_URL }));
export const maxDuration = 120;
