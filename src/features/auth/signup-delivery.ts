export function publicSignupEmailReady(): boolean {
  return process.env.VERCEL_ENV !== "production" || process.env.AUTH_EMAIL_DELIVERY_VERIFIED === "true";
}
