export const CONTACT_TOPICS = [
  "A question about Blueline Redline",
  "Feedback on a review",
  "Something isn't working",
  "Privacy or my data",
  "Something else",
] as const;

export const CONTACT_LIMITS = { name: 100, email: 254, message: 2_000 } as const;

export const FEEDBACK_TOPIC = "beta-feedback";
export const FEEDBACK_SOURCES = ["footer", "report"] as const;
export const FEEDBACK_ROLES = ["renter", "landlord"] as const;
export const USEFULNESS_ANSWERS = ["Yes", "Somewhat", "No"] as const;

export type FeedbackSource = (typeof FEEDBACK_SOURCES)[number];
export type FeedbackRole = (typeof FEEDBACK_ROLES)[number];

export interface FeedbackContext {
  readonly source?: FeedbackSource;
  readonly role?: FeedbackRole;
}
