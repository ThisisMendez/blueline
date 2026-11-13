import { headers } from "next/headers";

const PATH_ORIGIN = "https://blueline.invalid";
export const DEFAULT_SIGN_IN_PATH = "/account";

export function internalReturnPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return null;
  if (/^\/(?:%2f|%5c)/i.test(value) || value.includes("\\")) return null;
  const url = URL.parse(value, PATH_ORIGIN);
  if (!url || url.origin !== PATH_ORIGIN || url.pathname.startsWith("//")) return null;
  return url.pathname + url.search + url.hash;
}

export function signInReturnPath(value: unknown): string {
  return internalReturnPath(value) ?? DEFAULT_SIGN_IN_PATH;
}

function isLocalOrigin(url: URL): boolean {
  return url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
}

function trustedOrigin(value: string): string | null {
  const url = URL.parse(value);
  if (!url || url.username || url.password) return null;
  return url.protocol === "https:" || isLocalOrigin(url) ? url.origin : null;
}

async function authOrigin(): Promise<string | null> {
  const production = process.env.VERCEL_ENV === "production";
  const configured = [
    process.env.NEXT_PUBLIC_SITE_URL,
    production && process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  ].flatMap((value) => {
    const origin = value ? trustedOrigin(value) : null;
    return origin && (!production || !isLocalOrigin(new URL(origin))) ? [origin] : [];
  });
  const requestOrigin = (await headers()).get("origin");
  if (requestOrigin) {
    if (configured.includes(requestOrigin)) return requestOrigin;
    const url = URL.parse(requestOrigin);
    if (process.env.NODE_ENV !== "production" && url && isLocalOrigin(url)) return url.origin;
    return null;
  }
  return configured[0] ?? (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : null);
}

export async function authCallbackUrl(
  path: "/auth/confirm" | "/auth/callback",
  parameters: Readonly<Record<string, string>>,
): Promise<string | null> {
  const origin = await authOrigin();
  if (!origin) return null;
  const url = new URL(path, origin);
  url.search = new URLSearchParams(parameters).toString();
  return url.href;
}
