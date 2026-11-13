import { getSupabaseConfig } from "./config";

interface AuthProviderSettings {
  readonly external?: { readonly google?: boolean; readonly email?: boolean };
  readonly mailer_autoconfirm?: boolean;
  readonly disable_signup?: boolean;
}

export async function readAuthProviderSettings(): Promise<AuthProviderSettings | null> {
  const config = getSupabaseConfig();
  if (!config) return null;

  try {
    const settings = await fetch(new URL("/auth/v1/settings", config.url), {
      cache: "no-store",
      headers: { apikey: config.anonKey },
      signal: AbortSignal.timeout(5_000),
    });
    if (!settings.ok) return null;
    return await settings.json() as AuthProviderSettings | null;
  } catch {
    return null;
  }
}
