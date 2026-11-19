// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { getSupabaseConfig } from "./config";

afterEach(() => vi.unstubAllEnvs());

describe("server account configuration", () => {
  it("rejects a production URL inherited by Preview before creating an account client", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://bzedgcjynhnodfvjthod.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-test-key");
    expect(() => getSupabaseConfig()).toThrow("Production Supabase is blocked");
  });

  it("keeps the production account configuration available in Vercel Production", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://bzedgcjynhnodfvjthod.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-test-key");
    expect(getSupabaseConfig()?.url).toBe("https://bzedgcjynhnodfvjthod.supabase.co");
  });

  it("keeps credential-free fixtures unconfigured", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(getSupabaseConfig()).toBeNull();
  });
});
