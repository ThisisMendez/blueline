import { afterEach, expect, it, vi } from "vitest";
import { authCallbackUrl } from "./redirects";

const request = vi.hoisted(() => ({ origin: "" }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(request.origin ? { origin: request.origin } : {}),
}));
afterEach(() => {
  vi.unstubAllEnvs();
  request.origin = "";
});

it("uses the production alias when a stale local setting is present", async () => {
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
  vi.stubEnv("VERCEL_URL", "deployment.example.com");
  vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "production.example.com");
  expect(await authCallbackUrl("/auth/confirm", { next: "/account" }))
    .toBe("https://production.example.com/auth/confirm?next=%2Faccount");
  request.origin = "http://localhost:3000";
  vi.stubEnv("NODE_ENV", "production");
  expect(await authCallbackUrl("/auth/confirm", {})).toBeNull();
});
