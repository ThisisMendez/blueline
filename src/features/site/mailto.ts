/**
 * Builds the `mailto:` link the contact page hands to the visitor's email app.
 *
 * A mailto link is the only delivery path that costs nothing to run: Blueline
 * sends no mail itself. Some browsers and email apps cut long mailto URLs
 * short, so the link is capped and the form warns before the visitor loses
 * the end of their message.
 */

export const MAILTO_MAX_LENGTH = 1800;

export const CONTACT_TOPICS = [
  "A question about Blueline Redline",
  "Feedback on a review",
  "Something isn't working",
  "Privacy or my data",
  "Something else",
] as const;

export interface ContactDraft {
  readonly name: string;
  readonly email: string;
  readonly topic: string;
  readonly message: string;
}

export interface MailtoLink {
  readonly href: string;
  readonly length: number;
  /** True when the link is longer than {@link MAILTO_MAX_LENGTH}. */
  readonly tooLong: boolean;
  /** Characters over the cap, or 0. */
  readonly overBy: number;
}

/**
 * RFC 6068 wants reserved characters in a header value percent-encoded.
 * `encodeURIComponent` leaves `!'()*` alone; they are legal but some mail
 * clients mangle them, so they are encoded too. Line breaks become CRLF.
 */
export function encodeMailtoValue(value: string): string {
  return encodeURIComponent(value.replace(/\r\n|\r|\n/g, "\r\n")).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export function buildMailtoLink(to: string, draft: ContactDraft): MailtoLink {
  const topic = draft.topic.trim() || "Message";
  const subject = `Blueline Redline: ${topic}`;
  const name = draft.name.trim();
  const email = draft.email.trim();
  const signature = [name, email ? `<${email}>` : ""].filter(Boolean).join(" ");
  const message = draft.message.trim();
  const body = signature ? `${message}\n\nFrom: ${signature}` : message;

  const address = encodeURIComponent(to.trim()).replace(/%40/g, "@");
  const href = `mailto:${address}?subject=${encodeMailtoValue(subject)}&body=${encodeMailtoValue(body)}`;
  const overBy = Math.max(0, href.length - MAILTO_MAX_LENGTH);
  return { href, length: href.length, tooLong: overBy > 0, overBy };
}
