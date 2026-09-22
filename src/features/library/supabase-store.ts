import type { SupabaseClient } from "@supabase/supabase-js";

import { flagId } from "@/features/analysis/verify";
import {
  CLEAN_REVIEW_STATEMENT,
  rankFlags,
  type RiskFlag,
  type Severity,
} from "@/features/analysis/types";
import { createServerSupabaseClient } from "@/features/auth/server-client";
import type { ExtractedDocument } from "@/features/packet/types";

import {
  type ReviewStore,
  type StoredReview,
  type StoredReviewSummary,
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
  source_document_id: string;
  source_start: number;
  source_end: number;
}

export class SupabaseReviewStore implements ReviewStore {
  constructor(private readonly client: SupabaseClient) {}

  async save(review: StoredReview): Promise<void> {
    const reviewInsert = await this.client.from("reviews").insert({
      id: review.id,
      user_id: review.signerId,
      created_at: review.createdAt,
      summary: review.review.summary,
      clean: review.review.clean,
      dropped_flag_count: review.review.droppedFlagCount,
    });
    if (reviewInsert.error) throw new Error(reviewInsert.error.message);

    const documents = review.documents.map((document, position) => ({
      review_id: review.id,
      user_id: review.signerId,
      document_id: document.id,
      title: document.title,
      extracted_text: document.text,
      position,
    }));
    if (documents.length > 0) {
      const documentInsert = await this.client.from("review_documents").insert(documents);
      if (documentInsert.error) throw new Error(documentInsert.error.message);
    }

    const flags = review.review.riskFlags.map((flag, rank) => ({
      review_id: review.id,
      user_id: review.signerId,
      rank,
      severity: flag.severity,
      consequence: flag.consequence,
      triggering_condition: flag.triggeringCondition,
      source_document_id: flag.sourceDocumentId,
      source_start: flag.sourceStart,
      source_end: flag.sourceEnd,
    }));
    if (flags.length > 0) {
      const flagInsert = await this.client.from("review_flags").insert(flags);
      if (flagInsert.error) throw new Error(flagInsert.error.message);
    }
  }

  async findForSigner(signerId: string, reviewId: string): Promise<StoredReview | null> {
    const reviewResult = await this.client
      .from("reviews")
      .select("id, user_id, created_at, summary, clean, dropped_flag_count")
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

    const flagResult = await this.client
      .from("review_flags")
      .select(
        "severity, consequence, triggering_condition, source_document_id, source_start, source_end",
      )
      .eq("review_id", reviewId)
      .eq("user_id", signerId)
      .order("rank", { ascending: true });
    if (flagResult.error) throw new Error(flagResult.error.message);
    const flagRows = (flagResult.data ?? []) as FlagRow[];

    const documents: ExtractedDocument[] = documentRows.map((document) => ({
      id: document.document_id,
      title: document.title,
      text: document.extracted_text,
    }));

    const textById = new Map(documents.map((document) => [document.id, document.text]));
    const riskFlags: RiskFlag[] = [];
    for (const flag of flagRows) {
      const text = textById.get(flag.source_document_id);
      // No text, no citation, no flag. An uncitable flag is never shown.
      if (text === undefined) continue;
      riskFlags.push({
        id: flagId(flag.source_document_id, flag.source_start, flag.source_end),
        severity: flag.severity,
        consequence: flag.consequence,
        triggeringCondition: flag.triggering_condition,
        sourceSentence: text.slice(flag.source_start, flag.source_end),
        sourceDocumentId: flag.source_document_id,
        sourceStart: flag.source_start,
        sourceEnd: flag.source_end,
      });
    }

    const ranked = rankFlags(riskFlags);
    const clean = ranked.length === 0;

    return {
      id: row.id,
      signerId: row.user_id,
      createdAt: row.created_at,
      documents,
      review: {
        summary: row.summary,
        riskFlags: ranked,
        clean,
        cleanStatement: clean ? CLEAN_REVIEW_STATEMENT : null,
        droppedFlagCount: row.dropped_flag_count,
      },
    };
  }

  async listForSigner(signerId: string): Promise<readonly StoredReviewSummary[]> {
    const result = await this.client
      .from("reviews")
      .select("id, created_at, clean, review_documents(title, position), review_flags(rank)")
      .eq("user_id", signerId)
      .order("created_at", { ascending: false });
    if (result.error) throw new Error(result.error.message);

    const rows = (result.data ?? []) as Array<{
      id: string;
      created_at: string;
      clean: boolean;
      review_documents: Array<{ title: string; position: number }>;
      review_flags: Array<{ rank: number }>;
    }>;

    return rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      title:
        [...row.review_documents].sort((left, right) => left.position - right.position)[0]
          ?.title ?? "Untitled review",
      flagCount: row.review_flags.length,
      clean: row.clean,
    }));
  }
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
