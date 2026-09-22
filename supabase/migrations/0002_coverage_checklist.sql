-- 0002_coverage_checklist.sql
--
-- Stores how one review answered the published coverage checklist: one row
-- per topic, found or not found.
--
-- The table keeps absence and citation apart the way the application types
-- do. A found row carries a document id and character offsets, and never the
-- sentence itself: the sentence is cut from review_documents.extracted_text
-- when the review is read, so deleting that text deletes every quotation of
-- it (ticket 08). A not-found row carries three nulls, and the check
-- constraint below makes any other combination impossible to insert — there
-- is nowhere in this table to attach a quotation to an absence.
--
-- Severity is absent on purpose. A not-found item is not a risk flag and
-- never ranks among them, so there is no column here that could rank one.
--
-- NOT APPLIED. No Supabase project exists for this build yet. Run this by
-- hand (or with `supabase db push`) once one does, after 0001_reviews.sql.

create table if not exists public.review_checklist_topics (
  id                 uuid primary key default gen_random_uuid(),
  review_id          uuid not null references public.reviews (id) on delete cascade,
  user_id            uuid not null references auth.users (id) on delete cascade,
  position           integer not null,
  topic_id           text not null check (topic_id in (
    'deposit-deductions-and-return', 'early-exit-costs', 'rent-changes',
    'repairs', 'access-to-the-home', 'dispute-routes'
  )),
  status             text not null check (status in ('found', 'not-found')),
  source_document_id text,
  source_start       integer check (source_start >= 0),
  source_end         integer check (source_end > source_start),
  unique (review_id, topic_id),
  constraint review_checklist_topics_citation_matches_status check (
    (
      status = 'found'
      and source_document_id is not null
      and source_start is not null
      and source_end is not null
    )
    or (
      status = 'not-found'
      and source_document_id is null
      and source_start is null
      and source_end is null
    )
  )
);

create index if not exists review_checklist_topics_review_id_position_idx
  on public.review_checklist_topics (review_id, position);
create index if not exists review_checklist_topics_user_id_idx
  on public.review_checklist_topics (user_id);

alter table public.review_checklist_topics enable row level security;

drop policy if exists "Signers can read their own checklist topics." on public.review_checklist_topics;
create policy "Signers can read their own checklist topics."
  on public.review_checklist_topics for select to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "Signers can store their own checklist topics." on public.review_checklist_topics;
create policy "Signers can store their own checklist topics."
  on public.review_checklist_topics for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.reviews
      where reviews.id = review_checklist_topics.review_id
        and reviews.user_id = (select auth.uid())
    )
  );

drop policy if exists "Signers can update their own checklist topics." on public.review_checklist_topics;
create policy "Signers can update their own checklist topics."
  on public.review_checklist_topics for update to authenticated
  using ( (select auth.uid()) = user_id )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.reviews
      where reviews.id = review_checklist_topics.review_id
        and reviews.user_id = (select auth.uid())
    )
  );

drop policy if exists "Signers can delete their own checklist topics." on public.review_checklist_topics;
create policy "Signers can delete their own checklist topics."
  on public.review_checklist_topics for delete to authenticated
  using ( (select auth.uid()) = user_id );
