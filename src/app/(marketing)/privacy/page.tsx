import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { draftLegalPagesVisible } from "@/features/site/legal-gate";
import { PRIVACY_SECTIONS } from "@/features/site/legal-content";
import { LegalDraft } from "@/features/site/LegalDraft";

export const metadata: Metadata = {
  title: "Privacy | Blueline Redline",
  robots: { index: false, follow: false },
};

/** Unreviewed draft: preview and development only, a 404 on production. */
export default function PrivacyPage() {
  if (!draftLegalPagesVisible()) notFound();
  return <LegalDraft eyebrow="Privacy" title="Privacy Policy" sections={PRIVACY_SECTIONS} />;
}
