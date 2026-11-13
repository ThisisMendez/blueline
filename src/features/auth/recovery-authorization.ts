import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const RECOVERY_TTL_SECONDS = 10 * 60;

function recoveryCookieName(): string {
  return process.env.NODE_ENV === "production" ? "__Host-blueline-recovery" : "blueline-recovery";
}

function recoverySecret(): string | null {
  const secret = process.env.AUTH_RECOVERY_COOKIE_SECRET;
  return secret && Buffer.byteLength(secret) >= 32 ? secret : null;
}

export function isRecoveryConfigured(): boolean {
  return recoverySecret() !== null;
}

function signature(secret: string, userId: string, sessionId: string, expiresAt: string): Buffer {
  return createHmac("sha256", secret)
    .update(JSON.stringify([userId, sessionId, expiresAt]))
    .digest();
}

async function verifiedSessionId(client: SupabaseClient, userId: string): Promise<string | null> {
  const { data, error } = await client.auth.getClaims();
  const claims = data?.claims;
  if (error || claims?.sub !== userId || typeof claims.session_id !== "string") return null;
  return claims.session_id;
}

/** Only a successfully verified recovery callback may issue this proof. */
export async function grantPasswordRecovery(client: SupabaseClient, userId: string): Promise<boolean> {
  const secret = recoverySecret();
  if (!secret) return false;
  const sessionId = await verifiedSessionId(client, userId);
  if (!sessionId) return false;

  const expiresAt = String(Math.floor(Date.now() / 1000) + RECOVERY_TTL_SECONDS);
  const proof = signature(secret, userId, sessionId, expiresAt).toString("base64url");
  (await cookies()).set(recoveryCookieName(), `${expiresAt}.${proof}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: RECOVERY_TTL_SECONDS,
    path: "/",
  });
  return true;
}

export async function hasPasswordRecovery(client: SupabaseClient, userId: string): Promise<boolean> {
  const secret = recoverySecret();
  const marker = (await cookies()).get(recoveryCookieName())?.value;
  const match = marker?.match(/^(\d{10,12})\.([\w-]{43})$/);
  if (!secret || !match || Number(match[1]) <= Date.now() / 1000) return false;
  const sessionId = await verifiedSessionId(client, userId);
  if (!sessionId) return false;

  const supplied = Buffer.from(match[2], "base64url");
  const expected = signature(secret, userId, sessionId, match[1]);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function clearPasswordRecovery(): Promise<void> {
  (await cookies()).delete(recoveryCookieName());
}
