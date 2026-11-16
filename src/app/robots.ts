import type { MetadataRoute } from "next";

import { publicSiteOrigin } from "@/shared/site-origin";

export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account", "/api/", "/auth/", "/forgot-password", "/reset-password",
        "/review/", "/sign-in", "/sign-up", "/verify-email",
      ],
    },
    sitemap: new URL("/sitemap.xml", publicSiteOrigin()).href,
  };
}
