import type { Metadata } from "next";

import { PRIVACY_V1 } from "@/features/site/legal-content";
import { LegalPolicy } from "@/features/site/LegalPolicy";
import { LEGAL_V1 } from "@/features/site/policy-versions";

export const metadata: Metadata = {
  title: "Privacy Policy, Version 1",
  robots: { index: false, follow: true },
};

export default function PrivacyVersionOnePage() {
  return <LegalPolicy
    title="Privacy Policy"
    version={LEGAL_V1.privacyVersion}
    effectiveDate={LEGAL_V1.effectiveDate}
    sections={PRIVACY_V1}
  />;
}
