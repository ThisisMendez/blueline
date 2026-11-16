/**
 * Draft Terms and Privacy text. Unreviewed: the pages that render it are
 * gated off production (see legal-gate.ts), and docs/legal/*.md carries the
 * same text with the checklist the owner and counsel must work through.
 *
 * Every factual statement here should trace to code:
 * - browser-only PDF parsing: src/features/packet/extract/pdf.ts
 * - request carries text, never a file: src/features/analysis/server/route.ts
 * - model calls through OpenRouter, one pinned provider: src/features/analysis/model/openrouter.ts
 * - anonymous reviews are not persisted: route.ts (`accounts.kind === "signed-in"`)
 * - 30/90-day retention and per-minute purge: supabase/migrations/0005, 0006
 * - red lines table, deleted with the account: supabase/migrations/0003
 * - sign-in methods: src/features/auth/actions.ts
 */

export interface LegalSection {
  readonly heading: string;
  readonly paragraphs: readonly string[];
}

export const LEGAL_DRAFT_DATE = "2026-11-13";

export const TERMS_SECTIONS: readonly LegalSection[] = [
  {
    heading: "What Blueline Lease is",
    paragraphs: [
      "Blueline Lease is a contract review app for residential leases. You choose whether you are the renter or the landlord, and the report points out clauses that could work against that side, quoting the exact words.",
      "It helps you understand your agreement and prepare questions for a qualified lawyer. Blueline Lease is not a law firm and does not give legal advice. It does not decide whether a term is enforceable, whether it is allowed where you live, or whether you should sign.",
    ],
  },
  {
    heading: "The beta",
    paragraphs: [
      "Blueline Lease is free during the beta. Features may change, pause, or stop while we work on the product, and the service may be unavailable at times.",
      "You must be 18 or older to use Blueline Lease.",
    ],
  },
  {
    heading: "What you upload",
    paragraphs: [
      "Upload only documents you have the right to share. You keep whatever rights you have in them. You let us process the text so we can run the review, including sending it to the AI provider described in the Privacy Policy.",
      "Don't use Blueline Lease to break the law, to get into other people's accounts, or to interfere with the service.",
    ],
  },
  {
    heading: "Reports can be wrong or incomplete",
    paragraphs: [
      "An AI model writes the report. Our software checks that each quoted sentence appears word for word in the text you gave us, but the explanations, severity levels, Lease Risk Score, and suggested edits can still be wrong. The report can also miss terms that matter to you.",
      "The Lease Risk Score sums up the flags we verified. It is not approval to sign, a statement about legality, or a promise that every risk was found. Read the lease yourself, and talk to a qualified lawyer before relying on the report.",
    ],
  },
  {
    heading: "Accounts",
    paragraphs: [
      "You can run a review without an account. If you create one, confirm your email address and keep your sign-in details private. Saving to your library requires an account. Some drafting tools may ask you to sign in. We may suspend an account that is used to misuse the service.",
    ],
  },
  {
    heading: "Disclaimers and limits on liability",
    paragraphs: [
      "[Counsel to draft. The service is provided as is during the beta, and the wording, limits, and governing law have not been decided.]",
    ],
  },
  {
    heading: "Changes to these terms",
    paragraphs: [
      "If we change these terms, we will update this page and the date at the top.",
    ],
  },
  {
    heading: "Contact",
    paragraphs: [
      "Use the contact form to ask a question about these terms or your account.",
    ],
  },
];

export const PRIVACY_SECTIONS: readonly LegalSection[] = [
  {
    heading: "What we collect",
    paragraphs: [
      "The text of your lease and any documents you add, the titles they carry, the side you chose, and the review we produce. We never receive the PDF file itself.",
      "If you create an account, we collect your email address and the name you enter. The signup form asks for your first name. Supabase handles your password and confirmation email. If Google sign-in is available and you use it, we receive your name and email address from Google.",
      "If you are signed in: the personal red lines you write (up to 20).",
      "We use cookies to keep you signed in. While you confirm your email address, a cookie holds that address for up to 24 hours. Where you can sign in and return to a guest report, a separate cookie links the report to your browser for up to two hours.",
      "If you send a contact message, we receive your name, reply email, topic, and message. Feedback can include your comment, whether the report was useful, the page you came from, and whether you reviewed as a renter or landlord. Email is optional for feedback.",
    ],
  },
  {
    heading: "How a review is processed",
    paragraphs: [
      "Your browser reads the text out of each PDF. The file stays on your device.",
      "The text and your chosen side go to our server, which sends them to an AI model through OpenRouter. OpenRouter passes the request to a single model provider that we choose in our settings, and that provider processes the text to write the review.",
      "Guest reviews stay in the open browser tab. Where guest saving is available, the app keeps an encrypted copy in that tab so you can sign in and return to the report. The option to return expires after two hours. The app adds the guest review to your library when you choose to save it.",
    ],
  },
  {
    heading: "How long we keep it",
    paragraphs: [
      "A review stored in your library expires 30 days after completion. If you extend a review, it expires 90 days after your most recent extension. The library shows the expiry date for each review.",
      "When a review expires, you can no longer open it. A scheduled cleanup deletes the text and results we stored for that review.",
      "Your red lines stay until you change them or your account is deleted.",
    ],
  },
  {
    heading: "Deleting your data",
    paragraphs: [
      "To ask us to delete a review or your account, use the contact form and enter the email address on your account. We’ll check that you control that address before acting. Expect an acknowledgment within five business days. We’ll complete verified requests within 30 days of receiving them or explain any exception that applies.",
    ],
  },
  {
    heading: "Who else handles your data",
    paragraphs: [
      "Supabase stores accounts and saved reviews. Vercel hosts the site. OpenRouter and the model provider it routes to process the text of each review. Formspree receives contact and feedback submissions and sends a copy to our support inbox.",
      "We don't sell your data.",
    ],
  },
  {
    heading: "Your rights",
    paragraphs: [
      "[Counsel to draft: rights under state privacy laws, age limits, and where data is stored.]",
    ],
  },
  {
    heading: "Changes and contact",
    paragraphs: [
      "If we change this policy, we will update this page and the date at the top. Use the contact form for privacy questions or requests.",
    ],
  },
];
