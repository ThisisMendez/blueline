-- 0001_reviews.sql
--
-- Creates the three tables a lease review is stored in: the review record,
-- the extracted text of each document in the packet, and the verified risk
-- flags. Every table is owned by one signer and locked to that signer by
-- row-level security, so one signer cannot read another's lease text even if
-- application code asks for it.
--
-- Two shapes here are load-bearing rather than incidental:
--
--   * Extracted text lives in review_documents, apart from the review record,
--     so retention (ticket 08) can delete the text explicitly and show it is
--     gone.
--   * A flag row stores character offsets, not the quoted sentence. The
--     sentence is cut from review_documents.extracted_text when the review is
--     read, so deleting the text deletes every quotation of it, with no
--     copies left behind.
--
-- There is no column, and no storage bucket, that could hold an original
-- file. Only extracted text is ever stored.
--
-- NOT APPLIED. No Supabase project exists for this build yet. Run this by
-- hand (or with `supabase db push`) once one does.

-- Reviews ---------------------------------------------------------------

create table if not exists public.reviews (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  created_at         timestamptz not null default now(),
  summary            text not null,
  clean              boolean not null default false,
  dropped_flag_count integer not null default 0 check (dropped_flag_count >= 0)
);

create index if not exists reviews_user_id_created_at_idx
  on public.reviews (user_id, created_at desc);

alter table public.reviews enable row level security;

drop policy if exists "Signers can read their own reviews." on public.reviews;
create policy "Signers can read their own reviews."
  on public.reviews for select to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "Signers can create their own reviews." on public.reviews;
create policy "Signers can create their own reviews."
  on public.reviews for insert to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists "Signers can update their own reviews." on public.reviews;
create policy "Signers can update their own reviews."
  on public.reviews for update to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

drop policy if exists "Signers can delete their own reviews." on public.reviews;
create policy "Signers can delete their own reviews."
  on public.reviews for delete to authenticated
  using ( (select auth.uid()) = user_id );

-- Extracted text --------------------------------------------------------

create table if not exists public.review_documents (
  id             uuid primary key default gen_random_uuid(),
  review_id      uuid not null references public.reviews (id) on delete cascade,
  user_id        uuid not null references auth.users (id) on delete cascade,
  document_id    text not null,
  title          text not null,
  extracted_text text not null,
  position       integer not null default 0,
  unique (review_id, document_id)
);

create index if not exists review_documents_review_id_idx
  on public.review_documents (review_id);
create index if not exists review_documents_user_id_idx
  on public.review_documents (user_id);

alter table public.review_documents enable row level security;

drop policy if exists "Signers can read their own extracted text." on public.review_documents;
create policy "Signers can read their own extracted text."
  on public.review_documents for select to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "Signers can store their own extracted text." on public.review_documents;
create policy "Signers can store their own extracted text."
  on public.review_documents for insert to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists "Signers can update their own extracted text." on public.review_documents;
create policy "Signers can update their own extracted text."
  on public.review_documents for update to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

drop policy if exists "Signers can delete their own extracted text." on public.review_documents;
create policy "Signers can delete their own extracted text."
  on public.review_documents for delete to authenticated
  using ( (select auth.uid()) = user_id );

-- Risk flags ------------------------------------------------------------

create table if not exists public.review_flags (
  id                   uuid primary key default gen_random_uuid(),
  review_id            uuid not null references public.reviews (id) on delete cascade,
  user_id              uuid not null references auth.users (id) on delete cascade,
  rank                 integer not null,
  severity             text not null check (severity in ('high', 'medium', 'low')),
  consequence          text not null,
  triggering_condition text not null,
  source_document_id   text not null,
  source_start         integer not null check (source_start >= 0),
  source_end           integer not null check (source_end > source_start)
);

create index if not exists review_flags_review_id_rank_idx
  on public.review_flags (review_id, rank);
create index if not exists review_flags_user_id_idx
  on public.review_flags (user_id);

alter table public.review_flags enable row level security;

drop policy if exists "Signers can read their own risk flags." on public.review_flags;
create policy "Signers can read their own risk flags."
  on public.review_flags for select to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "Signers can store their own risk flags." on public.review_flags;
create policy "Signers can store their own risk flags."
  on public.review_flags for insert to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists "Signers can update their own risk flags." on public.review_flags;
create policy "Signers can update their own risk flags."
  on public.review_flags for update to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

drop policy if exists "Signers can delete their own risk flags." on public.review_flags;
create policy "Signers can delete their own risk flags."
  on public.review_flags for delete to authenticated
  using ( (select auth.uid()) = user_id );
