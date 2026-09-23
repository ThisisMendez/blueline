import { BelowFold } from "@/features/landing/components/BelowFold";
import { BrandHero } from "@/features/landing/components/BrandHero";
import { Footer } from "@/features/landing/components/Footer";
import { LeaseGallery } from "@/features/landing/components/LeaseGallery";
import { Nav } from "@/features/landing/components/Nav";
import { ReviewToolbar } from "@/features/landing/components/ReviewToolbar";
import { SpecimenHero } from "@/features/landing/components/SpecimenHero";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <h1 className="visually-hidden">
          Blueline Redline reads a residential lease and shows you the exact
          sentence behind every risk it flags.
        </h1>
        <BrandHero />

        <section className="px-6 pt-14 pb-10 sm:px-10 sm:pt-16 md:pt-20">
          <div className="mx-auto max-w-6xl">
            <SpecimenHero />
            <p className="mx-auto mt-8 max-w-2xl text-center font-[family-name:var(--font-body)] text-lg leading-relaxed text-[var(--color-navy-ink)]/85 sm:text-xl">
              This is what a risky sentence looks like once Blueline Redline
              finds it. It reads your whole lease the same way.
            </p>
          </div>
        </section>

        <section className="px-6 pb-12 sm:px-10 md:pb-16">
          <ReviewToolbar />
        </section>

        <section className="px-6 pb-20 sm:px-10 md:pb-28">
          <LeaseGallery />
        </section>

        <section className="px-6 pb-20 sm:px-10 md:pb-28">
          <BelowFold />
        </section>
      </main>
      <Footer />
    </>
  );
}
