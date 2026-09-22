import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { getSupabaseConfig } from "./config";

/**
 * Builds a Supabase client for a Server Component, Route Handler, or Server
 * Action, or returns null when accounts are not configured.
 *
 * `getAll`/`setAll` only — the single-cookie methods are deprecated and go
 * away in the next major version. The try/catch around `setAll` is what makes
 * this safe to call during a Server Component render, where response headers
 * can no longer be written; `src/proxy.ts` refreshes the session instead.
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient | null> {
  const config = getSupabaseConfig();
  if (!config) return null;

  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Rendering a Server Component: headers are already committed.
          // The proxy writes refreshed cookies on the next request.
        }
      },
    },
  });
}
