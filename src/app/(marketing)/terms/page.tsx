import type { Metadata } from "next";

import { TERMS_V1 } from "@/features/site/legal-content";
import { LegalPolicy } from "@/features/site/LegalPolicy";
import { CURRENT_LEGAL } from "@/features/site/policy-versions";

export const metadata: Metadata = {
  title: "Terms of Use",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <LegalPolicy
    title="Terms of Use"
    version={CURRENT_LEGAL.termsVersion}
    effectiveDate={CURRENT_LEGAL.effectiveDate}
    sections={TERMS_V1}
    versionPath={CURRENT_LEGAL.termsPath}
  />;
}
