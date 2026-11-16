import type { MetadataRoute } from "next";

import { rhodeIslandPilotEnabled } from "@/features/site/rhode-island-references";
import { publicSiteOrigin } from "@/shared/site-origin";

const publicRoutes = [
  "/", "/how-it-works", "/features", "/pricing", "/contact",
  "/review", "/resources", "/sample-report/renter", "/sample-report/landlord",
  "/terms", "/privacy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  if (process.env.VERCEL_ENV !== "production") return [];

  const paths = rhodeIslandPilotEnabled()
    ? [...publicRoutes, "/resources/rhode-island"]
    : publicRoutes;
  const origin = publicSiteOrigin();
  return paths.map((path) => ({ url: new URL(path, origin).href }));
}
