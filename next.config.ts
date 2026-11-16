import type { NextConfig } from "next";

import { apexDomainConfigured } from "./src/shared/site-origin";

const canonicalDomain = apexDomainConfigured();

const nextConfig: NextConfig = {
  // Preserve the original URL for the app's canonical domain redirect.
  skipProxyUrlNormalize: canonicalDomain,
  skipTrailingSlashRedirect: canonicalDomain,
};

export default nextConfig;
