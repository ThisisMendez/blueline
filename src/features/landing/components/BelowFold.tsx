import { CHECKLIST_TOPIC_IDS, type ChecklistTopicId } from "@/features/analysis/checklist";

const topicLabels = {
  "deposit-deductions-and-return": "Deposit returns and deductions",
  "early-exit-costs": "Costs of leaving early",
  "rent-changes": "Rent changes",
  repairs: "Repairs and maintenance",
  "access-to-the-home": "When the landlord can enter",
  "dispute-routes": "How disputes are handled",
} satisfies Record<ChecklistTopicId, string>;

export function BelowFold() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-14 md:gap-20">
      <section
        id="features"
        tabIndex={-1}
        aria-labelledby="features-heading"
        className="grid scroll-mt-6 gap-6 border-y-2 border-[var(--color-navy)] py-8 md:grid-cols-[1fr_1.5fr] md:items-start md:gap-10"
      >
        <div>
          <h2
            id="features-heading"
            className="font-[family-name:var(--font-display)] text-3xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-4xl"
          >
            What We Check
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--color-navy-ink)]">
            We look for these six topics in your lease. If a topic is missing,
            your report marks it as &ldquo;Not found&rdquo; in the checklist.
          </p>
        </div>
        <ul className="grid list-disc gap-x-8 gap-y-3 border border-[var(--color-navy)] bg-[var(--color-paper-deep)] py-5 pr-5 pl-9 text-base text-[var(--color-navy-ink)] marker:text-[var(--color-navy)] sm:grid-cols-2 sm:gap-y-4">
          {CHECKLIST_TOPIC_IDS.map((id) => (
            <li key={id}>{topicLabels[id]}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="proposed-edits-heading" className="mx-auto w-full max-w-4xl">
        <h2
          id="proposed-edits-heading"
          className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-3xl"
        >
          A Suggested Edit for Each Flag
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-navy-ink)]">
          See what you could ask your landlord to change.
        </p>
        <div className="mt-5 border-l-4 border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-5 sm:p-6">
          <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-navy)]">
            Suggested wording for leaving early
          </p>
          <blockquote className="mt-2 text-base leading-relaxed text-[var(--color-navy-ink)]">
            &ldquo;If the tenant moves out early, rent is due until a new
            tenant starts paying rent or the lease ends, whichever comes
            first.&rdquo;
          </blockquote>
          <p className="mt-3 border-t border-[var(--color-navy)]/30 pt-3 text-sm text-[var(--color-navy-ink)]">
            You could still owe rent while the unit is empty.
          </p>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-2">
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
            Sign in to edit your personal red-line list and rerun the review.
            Preference matches stay separate from general risk flags.
          </p>
          <p className="mt-3 font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]">
            &ldquo;I need to be able to leave within 3 months if my job
            requires it.&rdquo;
          </p>
          <p className="mt-3 border-t border-[var(--color-navy)]/30 pt-3 font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]">
            <span className="inline-block bg-[var(--color-red-ink)] px-1.5 py-0.5 font-[family-name:var(--font-data)] text-xs font-bold uppercase text-[var(--color-paper)]">
              Preference match
            </span>{" "}
            — the example clause could make it costly to leave early.
          </p>
        </div>
      </div>
    </div>
  );
}
