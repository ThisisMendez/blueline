import { BelowFold } from "@/features/landing/components/BelowFold";
import { BrandHero } from "@/features/landing/components/BrandHero";
import { ReviewToolbar } from "@/features/landing/components/ReviewToolbar";
import { SpecimenHero } from "@/features/landing/components/SpecimenHero";

export default function Home() {
  return (
    <main id="main" className="flex-1">
        <BrandHero />

        <section
          id="how-it-works"
          tabIndex={-1}
          aria-labelledby="how-it-works-heading"
          className="scroll-mt-6 px-6 py-6 sm:px-10 md:pt-7 md:pb-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-4 max-w-2xl">
              <h2
                id="how-it-works-heading"
                className="font-[family-name:var(--font-display)] text-3xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-4xl"
              >
                How It Works
              </h2>
              <p className="mt-2 text-base leading-relaxed text-[var(--color-navy-ink)]">
                Upload your lease as a PDF with selectable text. We show
                the exact words we flag, why they matter, and what you could
                ask to change.
              </p>
              <p className="mt-2 text-base leading-relaxed text-[var(--color-navy-ink)]">
                Start by choosing renter or landlord. The review flags the
                clauses that could cost that side.
              </p>
            </div>
            <SpecimenHero />
          </div>
        </section>

        <div className="px-6 pb-6 sm:px-10 md:pb-8">
          <BelowFold />
        </div>

        <div className="px-6 pb-6 sm:px-10 md:pb-8">
          <ReviewToolbar />
        </div>
    </main>
  );
}
