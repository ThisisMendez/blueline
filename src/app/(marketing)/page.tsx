import type { Metadata } from "next";

import { BelowFold } from "@/features/landing/components/BelowFold";
import { BrandHero } from "@/features/landing/components/BrandHero";
import { HowItWorks } from "@/features/landing/components/HowItWorks";
import { ReviewToolbar } from "@/features/landing/components/ReviewToolbar";
import { SampleReportLinks } from "@/features/landing/components/SampleReportLinks";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main id="main" tabIndex={-1} className="flex-1">
      <BrandHero />
      <HowItWorks />

      <div className="px-6 pt-6 pb-6 sm:px-10 md:pb-8">
        <div className="mx-auto max-w-6xl">
          <SampleReportLinks />
        </div>
      </div>

      <div className="px-6 pb-6 sm:px-10 md:pb-8">
        <BelowFold />
      </div>

      <div className="px-6 pb-6 sm:px-10 md:pb-8">
        <ReviewToolbar />
      </div>
    </main>
  );
}
