const APEX_ORIGIN = "https://bluelinelease.com";
const LEGACY_ORIGIN = "https://blueline-khaki-eta.vercel.app";

export function apexDomainConfigured(): boolean {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  return process.env.VERCEL_ENV === "production"
    && (configured === APEX_ORIGIN || configured === APEX_ORIGIN + "/");
}

export function publicSiteOrigin(): string {
  return apexDomainConfigured() ? APEX_ORIGIN : LEGACY_ORIGIN;
}

export function isLegacyHost(hostname: string): boolean {
  return hostname === "www.bluelinelease.com" || hostname === new URL(LEGACY_ORIGIN).hostname;
}
