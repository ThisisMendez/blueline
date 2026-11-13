import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { deflateRawSync, inflateRawSync } from "node:zlib";

import type { GeneralReview } from "@/features/analysis/types";
import type { ExtractedDocument } from "@/features/packet/types";

const TTL_MS = 2 * 60 * 60 * 1000;
const MAX_TOKEN_LENGTH = 3_500_000;
const MAX_REVIEW_BYTES = 8_000_000;
const PURPOSE = "blueline-review-continuation-v1";

function browserCookie(request: Request, marker: string) {
  const prefix = new URL(request.url).protocol === "https:" ? "__Host-" : "";
  return `${prefix}blueline-review-browser-${marker}`;
}

export function reviewBrowser(request: Request, token: string): string | undefined {
  const marker = token.slice(0, 16);
  if (!/^[a-f0-9]{16}$/.test(marker) || token[16] !== ".") return undefined;
  const name = browserCookie(request, marker);
  const value = request.headers.get("cookie")?.split(";")
    .map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : undefined;
}

export function newReviewBrowser(request: Request) {
  const marker = randomBytes(8).toString("hex");
  const id = randomBytes(32).toString("hex");
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return {
    id,
    marker,
    cookie: `${browserCookie(request, marker)}=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${TTL_MS / 1000}${secure}`,
  };
}

export interface ReviewContinuation {
  readonly id: string;
  readonly documents: readonly ExtractedDocument[];
  readonly review: GeneralReview;
}

function continuationKey(): Buffer | null {
  const secret = process.env.REVIEW_CONTINUATION_SECRET;
  return secret && Buffer.byteLength(secret) >= 32
    ? createHash("sha256").update(PURPOSE).update(secret).digest()
    : null;
}

export function canIssueReviewContinuation(): boolean {
  return continuationKey() !== null;
}

/** A guest can carry the server's result in memory without storing it in a database. */
export function issueReviewContinuation(
  review: ReviewContinuation,
  now: number,
  browser: { readonly id: string; readonly marker: string },
): string | null {
  const key = continuationKey();
  if (!key) return null;
  const bytes = Buffer.from(JSON.stringify({ ...review, browser: browser.id, expiresAt: now + TTL_MS }));
  if (bytes.length > MAX_REVIEW_BYTES) return null;
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const payload = Buffer.concat([cipher.update(deflateRawSync(bytes)), cipher.final()]);
  const token = `${browser.marker}.${Buffer.concat([nonce, cipher.getAuthTag(), payload]).toString("base64url")}`;
  return token.length <= MAX_TOKEN_LENGTH ? token : null;
}

export function readReviewContinuation(token: string, now: number, browser: string): ReviewContinuation | null {
  const key = continuationKey();
  if (!key || token.length > MAX_TOKEN_LENGTH) return null;
  try {
    const bytes = Buffer.from(token.slice(17), "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(12, 28));
    const compressed = Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]);
    const result = JSON.parse(inflateRawSync(compressed, { maxOutputLength: MAX_REVIEW_BYTES }).toString()) as
      ReviewContinuation & { readonly expiresAt: number; readonly browser: string };
    return result.expiresAt > now && result.browser === browser ? result : null;
  } catch {
    return null;
  }
}
