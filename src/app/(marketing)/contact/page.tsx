import type { Metadata } from "next";
import Link from "next/link";

import { contactFormId } from "@/features/site/contact-config";
import { FEEDBACK_TOPIC, type FeedbackContext } from "@/features/site/contact-fields";
import { ContactForm } from "@/features/site/ContactForm";
import { PageShell, Panel } from "@/features/site/PageShell";
import { SUPPORT_EMAIL } from "@/features/site/policy-versions";

export const metadata: Metadata = {
  title: "Contact",
  description: "Send the Blueline Lease team a question or feedback.",
};

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const query = await searchParams;
  const formAvailable = contactFormId() !== null;
  const feedback: FeedbackContext | undefined = query.topic === FEEDBACK_TOPIC ? {
    source: query.source === "footer" || query.source === "report" ? query.source : undefined,
    role: query.source === "report" && (query.role === "renter" || query.role === "landlord") ? query.role : undefined,
  } : undefined;

  return (
    <PageShell
      eyebrow={feedback ? "Beta feedback" : "Contact"}
      title={feedback ? "Tell us how it went" : "We'd love to hear from you"}
      intro={
        <p>{feedback ? "What did Blueline Lease help you understand? Tell us where you got stuck, too." : "Send us a question or tell us what went wrong."}</p>
      }
    >
      <div className="grid gap-4 md:grid-cols-[1.5fr_1fr] md:items-start md:gap-6">
        <Panel id="contact-form-heading" title={feedback ? "Your feedback" : "Write to us"}>
          <ContactForm available={formAvailable} feedback={feedback} />
        </Panel>

        <Panel id="contact-notes-heading" title="Before you write" tone="deep">
          <p>
            Leave your lease out of the message, along with personal details
            like your address, phone number, or account numbers. Describe the
            problem in your own words instead.
          </p>
          <p>
            You can email <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            {!formAvailable && " The web form is off while we confirm its delivery."}
          </p>
          <p>
            For data requests and our response times, see the <Link className="underline" href="/privacy">Privacy Policy</Link>.
            Read our <Link className="underline" href="/terms">Terms of Use</Link> for what the service can help with.
          </p>
        </Panel>
      </div>
    </PageShell>
  );
}
