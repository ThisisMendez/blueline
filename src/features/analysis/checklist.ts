/**
 * The published coverage checklist (ADR 0008).
 *
 * Six topics, fixed, the same for every lease. They live here as data rather
 * than as a sentence in a prompt, because the model is asked about this list
 * and never about a list of its own: the prompt is rendered from this array,
 * the structured-output schema is built from these ids, and a topic id that
 * is not in this array is discarded before anything reaches the signer.
 *
 * "Published" means the signer reads the whole list — the name and the plain
 * description of every topic, found or not — rather than only the ones that
 * were missing.
 */

/** The topic ids, in the order the product lists them. */
export const CHECKLIST_TOPIC_IDS = [
  "deposit-deductions-and-return",
  "early-exit-costs",
  "rent-changes",
  "repairs",
  "access-to-the-home",
  "dispute-routes",
] as const;

export type ChecklistTopicId = (typeof CHECKLIST_TOPIC_IDS)[number];

/** One published topic: its id, what the signer sees it called, what it means. */
export interface ChecklistTopic {
  readonly id: ChecklistTopicId;
  /** The name on screen. */
  readonly name: string;
  /** One line telling the signer what this topic covers. */
  readonly description: string;
}

/** The checklist itself, in published order. */
export const COVERAGE_CHECKLIST: readonly ChecklistTopic[] = [
  {
    id: "deposit-deductions-and-return",
    name: "Deposit deductions and return",
    description:
      "What the landlord can take out of your deposit, and when the rest comes back.",
  },
  {
    id: "early-exit-costs",
    name: "Early-exit costs",
    description: "What you owe if you leave before the term is up.",
  },
  {
    id: "rent-changes",
    name: "Rent changes",
    description:
      "Whether the rent can change during the term or after it, and by how much.",
  },
  {
    id: "repairs",
    name: "Repairs",
    description: "Who fixes what, and who pays for it.",
  },
  {
    id: "access-to-the-home",
    name: "Access to the home",
    description: "When the landlord can come in, and how much notice you get.",
  },
  {
    id: "dispute-routes",
    name: "Dispute routes",
    description: "Where a disagreement gets settled, and which routes stay open.",
  },
];

const BY_ID: ReadonlyMap<string, ChecklistTopic> = new Map(
  COVERAGE_CHECKLIST.map((topic) => [topic.id, topic]),
);

/** True when a string the model returned is one of the published topic ids. */
export function isChecklistTopicId(value: string): value is ChecklistTopicId {
  return BY_ID.has(value);
}

/** The published topic with this id, or null when the id is not published. */
export function checklistTopic(id: string): ChecklistTopic | null {
  return BY_ID.get(id) ?? null;
}
