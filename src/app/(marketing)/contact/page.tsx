import type { Metadata } from "next";

import { RESPONSE_TIME, SUPPORT_EMAIL } from "@/features/site/contact-config";
import { ContactForm } from "@/features/site/ContactForm";
import { PageShell, Panel } from "@/features/site/PageShell";

export const metadata: Metadata = {
  title: "Contact | Blueline Redline",
  description: "Send the Blueline Redline team a question or feedback.",
};

export default function ContactPage() {
  return (
    <PageShell
      eyebrow="Contact"
      title="We'd love to hear from you"
      intro={
        <p>
          Questions, feedback, or something that broke: write to us here. The
          form opens a draft in your own email app, and you send it from
          there.
        </p>
      }
    >
      <div className="grid gap-4 md:grid-cols-[1.5fr_1fr] md:items-start md:gap-6">
        <Panel id="contact-form-heading" title="Write to us">
          <ContactForm supportEmail={SUPPORT_EMAIL} />
        </Panel>

        <Panel id="contact-notes-heading" title="Before you write" tone="deep">
          <p>
            Leave your lease out of the message, along with personal details
            like your address, phone number, or account numbers. Describe the
            problem in your own words instead.
          </p>
          <p>
            We can&apos;t give legal advice or tell you whether to sign.
          </p>
          {SUPPORT_EMAIL && RESPONSE_TIME ? (
            <p>We usually reply {RESPONSE_TIME}.</p>
          ) : null}
        </Panel>
      </div>
    </PageShell>
  );
}
