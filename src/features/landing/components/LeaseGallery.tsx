import Image from "next/image";

const tiles = [
  {
    index: "01",
    label: "Lease agreement",
    detail: "The terms behind the keys.",
    src: "/images/lease-and-keys.png",
    alt: "A rental agreement with a set of house keys.",
  },
  {
    index: "02",
    label: "Move-in addendum",
    detail: "The papers that come with the place.",
    src: "/images/apartment-entry.png",
    alt: "An open apartment door with move-in documents and keys on an entry table.",
  },
  {
    index: "03",
    label: "Renewal terms",
    detail: "What changes when the lease does.",
    src: "/images/marked-lease.png",
    alt: "A lease document marked with a blue underline and red margin mark.",
  },
  {
    index: "04",
    label: "Guarantor agreement",
    detail: "Who else is on the line.",
    src: "/images/renter-with-documents.png",
    alt: "A renter carrying lease documents and keys in an apartment hallway.",
  },
] as const;

/** A rental-first visual index; the images add context without claiming the
 * first version reviews contracts beyond residential lease packets. */
export function LeaseGallery() {
  return (
    <section
      aria-labelledby="rental-documents-heading"
      className="mx-auto max-w-6xl border-y-2 border-[var(--color-navy)] py-6 sm:py-8"
    >
      <div className="mb-5 flex items-end justify-between gap-6">
        <div>
          <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-red-ink)]">
            Rental packet, not just the lease
          </p>
          <h2
            id="rental-documents-heading"
            className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-3xl"
          >
            Read the documents around the decision.
          </h2>
        </div>
        <p className="hidden max-w-xs font-[family-name:var(--font-body)] text-sm leading-snug text-[var(--color-navy-ink)]/75 md:block">
          The first version starts with residential leases, renewals, and the
          documents they reference.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {tiles.map((tile) => (
          <article key={tile.index} className="group min-w-0">
            <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-paper-deep)]">
              <Image
                src={tile.src}
                alt={tile.alt}
                fill
                sizes="(min-width: 640px) 25vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="border-x-2 border-b-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-3 py-3">
              <p className="font-[family-name:var(--font-data)] text-xs font-bold text-[var(--color-red-ink)]">
                {tile.index}
              </p>
              <h3 className="mt-1 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-navy-ink)]">
                {tile.label}
              </h3>
              <p className="mt-1 hidden font-[family-name:var(--font-body)] text-sm leading-snug text-[var(--color-navy-ink)]/75 sm:block">
                {tile.detail}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
