import type { Metadata } from "next";

import { PRIVACY_V1 } from "@/features/site/legal-content";
import { LegalPolicy } from "@/features/site/LegalPolicy";
import { CURRENT_LEGAL } from "@/features/site/policy-versions";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <LegalPolicy
    title="Privacy Policy"
    version={CURRENT_LEGAL.privacyVersion}
    effectiveDate={CURRENT_LEGAL.effectiveDate}
    sections={PRIVACY_V1}
    versionPath={CURRENT_LEGAL.privacyPath}
  />;
}
