import { InView } from "./InView";

/**
 * Three more specimen plates, each demonstrating one more capability the
 * hero didn't — coverage checklist, counter-offer, and document-grounded
 * Q&A plus red lines. Deliberately varied in scale and layout so the page
 * doesn't repeat the hero's card as a template three times.
 */
export function BelowFold() {
  return (
    <div className="flex flex-col gap-20 md:gap-28">
      {/* Coverage checklist: not-found items are explicitly NOT risk flags */}
      <InView className="mx-auto grid w-full max-w-4xl gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-start">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-3xl">
            Absence gets reported too, separately from risk.
          </h2>
          <p className="mt-4 font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]/85">
            Blueline Redline checks your complete agreement against a
            published list of six protections: deposit return, early-exit
            costs, rent changes, repairs, access, and dispute routes. The same
            six for every lease. Anything your document doesn&apos;t state gets
            reported apart from the risk flags, because there is no sentence to
            quote for it.
          </p>
        </div>
        <ul className="flex flex-col gap-3 border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-6">
          <li className="flex items-baseline gap-3 font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]">
            <span aria-hidden="true" className="text-[var(--color-navy)]">
              ✓
            </span>
            Deposit deductions and return — stated in Section 6
          </li>
          <li className="flex items-baseline gap-3 font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]">
            <span aria-hidden="true" className="text-[var(--color-navy)]">
              ✓
            </span>
            Repairs and maintenance — stated in Section 11
          </li>
          <li className="flex flex-col gap-1 border-2 border-dashed border-[var(--color-navy)] px-3 py-2">
            <span className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-navy)]">
              Not found
            </span>
            <span className="font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]">
              Dispute routes — not stated anywhere in the packet you gave us
            </span>
          </li>
        </ul>
      </InView>

      {/* Counter-offer: current clause -> proposed edit, residual risk shown */}
      <InView className="mx-auto w-full max-w-3xl">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-3xl">
          Every flag opens onto a proposed edit.
        </h2>
        <p className="mt-4 font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]/85">
          A plausible compromise a landlord might actually accept, with
          whatever risk would still remain if they said yes.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          <div className="border-2 border-[var(--color-navy)] bg-[var(--color-paper)] p-5">
            <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-navy)]">
              1 · As written
            </p>
            <p className="mt-2 font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)]">
              &ldquo;...liable for the full remaining balance of rent...
              regardless of whether Landlord re-rents the unit.&rdquo;
            </p>
          </div>
          <div className="border-2 border-[var(--color-navy)] bg-[var(--color-paper)] p-5 shadow-[0_24px_46px_-22px_rgba(18,59,93,0.5),0_8px_18px_-12px_rgba(18,59,93,0.32)] sm:ml-8">
            <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-navy)]">
              2 · Proposed edit
            </p>
            <p className="mt-2 font-[family-name:var(--font-body)] text-base text-[var(--color-navy-ink)]">
              &ldquo;...liable for rent only until Landlord re-rents the unit
              or the lease term ends, whichever comes first.&rdquo;
            </p>
            <p className="mt-3 border-t border-[var(--color-navy)]/30 pt-3 font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]/75">
              Residual risk: you may still owe a reasonable re-renting fee,
              which this draft doesn&apos;t address.
            </p>
          </div>
        </div>
      </InView>

      {/* Q&A + red lines */}
      <InView className="mx-auto grid w-full max-w-4xl gap-8 md:grid-cols-2">
        <div className="border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-6">
          <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-navy)]">
            Ask the document
          </p>
          <p className="mt-3 font-[family-name:var(--font-body)] text-sm italic text-[var(--color-navy-ink)]">
            &ldquo;Can I have a roommate take over my lease?&rdquo;
          </p>
          <p className="mt-3 font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]">
            The agreement doesn&apos;t answer this. Reassignment isn&apos;t
            mentioned anywhere in the text you gave us.
          </p>
        </div>
        <div className="border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-6">
          <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-navy)]">
            Your red lines
          </p>
          <p className="mt-3 font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]">
            &ldquo;I need to be able to leave within 3 months if my job
            requires it.&rdquo;
          </p>
          <p className="mt-3 border-t border-[var(--color-navy)]/30 pt-3 font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]">
            <span className="inline-block bg-[var(--color-red-ink)] px-1.5 py-0.5 font-[family-name:var(--font-data)] text-xs font-bold uppercase text-[var(--color-paper)]">
              Preference match
            </span>{" "}
            — the early-termination clause above conflicts with this.
          </p>
        </div>
      </InView>
    </div>
  );
}
