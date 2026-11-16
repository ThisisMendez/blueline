export interface LegalSection {
  readonly heading: string;
  readonly paragraphs: readonly string[];
}

export const TERMS_V1: readonly LegalSection[] = [
  {
    heading: "Who we are",
    paragraphs: [
      "Blueline Lease™ helps renters and landlords read residential lease documents and prepare questions. Blueline Lease is operated by Alexis Mendez, an individual in Rhode Island.",
      "Blueline Lease is not a law firm and does not give legal advice. Using the service does not create an attorney-client relationship. A report does not decide whether a lease is legal or enforceable, or whether it is safe to sign. A lawyer licensed in the relevant place can advise you about your situation.",
    ],
  },
  {
    heading: "Who can use the beta",
    paragraphs: [
      "You must be 18 or older. The beta is free. We may change, pause, or end the beta or any feature. You can run a review as a guest. You need an account to save reviews to your library or use some drafting tools when available.",
    ],
  },
  {
    heading: "Your uploads and account",
    paragraphs: [
      "Upload only documents you have the right to share. You keep any rights you have in those documents. You give us permission to process the text to provide the service, including sending it to the companies listed in our Privacy Policy.",
      "Keep your account details secure and tell us if you suspect someone has accessed your account. Do not use the service to break the law, violate another person's rights, access an account that isn't yours, or disrupt or abuse the service. We may suspend or close accounts that break these terms or threaten the security of the service. You can ask us to close your account.",
    ],
  },
  {
    heading: "How to use your report",
    paragraphs: [
      "AI helps write the report. We check quoted text against the text we received. The report can still miss important terms or give wrong explanations, scores, or suggestions. Check the lease yourself before you rely on any part of the report.",
      "If the app includes a legal reference, check the original source and ask a lawyer how it applies to your lease. A lease score reflects the concerns flagged during the review.",
    ],
  },
  {
    heading: "Copyright",
    paragraphs: [
      "We and our licensors keep our rights in the service, its software, and our branding. You may use your report for your own lease review and share it with someone helping you, subject to your rights in the underlying documents. These terms leave any rights you have under copyright law in place.",
    ],
  },
  {
    heading: "Warranties and limits on liability",
    paragraphs: [
      "As far as the law allows, the service is provided as is and as available. We disclaim express and implied warranties, including merchantability, fitness for a particular purpose, and noninfringement. We make no promise that the service will be uninterrupted or that any report will be accurate or complete.",
      "As far as the law allows, our total liability for claims arising out of the service or these terms is limited to the greater of $50 or what you paid us to use the service in the 12 months before the event giving rise to the claim. We are not liable for indirect or consequential damages to the extent the law allows. These terms do not limit any rights or liability the law says cannot be limited.",
      "To the extent permitted by law, you agree to cover reasonable costs and losses we incur from third-party claims caused by your misuse of the service or your violation of the law.",
    ],
  },
  {
    heading: "Disputes and these terms",
    paragraphs: [
      "Rhode Island law governs these terms, subject to any consumer rights the law gives you that cannot be waived. Disputes must be brought in the state or federal courts in Rhode Island that have jurisdiction, unless applicable law requires a different court. Either party may bring an eligible claim in a small claims court that has jurisdiction.",
      "If part of these terms cannot be enforced, the rest still apply. These terms are the entire agreement between you and us about using the service.",
    ],
  },
  {
    heading: "Changes and support",
    paragraphs: [
      "When we change these terms, we update the version and date and keep prior versions available. We give notice of material changes before they take effect, such as through the site or account email.",
    ],
  },
];

export const PRIVACY_V1: readonly LegalSection[] = [
  {
    heading: "Who handles your information",
    paragraphs: [
      "Blueline Lease is operated by Alexis Mendez, an individual in Rhode Island. We use information to run reviews, manage accounts, reply to messages, and protect the service.",
      "We do not sell personal data or share it for targeted advertising. We may disclose information when the law requires it or to address a threat to the service or someone's safety.",
    ],
  },
  {
    heading: "What we collect",
    paragraphs: [
      "For a review, we receive the text and names of your submitted documents and whether you chose renter or landlord. We also create a report from that information. The text can include information about other people.",
      "For an account, we collect your first name, email address and account ID, along with the policy versions you accepted, the date and time you accepted them, and your confirmation that you are at least 18. Supabase handles passwords and email verification. We store any personal red lines you choose to save.",
      "If you contact us, we receive the details you send, such as your name, email, topic, and message. Beta feedback may also include a usefulness rating, the page you came from, and which side you chose. You can leave out your email when using the feedback form.",
      "The services that run the site may receive technical information such as IP addresses and request times to operate, secure, and troubleshoot the site.",
    ],
  },
  {
    heading: "What happens to your lease",
    paragraphs: [
      "Your browser reads the PDF. We receive the extracted text and document names, while the PDF file itself stays on your device. Remove sensitive details, such as Social Security numbers, bank details, health information, and signatures, from the copy you upload.",
      "Our server sends review content to OpenRouter, which routes it to the model provider Fireworks AI for processing. The AI provider receives the text to generate findings. If you ask us to check your personal red lines, we send those preferences with the relevant lease text. Provider handling depends on their service terms and settings.",
      "A guest review stays in the current browser tab and is not stored in our review library. If guest continuation is available, the option to return to the report after signing in expires after two hours. You can choose whether to save that guest review after signing in.",
    ],
  },
  {
    heading: "Who helps run the service",
    paragraphs: [
      "Vercel hosts the site. Supabase handles accounts and stores saved reviews. Our primary Supabase database and Auth project are in the eastern United States. Hosting, service providers, backups, and support may handle data in other locations.",
      "When the contact form is available, Formspree handles submissions and sends them to our support mailbox. That mailbox uses Google for email. If we enable Cloudflare Email Routing, it forwards messages sent to our support address. If we enable Resend, it handles account and verification email delivery.",
      "If we add Google sign-in and you choose it, Google would handle that sign-in and share your name and email address with us.",
    ],
  },
  {
    heading: "How long information stays",
    paragraphs: [
      "A review in your library expires after 30 days, unless you extend it. An extension sets the expiry to 90 days after that extension. Once a review expires, it is no longer available in your library. A scheduled cleanup deletes the expired review and associated document text from our live database.",
      "We keep account information until the account is deleted. Red lines stay until you remove them or close your account. Support messages stay as needed to respond and follow up. Copies in backups, security logs, or vendor systems may follow separate timelines. We may keep some information longer if needed to meet legal obligations or resolve a dispute.",
    ],
  },
  {
    heading: "Cookies, security, and age",
    paragraphs: [
      "We use essential cookies to keep you signed in, remember your email while you confirm it, and return you to an open review.",
      "We use encrypted connections and account access controls. If a breach requires notice, we will notify affected people without unreasonable delay and follow applicable law.",
      "The service is for people 18 or older. We do not knowingly collect personal information from people under 18. Contact us if you believe a minor's information has been provided.",
    ],
  },
  {
    heading: "Your choices and requests",
    paragraphs: [
      "Anyone can ask to access, correct, or delete their personal information or get a copy of it. Email support or use the Contact form when it is available. For an account request, use the email on your account. We verify control of that email before acting. Never include a password, verification code, or lease in your request.",
      "We acknowledge requests within five business days and complete verified requests within 30 days of receipt or explain any applicable exception.",
    ],
  },
  {
    heading: "Changes to this policy",
    paragraphs: [
      "We update the version and effective date when this policy changes and keep prior versions available. We give notice of material changes before they take effect, such as through the site or account email.",
    ],
  },
];
