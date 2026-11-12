import { BelowFold } from "@/features/landing/components/BelowFold";
import { BrandHero } from "@/features/landing/components/BrandHero";
import { Footer } from "@/features/landing/components/Footer";
import { Nav } from "@/features/landing/components/Nav";
import { ReviewToolbar } from "@/features/landing/components/ReviewToolbar";
import { SpecimenHero } from "@/features/landing/components/SpecimenHero";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <BrandHero />

        <section
          id="how-it-works"
          tabIndex={-1}
          aria-labelledby="how-it-works-heading"
          className="scroll-mt-6 px-6 pt-14 pb-14 sm:px-10 md:pt-16 md:pb-20"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 max-w-2xl">
              <h2
                id="how-it-works-heading"
                className="font-[family-name:var(--font-display)] text-3xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-4xl"
              >
                How It Works
              </h2>
              <p className="mt-3 text-base leading-relaxed text-[var(--color-navy-ink)]">
                Paste your lease or upload a PDF with selectable text. We show
                the exact words we flag, why they matter, and what you could
                ask to change.
              </p>
            </div>
            <SpecimenHero />
          </div>
        </section>

        <div className="px-6 pb-14 sm:px-10 md:pb-20">
          <BelowFold />
        </div>

        <div className="px-6 pb-14 sm:px-10 md:pb-20">
          <ReviewToolbar />
        </div>
      </main>
      <Footer />
    </>
  );
}
