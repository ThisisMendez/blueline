import Link from "next/link";

export function SampleReportLinks() {
  return (
    <section id="sample-report" tabIndex={-1} aria-labelledby="sample-report-heading" className="scroll-mt-6 border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-4 sm:p-5">
      <h3 id="sample-report-heading" className="font-[family-name:var(--font-display)] text-xl font-bold">
        Sample reports
      </h3>
      <p className="mt-1 text-sm">See the same fictional lease from either side.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Link href="/sample-report/renter" className="border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-3 py-2 hover:bg-[var(--color-paper-deep)]">
          <span className="block font-bold">Renter sample</span>
          <span className="text-sm">Pick issues to raise and draft an email.</span>
        </Link>
        <Link href="/sample-report/landlord" className="border-2 border-[var(--color-navy)] bg-[var(--color-paper)] px-3 py-2 hover:bg-[var(--color-paper-deep)]">
          <span className="block font-bold">Landlord sample</span>
          <span className="text-sm">See what to clarify and edit suggested wording.</span>
        </Link>
      </div>
    </section>
  );
}
