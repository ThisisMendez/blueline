/**
 * Public support contact details.
 *
 * Both are unknown until the owner chooses a public support address and a
 * response time they can keep. While the address is null the contact page
 * renders its form disabled; while the response time is null the page makes
 * no promise about one. Never put a personal or private address here: this
 * value ships to every visitor's browser.
 */
export const SUPPORT_EMAIL: string | null = null;

/** A response time the team can keep, such as "within two business days". */
export const RESPONSE_TIME: string | null = null;
