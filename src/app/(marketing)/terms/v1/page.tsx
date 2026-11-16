import type { Metadata } from "next";

import { TERMS_V1 } from "@/features/site/legal-content";
import { LegalPolicy } from "@/features/site/LegalPolicy";
import { LEGAL_V1 } from "@/features/site/policy-versions";

export const metadata: Metadata = {
  title: "Terms of Use, Version 1",
  robots: { index: false, follow: true },
};

export default function TermsVersionOnePage() {
  return <LegalPolicy
    title="Terms of Use"
    version={LEGAL_V1.termsVersion}
    effectiveDate={LEGAL_V1.effectiveDate}
    sections={TERMS_V1}
  />;
}
