import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { proxy } from "./proxy";

const apex = "https://bluelinelease.com";
const legacy = "https://blueline-khaki-eta.vercel.app";
const www = "https://www.bluelinelease.com";

beforeEach(() => {
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", apex);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
});

afterEach(() => vi.unstubAllEnvs());

describe("canonical domain redirect", () => {
  it.each([legacy, www])("sends %s to the apex with a permanent 301", async (origin) => {
    const path = "/sample-report/renter/?ref=example&message=two%20words";
    const result = await proxy(new NextRequest(origin + path));

    expect(result.status).toBe(301);
    expect(result.headers.get("location")).toBe(apex + path);
  });

  it("uses the inbound host when the server request URL has a local origin", async () => {
    const result = await proxy(new NextRequest("http://localhost:3000/resources", {
      method: "HEAD",
      headers: { host: "www.bluelinelease.com" },
    }));

    expect(result.status).toBe(301);
    expect(result.headers.get("location")).toBe(apex + "/resources");
  });

  it.each(["", legacy, "http://bluelinelease.com", apex + "/review", "https://elsewhere.example"])(
    "keeps the legacy deployment reachable with site setting %j",
    async (configured) => {
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", configured);
      const result = await proxy(new NextRequest(legacy + "/review"));

      expect(result.headers.get("location")).toBeNull();
      expect(result.headers.get("x-middleware-next")).toBe("1");
    },
  );

  it("leaves preview deployments and unrelated hosts alone", async () => {
    for (const origin of [apex, "http://localhost:3000", "https://preview.vercel.app"]) {
      const response = await proxy(new NextRequest(origin + "/review", {
        headers: { "x-forwarded-host": "www.bluelinelease.com" },
      }));
      expect(response.headers.get("location")).toBeNull();
    }

    vi.stubEnv("VERCEL_ENV", "preview");
    const result = await proxy(new NextRequest(legacy + "/review"));
    expect(result.headers.get("location")).toBeNull();
  });

  it("keeps auth callbacks, API requests, and submissions on their current origin", async () => {
    for (const path of ["/auth/confirm?token_hash=example", "/auth/callback?code=example", "/api/analysis"]) {
      const result = await proxy(new NextRequest(legacy + path));
      expect(result.headers.get("location")).toBeNull();
    }

    const response = await proxy(new NextRequest(legacy + "/review", { method: "POST" }));
    expect(response.headers.get("location")).toBeNull();
  });

  it("never treats a double slash in the request path as a host", async () => {
    const result = await proxy(new NextRequest(legacy + "//elsewhere.example"));

    expect(result.headers.get("location")).toBe(apex + "//elsewhere.example");
  });
});
