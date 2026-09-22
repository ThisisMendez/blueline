"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "./config";

/**
 * Builds a Supabase client for the browser, or returns null when accounts are
 * not configured.
 *
 * Call it inside a component or an event handler, never at module scope: the
 * constructor throws on a missing url or key, and a module-scope call would
 * turn an unconfigured deployment into a blank page.
 *
 * Cookie handling is deliberately left to the library. Its own guidance is
 * that `options.cookies` should not be configured on the browser client.
 */
export function createBrowserSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) return null;
  return createBrowserClient(config.url, config.anonKey);
}
