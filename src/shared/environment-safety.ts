const PRODUCTION_SUPABASE_HOST = "bzedgcjynhnodfvjthod.supabase.co";

/** Keep local development and Preview away from the production database. */
export function assertSafeSupabaseTarget(
  url: string | undefined,
  vercelEnvironment: string | undefined,
): void {
  if (!url || vercelEnvironment === "production") return;

  if (new URL(url).hostname === PRODUCTION_SUPABASE_HOST) {
    throw new Error(
      "Production Supabase is blocked outside Vercel Production. Use the redline staging project or leave Supabase settings blank for fixtures.",
    );
  }
}
