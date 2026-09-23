const reviewTypes = [
  { label: "Rental agreements", icon: "⌂" },
  { label: "Move-in addenda", icon: "▤" },
  { label: "Lease renewals", icon: "↻" },
  { label: "Guarantor terms", icon: "⌁" },
] as const;

/** A compact rental-packet index, kept honest to the first version's scope. */
export function ReviewToolbar() {
  return (
    <section
      aria-labelledby="review-toolbar-heading"
      className="mx-auto max-w-6xl border-y-2 border-[var(--color-navy)] py-5 sm:py-6"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-8">
        <div className="shrink-0 lg:border-r lg:border-[var(--color-navy)] lg:pr-8">
          <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-red-ink)]">
            First version
          </p>
          <h2
            id="review-toolbar-heading"
            className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[var(--color-navy-ink)] sm:text-4xl"
          >
            What you can review
          </h2>
        </div>
        <ul className="grid flex-1 grid-cols-2 gap-y-4 sm:grid-cols-4 sm:gap-0">
          {reviewTypes.map((type, index) => (
            <li
              key={type.label}
              className={`flex items-center gap-3 px-2 sm:px-5 ${index > 0 ? "sm:border-l sm:border-[var(--color-navy)]" : ""}`}
            >
              <span
                aria-hidden="true"
                className="font-[family-name:var(--font-display)] text-2xl leading-none text-[var(--color-navy)]"
              >
                {type.icon}
              </span>
              <span className="font-[family-name:var(--font-data)] text-xs font-bold uppercase leading-snug tracking-wide text-[var(--color-navy)]">
                {type.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-5 border-t border-[var(--color-navy)] pt-3 font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.14em] text-[var(--color-navy)]/75">
        Blueline Redline / exact source sentences / clearer signing decisions
      </p>
    </section>
  );
}
