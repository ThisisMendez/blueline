import { CHECKLIST_TOPIC_IDS, type ChecklistTopicId } from "@/features/analysis/checklist";

const topicLabels = {
  "deposit-deductions-and-return": "Deposit returns and deductions",
  "early-exit-costs": "Costs of leaving early",
  "rent-changes": "Rent changes",
  repairs: "Repairs and maintenance",
  "access-to-the-home": "When the landlord can enter",
  "dispute-routes": "How disputes are handled",
} satisfies Record<ChecklistTopicId, string>;

const topicIconPaths = {
  "deposit-deductions-and-return": "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6",
  "early-exit-costs": "M11 5H5v14h6m3-11 4 4-4 4m-5-4h9",
  "rent-changes": "M5 8h14m-4-4 4 4-4 4m4 4H5m4-4-4 4 4 4",
  repairs: "M14.5 5.5a4 4 0 0 0-5.1 5.1l-5.2 5.2a2 2 0 0 0 2.8 2.8l5.2-5.2a4 4 0 0 0 5.1-5.1l-2.7 2.7-2.8-2.8 2.7-2.7Z",
  "access-to-the-home": "M4 20h16M7 20V5h10v15m-3-7h.01",
  "dispute-routes": "M4 4h12v8H9l-4 3v-3H4V4Zm8 11h4l3 3v-3h1V8h-2",
} satisfies Record<ChecklistTopicId, string>;

export function BelowFold() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 md:gap-8">
      <section
        id="features"
        tabIndex={-1}
        aria-labelledby="features-heading"
        className="grid scroll-mt-6 gap-3 border-y-2 border-[var(--color-navy)] py-4 md:grid-cols-[1fr_1.5fr] md:items-start md:gap-10"
      >
        <div>
          <h2
            id="features-heading"
            className="font-[family-name:var(--font-display)] text-3xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-4xl"
          >
            What We Check
          </h2>
          <p className="mt-2 text-base leading-relaxed text-[var(--color-navy-ink)]">
            We look for these six topics in your lease. If a topic is missing,
            your report marks it as &ldquo;Not found&rdquo; in the checklist.
          </p>
        </div>
        <ul role="list" className="grid list-none gap-x-5 gap-y-3 border border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-4 text-sm text-[var(--color-navy-ink)] sm:grid-cols-2 lg:gap-y-4">
          {CHECKLIST_TOPIC_IDS.map((id) => (
            <li key={id} className="flex items-start gap-2.5">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5 shrink-0 text-[var(--color-navy)]"
              >
                <path d={topicIconPaths[id]} />
              </svg>
              {topicLabels[id]}
            </li>
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
        <p className="mt-2 text-base leading-relaxed text-[var(--color-navy-ink)]">
          A change you can discuss with the other party, with an explanation
          of what could still affect you if you agree to it.
        </p>
        <div className="mt-3 border-l-4 border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-3 sm:px-4">
          <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-navy)]">
            Suggested wording for leaving early
          </p>
          <blockquote className="mt-2 text-base leading-relaxed text-[var(--color-navy-ink)]">
            &ldquo;If the tenant moves out early, rent is due until a new
            tenant starts paying rent or the lease ends, whichever comes
            first.&rdquo;
          </blockquote>
          <p className="mt-2 border-t border-[var(--color-navy)]/30 pt-2 text-sm text-[var(--color-navy-ink)]">
            You could still owe rent while the unit is empty.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-4xl">
        <div className="border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)] px-4 py-3">
          <p className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-navy)]">
            Your red lines
          </p>
          <p className="mt-2 font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]">
            Sign in to edit your personal red-line list and rerun the review.
            Preference matches stay separate from general risk flags.
          </p>
          <p className="mt-2 font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]">
            &ldquo;I need to be able to leave within 3 months if my job
            requires it.&rdquo;
          </p>
          <p className="mt-2 border-t border-[var(--color-navy)]/30 pt-2 font-[family-name:var(--font-body)] text-sm text-[var(--color-navy-ink)]">
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
