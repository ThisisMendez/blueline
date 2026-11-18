import { describe, expect, it } from "vitest";

import { assertSafeSupabaseTarget } from "./environment-safety";

const production = "https://bzedgcjynhnodfvjthod.supabase.co";
const staging = "https://dwjhkcgzrlbobdpzpley.supabase.co";

describe("Supabase environment isolation", () => {
  it.each([undefined, "development", "preview"])(
    "blocks the production database in %s before a client can connect",
    (environment) => {
      expect(() => assertSafeSupabaseTarget(production, environment)).toThrow("Production Supabase is blocked");
    },
  );

  it("allows the production database in Vercel Production", () => {
    expect(() => assertSafeSupabaseTarget(production, "production")).not.toThrow();
  });

  it.each([undefined, "preview"])("allows staging and unconfigured fixtures in %s", (environment) => {
    expect(() => assertSafeSupabaseTarget(staging, environment)).not.toThrow();
    expect(() => assertSafeSupabaseTarget("", environment)).not.toThrow();
    expect(() => assertSafeSupabaseTarget(undefined, environment)).not.toThrow();
  });
});
