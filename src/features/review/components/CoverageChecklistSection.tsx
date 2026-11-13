import { checklistTopic, type ChecklistTopic, type ChecklistTopicId } from "@/features/analysis/checklist";
import {
  foundTopics,
  notFoundItems,
  type CoverageChecklist,
  type FoundTopic,
  type ReviewRole,
} from "@/features/analysis/types";
import type { ExtractedDocument } from "@/features/packet/types";

/**
 * The published coverage checklist, on screen.
 *
 * All six topics, grouped by whether the lease addresses them. A not-found
 * item wears the system's reserved third state: a dashed navy border and the
 * words "Not found in the text reviewed", never a severity badge, never the
 * alert treatment, and no red anywhere in this section. Absence and risk are
 * different kinds of thing, so they do not look alike.
 *
 * Neither state is carried by colour or border alone: every item says in
 * words which one it is.
 */

export const FOUND_LABEL = "Found";
export const NOT_FOUND_LABEL = "Not found in the text reviewed";

const CLARIFICATION_QUESTIONS: Record<ChecklistTopicId, Record<ReviewRole, string>> = {
  "deposit-deductions-and-return": {
    renter: "When should I expect the deposit back, and what can be deducted?",
    landlord: "What deductions will we document, and when will we return the balance?",
  },
  "early-exit-costs": {
    renter: "What would I owe if I needed to move out early?",
    landlord: "What notice and charges would apply if the renter leaves early?",
  },
  "rent-changes": {
    renter: "When could the rent change, and how would I be told?",
    landlord: "What notice and limits should the lease set for rent changes?",
  },
  repairs: {
    renter: "Who should I contact about a repair, and who pays for it?",
    landlord: "How should the renter report repairs, and who pays for which work?",
  },
  "access-to-the-home": {
    renter: "How much notice will I get before the landlord needs to enter?",
    landlord: "What notice should I give before entering, and what counts as an emergency?",
  },
  "dispute-routes": {
    renter: "Where should I raise a disagreement if we cannot resolve it directly?",
    landlord: "What process should both parties use if direct discussion fails?",
  },
};

const STATUS =
  "shrink-0 px-1.5 py-0.5 font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-navy)]";
const TOPIC_NAME =
  "font-[family-name:var(--font-display)] text-base font-bold leading-snug text-[var(--color-navy-ink)]";
const SMALL =
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
    <article aria-labelledby={headingId} className="border-2 border-[var(--color-navy)] bg-[var(--color-paper)] p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={headingId} className={TOPIC_NAME}>
          {topic.name}
        </h3>
        <span className={`${STATUS} border-2 border-[var(--color-navy)]`}>{FOUND_LABEL}</span>
      </div>
      <p className={`mt-0.5 ${SMALL}`}>{topic.description}</p>
      <blockquote className="mt-2 border-l-2 border-[var(--color-navy)] pl-3 [overflow-wrap:anywhere] font-[family-name:var(--font-body)] text-sm leading-relaxed text-[var(--color-navy-ink)]">
        {item.sourceSentence}
      </blockquote>
      <p className="mt-1 pl-3 [overflow-wrap:anywhere] font-[family-name:var(--font-data)] text-xs leading-relaxed text-[var(--color-navy)]">
        From {documentTitle}
      </p>
    </article>
  );
}

function NotFoundCard({
  topic,
  role,
}: {
  readonly topic: ChecklistTopic;
  readonly role?: ReviewRole;
}) {
  const headingId = `coverage-${topic.id}-heading`;

  return (
    <article
      aria-labelledby={headingId}
      className="border-2 border-dashed border-[var(--color-navy)] bg-[var(--color-paper-deep)] p-3"
    >
      <h3 id={headingId} className={TOPIC_NAME}>
        {topic.name}
      </h3>
      <p className={`mt-0.5 ${SMALL}`}>{topic.description}</p>
      <p className={`mt-2 inline-block ${STATUS} border-2 border-dashed border-[var(--color-navy)]`}>{NOT_FOUND_LABEL}</p>
      {role ? <p className={`mt-2 ${SMALL}`}>You could ask: {CLARIFICATION_QUESTIONS[topic.id][role]}</p> : null}
    </article>
  );
}

export interface CoverageChecklistSectionProps {
  readonly coverage: CoverageChecklist;
  readonly documents: readonly ExtractedDocument[];
  readonly role?: ReviewRole;
}

export function CoverageChecklistSection({
  coverage,
  documents,
  role,
}: CoverageChecklistSectionProps) {
  if (coverage.items.length === 0) return null;

  const titleById = new Map(documents.map((document) => [document.id, document.title]));
  const absent = notFoundItems(coverage);
  const found = foundTopics(coverage);

  return (
    <section aria-labelledby="coverage-checklist-heading" className="flex flex-col gap-3">
      <div>
        <h2
          id="coverage-checklist-heading"
          className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-navy-ink)]"
        >
          Six topics we check
        </h2>
        <p className={`mt-1 ${SMALL}`}>
          {absent.length === 0
            ? "We found all 6 in your documents."
            : `We found ${found.length} of 6 in your documents.`}
        </p>
      </div>

      {found.length > 0 ? (
        <div className="space-y-2">
          <p id="coverage-found-label" className="font-semibold">What the lease spells out</p>
          <ul aria-labelledby="coverage-found-label" className="flex list-none flex-col gap-2 p-0">
            {found.map((item) => {
              const topic = checklistTopic(item.topicId);
              return topic ? (
                <li key={item.topicId}>
                  <FoundCard topic={topic} item={item} documentTitle={titleById.get(item.sourceDocumentId) ?? item.sourceDocumentId} />
                </li>
              ) : null;
            })}
          </ul>
        </div>
      ) : null}
      {absent.length > 0 ? (
        <div className="space-y-2">
          <p id="coverage-missing-label" className="font-semibold">What’s still open</p>
          <ul aria-labelledby="coverage-missing-label" className="flex list-none flex-col gap-2 p-0">
            {absent.map((item) => {
              const topic = checklistTopic(item.topicId);
              return topic ? <li key={item.topicId}><NotFoundCard topic={topic} role={role} /></li> : null;
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
