import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

// The checklist as published today: rows are read back against this list,
// so the review shows the topics the product publishes now, in that order.
import { COVERAGE_CHECKLIST } from "@/features/analysis/checklist";
import { flagId } from "@/features/analysis/verify";
import {
  CLEAN_REVIEW_STATEMENT,
  rankFlags,
  type CoverageItem,
  type RiskFlag,
  type Severity,
} from "@/features/analysis/types";
import { createServerSupabaseClient } from "@/features/auth/server-client";
import type { ExtractedDocument } from "@/features/packet/types";

import {
  ReviewNeedsRerunError,
  type ReviewStore,
  type StoredReview,
  type StoredReviewSummary,
  type NewReview,
  type ReviewRetention,
} from "./store";

/**
 * The Postgres implementation of the persistence port.
 *
 * Two things about its shape are deliberate.
 *
 * Extracted text lives in `review_documents`, apart from the review record,
 * so ticket 08 can delete the text on expiry and show that it is gone.
 *
 * A flag row stores offsets, not the sentence. The sentence a signer reads is
 * cut from the document's extracted text on the way out, exactly as it is
 * when the review is first produced. Deleting the text therefore deletes
 * every quotation of it, with no copies left behind in the flag rows.
 */

interface ReviewRow {
  id: string;
  user_id: string;
  created_at: string;
  saved_at: string | null;
  expires_at: string;
  summary: string;
  clean: boolean;
  dropped_flag_count: number;
}

interface DocumentRow {
  document_id: string;
  title: string;
  extracted_text: string;
  position: number;
}

interface FlagRow {
  severity: Severity;
  consequence: string;
  triggering_condition: string;
  counter_offer: string | null;
  residual_risk: string | null;
  source_document_id: string;
  source_start: number;
  source_end: number;
}

interface ChecklistRow {
  topic_id: string;
  status: "found" | "not-found";
  source_document_id: string | null;
  source_start: number | null;
  source_end: number | null;
}

export class SupabaseReviewStore implements ReviewStore {
  constructor(private readonly client: SupabaseClient) {}

  async save(review: NewReview): Promise<ReviewRetention> {
    const documents = review.documents.map((document, position) => ({
      document_id: document.id,
      title: document.title,
      extracted_text: document.text,
      position,
    }));
    const flags = review.review.riskFlags.map((flag, rank) => ({
      rank,
      severity: flag.severity,
      consequence: flag.consequence,
      triggering_condition: flag.triggeringCondition,
      counter_offer: flag.counterOffer,
      residual_risk: flag.residualRisk,
      source_document_id: flag.sourceDocumentId,
      source_start: flag.sourceStart,
      source_end: flag.sourceEnd,
    }));
    // A found topic stores offsets, as a flag does; a not-found item stores
    // three nulls, because there is nothing it could store instead.
    const topics = review.review.coverage.items.map((item, position) => ({
      position,
      topic_id: item.topicId,
      status: item.status,
      source_document_id: item.status === "found" ? item.sourceDocumentId : null,
      source_start: item.status === "found" ? item.sourceStart : null,
      source_end: item.status === "found" ? item.sourceEnd : null,
    }));
    // One database transaction writes the complete review and assigns its
    // timestamps. Caller timestamps are deliberately not sent to the RPC.
    const result = await this.client.rpc("create_review", {
      p_signer_id: review.signerId,
      p_review: { id: review.id, summary: review.review.summary, clean: review.review.clean, dropped_flag_count: review.review.droppedFlagCount, documents, flags, topics },
    });
    if (result.error) throw new Error("The review could not be stored.");
    return retentionFromRow(result.data);
  }

  async retainForSigner(signerId: string, reviewId: string): Promise<ReviewRetention | null> {
    const result = await this.client.rpc("retain_review", { p_signer_id: signerId, p_review_id: reviewId });
    if (result.error) throw new Error("The review could not be saved for longer.");
    return result.data === null ? null : retentionFromRow(result.data);
  }

