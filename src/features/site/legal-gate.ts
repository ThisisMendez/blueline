/**
 * The draft Terms and Privacy pages have not been checked by the owner or by
 * counsel, so they must never appear on the public production site. They show
 * on Vercel preview deployments and in local development only.
 *
 * Vercel sets `VERCEL_ENV` to "production", "preview" or "development" at
 * build and run time. Anything other than "production" shows the drafts.
 */
export function draftLegalPagesVisible(
  vercelEnv: string | undefined = process.env.VERCEL_ENV,
): boolean {
  return vercelEnv !== "production";
}
