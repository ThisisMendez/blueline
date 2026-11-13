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
    heading: "What Blueline Redline is",
    paragraphs: [
      "Blueline Redline is a contract review app for residential leases. You choose whether you are the renter or the landlord, and the report points out clauses that could work against that side, quoting the exact words.",
      "It helps you understand your agreement and prepare questions for a qualified lawyer. Blueline Redline is not a law firm and does not give legal advice. It does not decide whether a term is enforceable, whether it is allowed where you live, or whether you should sign.",
    ],
  },
  {
    heading: "The beta",
    paragraphs: [
      "Blueline Redline is free during the beta. Features may change, pause, or stop while we work on the product, and the service may be unavailable at times.",
    ],
  },
  {
    heading: "What you upload",
    paragraphs: [
      "Upload only documents you have the right to share. You keep whatever rights you have in them. You let us process the text so we can run the review, including sending it to the AI provider described in the Privacy Policy.",
      "Don't use Blueline Redline to break the law, to get into other people's accounts, or to interfere with the service.",
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
      "You can run a review without an account. If you create one, keep your sign-in details private. We may suspend an account that is used to misuse the service.",
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
      "Use the contact page. We are still setting up a public contact address.",
    ],
  },
];

export const PRIVACY_SECTIONS: readonly LegalSection[] = [
  {
    heading: "What we collect",
    paragraphs: [
      "The text of your lease and any documents you add, the titles they carry, the side you chose, and the review we produce. We never receive the PDF file itself.",
      "If you create an account: your email address, the display name you give us, and your password, which our sign-in provider stores in hashed form. If you sign in with Google, we receive your name and email address from Google.",
      "If you are signed in: the personal red lines you write (up to 20).",
      "We use cookies to keep you signed in.",
    ],
  },
  {
    heading: "How a review is processed",
    paragraphs: [
      "Your browser reads the text out of each PDF. The file stays on your device.",
      "The text and your chosen side go to our server, which sends them to an AI model through OpenRouter. OpenRouter passes the request to a single model provider that we choose in our settings, and that provider processes the text to write the review.",
      "If you are not signed in, we don't save the text or the review in our database.",
    ],
  },
  {
    heading: "How long we keep it",
    paragraphs: [
      "If you are signed in, each completed review is kept in your library for 30 days. If you save it, we keep it for 90 days from that save. The library shows each review's expiry date.",
      "When a review expires you can no longer open it, and a scheduled cleanup that runs every minute deletes the stored text and results.",
      "Your red lines stay until you change them or your account is deleted.",
    ],
  },
  {
    heading: "Deleting your data",
    paragraphs: [
      "There is no button yet to delete a single review or your whole account. Until there is, ask us through the contact page and we will delete it.",
    ],
  },
  {
    heading: "Who else handles your data",
    paragraphs: [
      "Supabase stores accounts and saved reviews. Vercel hosts the site. OpenRouter and the model provider it routes to process the text of each review. Each one handles data under its own terms.",
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
      "If we change this policy, we will update this page and the date at the top. To reach us, use the contact page. We are still setting up a public contact address.",
    ],
  },
];
