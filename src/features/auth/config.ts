export interface SupabaseConfig {
  readonly url: string;
  readonly anonKey: string;
}

/**
 * Reads Supabase configuration at call time, and returns null when accounts
 * are not set up.
 *
 * `@supabase/ssr` throws the moment it is constructed with a missing url or
 * key, so nothing in this product builds a client at module scope. Every
 * caller branches on null and renders the honest state instead.
 *
 * Both variables are read as literal `process.env.NEXT_PUBLIC_*` expressions,
 * which is the only form Next inlines into a client bundle. The anon key is
 * meant to be public; row-level security is what protects the data.
 */
export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/** True when both Supabase variables are present. */
export function isAccountsConfigured(): boolean {
  return getSupabaseConfig() !== null;
}
