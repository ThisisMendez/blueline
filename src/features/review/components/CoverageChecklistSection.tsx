import { checklistTopic, type ChecklistTopic } from "@/features/analysis/checklist";
import {
  notFoundItems,
  type CoverageChecklist,
  type CoverageItem,
  type FoundTopic,
  type NotFoundItem,
} from "@/features/analysis/types";
import type { ExtractedDocument } from "@/features/packet/types";

/**
 * The published coverage checklist, on screen.
 *
 * The signer reads the whole list — all six topics, what each one means, and
 * which of them this agreement addresses — rather than a list of complaints.
 * A not-found item wears the system's reserved third state: a 2px dashed
 * navy border and the words "Not found", never a severity badge, never the
 * alert treatment, and no red anywhere in this section. Absence and risk are
 * different kinds of thing, so they do not look alike.
 *
 * Neither state is carried by colour or border alone: every item says in
 * words which one it is, so the distinction survives a screen reader, a
 * greyscale print and a high-contrast mode.
 */

const FOUND_LABEL = "Found";
const NOT_FOUND_LABEL = "Not found";

/** What a not-found item says, and the whole of what it says. */
const NOT_FOUND_EXPLANATION =
  "We did not locate this topic in the complete agreement.";

const BADGE_BASE =
  "inline-block px-2 py-1 font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-navy)]";
const TOPIC_NAME =
  "font-[family-name:var(--font-display)] text-lg font-bold leading-tight text-[var(--color-navy-ink)]";
const TOPIC_DESCRIPTION =
  "font-[family-name:var(--font-body)] text-sm leading-relaxed text-[var(--color-navy-ink)]";

function FoundCard({
  topic,
  item,
  documentTitle,
}: {
  readonly topic: ChecklistTopic;
  readonly item: FoundTopic;
  readonly documentTitle: string;
}) {
  const headingId = `coverage-${topic.id}-heading`;

  return (
    <article
      aria-labelledby={headingId}
      className="border-2 border-[var(--color-navy)] bg-[var(--color-paper-deep)]"
    >
      <div className="flex flex-col gap-3 p-6 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 id={headingId} className={TOPIC_NAME}>
            {topic.name}
          </h3>
          <span className={`${BADGE_BASE} border-2 border-[var(--color-navy)]`}>
            {FOUND_LABEL}
          </span>
        </div>
        <p className={TOPIC_DESCRIPTION}>{topic.description}</p>
        <blockquote className="border-l-2 border-[var(--color-navy)] pl-4 font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
          {item.sourceSentence}
        </blockquote>
      </div>
      <p className="border-t-2 border-[var(--color-navy)] px-6 py-4 font-[family-name:var(--font-data)] text-xs uppercase tracking-wide text-[var(--color-navy)] sm:px-8">
        Source: {documentTitle}, characters {item.sourceStart} to {item.sourceEnd}
      </p>
    </article>
  );
}

function NotFoundCard({
  topic,
}: {
  readonly topic: ChecklistTopic;
  readonly item: NotFoundItem;
}) {
  const headingId = `coverage-${topic.id}-heading`;

  return (
    <article
      aria-labelledby={headingId}
      className="flex flex-col gap-3 border-2 border-dashed border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 id={headingId} className={TOPIC_NAME}>
          {topic.name}
        </h3>
        <span
          className={`${BADGE_BASE} border-2 border-dashed border-[var(--color-navy)]`}
        >
          {NOT_FOUND_LABEL}
        </span>
      </div>
      <p className={TOPIC_DESCRIPTION}>{topic.description}</p>
      <p className={TOPIC_DESCRIPTION}>{NOT_FOUND_EXPLANATION}</p>
    </article>
  );
}

export interface CoverageChecklistSectionProps {
  readonly coverage: CoverageChecklist;
  readonly documents: readonly ExtractedDocument[];
}

export function CoverageChecklistSection({
  coverage,
  documents,
}: CoverageChecklistSectionProps) {
  if (coverage.items.length === 0) return null;

  const titleById = new Map(documents.map((document) => [document.id, document.title]));
  const absent = notFoundItems(coverage);

  return (
    <section
      aria-labelledby="coverage-checklist-heading"
      className="flex flex-col gap-6"
    >
      <div>
        <h2
          id="coverage-checklist-heading"
          className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)] sm:text-3xl"
        >
          The six topics we check on every lease
        </h2>
        <p className="mt-3 max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
          We check these topics across every document you supplied. Found
          topics show their source sentence. Not-found items identify topics
          we did not locate.
        </p>
        <p className="mt-3 max-w-[var(--measure)] font-[family-name:var(--font-body)] text-base leading-relaxed text-[var(--color-navy-ink)]">
          {absent.length === 0
            ? "We located all six topics in your documents."
            : absent.length === 1
              ? "We did not locate one of the six topics."
              : `We did not locate ${absent.length} of the six topics.`}
        </p>
      </div>

      <ol className="flex list-none flex-col gap-4 p-0">
        {coverage.items.map((item: CoverageItem) => {
          const topic = checklistTopic(item.topicId);
          if (!topic) return null;

          return (
            <li key={item.topicId}>
              {item.status === "found" ? (
                <FoundCard
                  topic={topic}
                  item={item}
                  documentTitle={
                    titleById.get(item.sourceDocumentId) ?? item.sourceDocumentId
                  }
                />
              ) : (
                <NotFoundCard topic={topic} item={item} />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
