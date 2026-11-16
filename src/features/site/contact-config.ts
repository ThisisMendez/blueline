/** Production activation follows verification of delivery to the support inbox. */
export function contactFormId(): string | null {
  if (process.env.VERCEL_ENV === "production" && process.env.FORMSPREE_SUPPORT_VERIFIED !== "true") return null;
  const id = process.env.FORMSPREE_FORM_ID?.trim();
  return id && /^[a-zA-Z0-9]{1,64}$/.test(id) ? id : null;
}
