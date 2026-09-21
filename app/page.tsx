import { BelowFold } from "@/components/landing/BelowFold";
import { FieldNotes } from "@/components/landing/FieldNotes";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { SpecimenHero } from "@/components/landing/SpecimenHero";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <section className="px-6 pt-12 pb-16 sm:px-10 sm:pt-16 md:pt-20">
          <div className="mx-auto max-w-6xl">
            <SpecimenHero />
            <p className="mx-auto mt-8 max-w-2xl text-center font-[family-name:var(--font-body)] text-lg leading-relaxed text-[var(--color-navy-ink)]/85 sm:text-xl">
              This is what a risky sentence looks like once Blueline Redline
              finds it. Paste your lease and see your own.
            </p>
          </div>
        </section>

        <section className="px-6 pb-20 sm:px-10 md:pb-28">
          <BelowFold />
        </section>

        <FieldNotes />
      </main>
      <Footer />
    </>
  );
}
