import type { NextConfig } from "next";

import { apexDomainConfigured } from "./src/shared/site-origin";
import { assertSafeSupabaseTarget } from "./src/shared/environment-safety";

assertSafeSupabaseTarget(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.VERCEL_ENV);

const canonicalDomain = apexDomainConfigured();

const nextConfig: NextConfig = {
  // Preserve the original URL for the app's canonical domain redirect.
  skipProxyUrlNormalize: canonicalDomain,
  skipTrailingSlashRedirect: canonicalDomain,
};

export default nextConfig;
