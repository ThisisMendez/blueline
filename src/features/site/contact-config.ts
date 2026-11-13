/** Set the form ID only after verifying its notification inbox. */
export function contactFormId(): string | null {
  const id = process.env.FORMSPREE_FORM_ID?.trim();
  return id && /^[a-zA-Z0-9]{1,64}$/.test(id) ? id : null;
}
