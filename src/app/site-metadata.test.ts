import { afterEach, describe, expect, it, vi } from "vitest";

import manifest from "./manifest";
import robots from "./robots";
import sitemap from "./sitemap";

afterEach(() => vi.unstubAllEnvs());

describe("public site metadata", () => {
  it("uses the new brand in the web manifest", () => {
    expect(manifest()).toMatchObject({ name: "Blueline Lease", short_name: "Blueline Lease" });
  });

  it("keeps legacy sitemap URLs until the apex setting is present", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(sitemap()).toContainEqual({ url: "https://blueline-khaki-eta.vercel.app/" });
    expect(robots().sitemap).toBe("https://blueline-khaki-eta.vercel.app/sitemap.xml");
  });

  it("lists public canonical URLs on the apex once configured", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://bluelinelease.com/");
    const urls = sitemap().map(({ url }) => url);
    expect(urls).toEqual(expect.arrayContaining([
      "https://bluelinelease.com/",
      "https://bluelinelease.com/sample-report/renter",
      "https://bluelinelease.com/sample-report/landlord",
      "https://bluelinelease.com/terms",
      "https://bluelinelease.com/privacy",
    ]));
    expect(urls.every((url) => new URL(url).hostname === "bluelinelease.com")).toBe(true);
    expect(urls).not.toContain("https://bluelinelease.com/account");
    expect(urls).not.toContain("https://bluelinelease.com/review/report");
    expect(robots().sitemap).toBe("https://bluelinelease.com/sitemap.xml");
  });

  it("keeps previews out of the sitemap and blocks crawlers", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(sitemap()).toEqual([]);
    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });
});