  async findForSigner(signerId: string, reviewId: string): Promise<StoredReview | null> {
    const reviewResult = await this.client
      .from("reviews")
      .select("id, user_id, created_at, saved_at, expires_at, summary, clean, dropped_flag_count")
      .eq("id", reviewId)
      .eq("user_id", signerId)
      .maybeSingle();
    if (reviewResult.error) throw new Error(reviewResult.error.message);
    if (!reviewResult.data) return null;
    const row = reviewResult.data as ReviewRow;

    const documentResult = await this.client
      .from("review_documents")
      .select("document_id, title, extracted_text, position")
      .eq("review_id", reviewId)
      .eq("user_id", signerId)
      .order("position", { ascending: true });
    if (documentResult.error) throw new Error(documentResult.error.message);
    const documentRows = (documentResult.data ?? []) as DocumentRow[];
    if (documentRows.length === 0 || documentRows.some((document) => !document.extracted_text.trim())) {
      throw new Error("Stored agreement text is incomplete.");
    }

    const flagResult = await this.client
      .from("review_flags")
      .select(
        "severity, consequence, triggering_condition, counter_offer, residual_risk, source_document_id, source_start, source_end",
      )
      .eq("review_id", reviewId)
      .eq("user_id", signerId)
      .order("rank", { ascending: true });
    if (flagResult.error) throw new Error(flagResult.error.message);
    const flagRows = (flagResult.data ?? []) as FlagRow[];

    const topicResult = await this.client
      .from("review_checklist_topics")
      .select("topic_id, status, source_document_id, source_start, source_end")
      .eq("review_id", reviewId)
      .eq("user_id", signerId)
      .order("position", { ascending: true });
    if (topicResult.error) throw new Error(topicResult.error.message);
    const topicRows = (topicResult.data ?? []) as ChecklistRow[];

    const documents: ExtractedDocument[] = documentRows.map((document) => ({
      id: document.document_id,
      title: document.title,
      text: document.extracted_text,
    }));

    const textById = new Map(documents.map((document) => [document.id, document.text]));
    const riskFlags: RiskFlag[] = [];
    for (const flag of flagRows) {
      if (!flag.counter_offer?.trim() || !flag.residual_risk?.trim()) {
        throw new ReviewNeedsRerunError();
      }
      const text = textById.get(flag.source_document_id);
      if (!validCitation(text, flag.source_start, flag.source_end)) {
        throw new Error("Stored risk citation is incomplete.");
      }
      riskFlags.push({
        id: flagId(flag.source_document_id, flag.source_start, flag.source_end),
        severity: flag.severity,
        consequence: flag.consequence,
        triggeringCondition: flag.triggering_condition,
        counterOffer: flag.counter_offer,
        residualRisk: flag.residual_risk,
        sourceSentence: text!.slice(flag.source_start, flag.source_end),
        sourceDocumentId: flag.source_document_id,
        sourceStart: flag.source_start,
        sourceEnd: flag.source_end,
      });
    }

    const ranked = rankFlags(riskFlags);
    const clean = ranked.length === 0 && row.clean && row.dropped_flag_count === 0;
    if (ranked.length === 0 && !clean) {
      throw new Error("Stored review cannot establish a clean result.");
    }

    const storedTopics = new Map(topicRows.map((topic) => [topic.topic_id, topic]));
    if (topicRows.length !== COVERAGE_CHECKLIST.length || storedTopics.size !== COVERAGE_CHECKLIST.length) {
      throw new Error("Stored coverage checklist is incomplete.");
    }
    const items: CoverageItem[] = [];
    for (const topic of COVERAGE_CHECKLIST) {
      const stored = storedTopics.get(topic.id);
      if (!stored) throw new Error("Stored coverage checklist is incomplete.");
      if (stored.status === "not-found") {
        if (stored.source_document_id !== null || stored.source_start !== null || stored.source_end !== null) {
          throw new Error("Stored absence has unexpected citation fields.");
        }
        items.push({ status: "not-found", topicId: topic.id });
        continue;
      }
      if (stored.status !== "found" || stored.source_document_id === null || stored.source_start === null || stored.source_end === null) {
        throw new Error("Stored coverage citation is incomplete.");
      }
      const text = textById.get(stored.source_document_id);
      if (!validCitation(text, stored.source_start, stored.source_end)) {
        throw new Error("Stored coverage citation is incomplete.");
      }
      items.push({
        status: "found",
        topicId: topic.id,
        sourceSentence: text!.slice(stored.source_start, stored.source_end),
        sourceDocumentId: stored.source_document_id,
        sourceStart: stored.source_start,
        sourceEnd: stored.source_end,
      });
    }
    return {
      id: row.id,
      signerId: row.user_id,
      ...retentionFromRow(row),
      documents,
      review: {
        summary: row.summary,
        riskFlags: ranked,
        coverage: { items },
        clean,
        cleanStatement: clean ? CLEAN_REVIEW_STATEMENT : null,
        droppedFlagCount: row.dropped_flag_count,
      },
    };
  }

  async listForSigner(signerId: string): Promise<readonly StoredReviewSummary[]> {
    const result = await this.client
      .from("reviews")
      .select("id, created_at, saved_at, expires_at, clean, review_documents!review_documents_owner_fk(title, position), review_flags!review_flags_owner_fk(rank)")
      .eq("user_id", signerId)
      .order("created_at", { ascending: false });
    if (result.error) throw new Error(result.error.message);

    const rows = (result.data ?? []) as Array<{
      id: string;
      created_at: string;
      saved_at: string | null;
      expires_at: string;
      clean: boolean;
      review_documents: Array<{ title: string; position: number }>;
      review_flags: Array<{ rank: number }>;
    }>;

    return rows.map((row) => ({
      id: row.id,
      ...retentionFromRow(row),
      title:
        [...row.review_documents].sort((left, right) => left.position - right.position)[0]
          ?.title ?? "Untitled review",
      flagCount: row.review_flags.length,
      clean: row.clean,
    }));
  }
}

const timestamp = z.string().refine((value) => Number.isFinite(Date.parse(value)));
const retentionRowSchema = z.object({ created_at: timestamp, saved_at: timestamp.nullable(), expires_at: timestamp });
function retentionFromRow(value: unknown): ReviewRetention {
  const row = retentionRowSchema.parse(value);
  return { createdAt: row.created_at, savedAt: row.saved_at, expiresAt: row.expires_at };
}

function validCitation(text: string | undefined, start: number, end: number): boolean {
  return text !== undefined && Number.isInteger(start) && Number.isInteger(end)
    && start >= 0 && end > start && end <= text.length;
}

/**
 * Opens the persistence port for this request, or returns null when accounts
 * are not configured. Called inside a request, never at module scope.
 */
export async function openReviewStore(): Promise<ReviewStore | null> {
  const client = await createServerSupabaseClient();
  if (!client) return null;
  return new SupabaseReviewStore(client);
}
