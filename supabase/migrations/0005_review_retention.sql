-- Review lifecycle and atomic persistence. No hosted database is modified by
-- this file until an operator applies it. Days mean fixed 24-hour periods.
alter table public.reviews add column saved_at timestamptz;
alter table public.reviews add column expires_at timestamptz;
update public.reviews set expires_at = created_at + interval '720 hours';
alter table public.reviews alter column expires_at set not null;
alter table public.reviews add constraint reviews_owner_key unique (id, user_id);
alter table public.reviews add constraint reviews_retention_consistent check (
  (saved_at is null and expires_at = created_at + interval '720 hours')
  or (saved_at is not null and saved_at >= created_at and expires_at = saved_at + interval '2160 hours')
);
create index reviews_expiry_idx on public.reviews(expires_at);

-- A child cannot claim a different owner from its parent, including through
-- direct Data API calls. Existing mismatched data causes a migration failure.
alter table public.review_documents add constraint review_documents_owner_fk
  foreign key (review_id, user_id) references public.reviews(id, user_id) on delete cascade;
alter table public.review_flags add constraint review_flags_owner_fk
  foreign key (review_id, user_id) references public.reviews(id, user_id) on delete cascade;
alter table public.review_checklist_topics add constraint review_checklist_owner_fk
  foreign key (review_id, user_id) references public.reviews(id, user_id) on delete cascade;
alter table public.review_documents add constraint review_documents_source_key unique (review_id, user_id, document_id);
alter table public.review_flags add constraint review_flags_source_fk
  foreign key (review_id, user_id, source_document_id)
  references public.review_documents(review_id, user_id, document_id) on delete cascade;
alter table public.review_checklist_topics add constraint review_checklist_source_fk
  foreign key (review_id, user_id, source_document_id)
  references public.review_documents(review_id, user_id, document_id) on delete cascade;

-- Replace the original permissive policies. No prior owner-only SELECT
-- policy may remain, because permissive policies are ORed together.
drop policy "Signers can read their own reviews." on public.reviews;
drop policy "Signers can create their own reviews." on public.reviews;
drop policy "Signers can update their own reviews." on public.reviews;
drop policy "Signers can delete their own reviews." on public.reviews;
drop policy "Signers can read their own extracted text." on public.review_documents;
drop policy "Signers can store their own extracted text." on public.review_documents;
drop policy "Signers can update their own extracted text." on public.review_documents;
drop policy "Signers can delete their own extracted text." on public.review_documents;
drop policy "Signers can read their own risk flags." on public.review_flags;
drop policy "Signers can store their own risk flags." on public.review_flags;
drop policy "Signers can update their own risk flags." on public.review_flags;
drop policy "Signers can delete their own risk flags." on public.review_flags;
drop policy "Signers can read their own checklist topics." on public.review_checklist_topics;
drop policy "Signers can store their own checklist topics." on public.review_checklist_topics;
drop policy "Signers can update their own checklist topics." on public.review_checklist_topics;
drop policy "Signers can delete their own checklist topics." on public.review_checklist_topics;

create policy reviews_active_owner on public.reviews for select to authenticated
  using ((select auth.uid()) = user_id and expires_at > statement_timestamp());
create policy review_documents_active_owner on public.review_documents for select to authenticated
  using ((select auth.uid()) = user_id and exists (
    select 1 from public.reviews r where r.id = review_documents.review_id
      and r.user_id = review_documents.user_id and r.expires_at > statement_timestamp()
  ));
create policy review_flags_active_owner on public.review_flags for select to authenticated
  using ((select auth.uid()) = user_id and exists (
    select 1 from public.reviews r where r.id = review_flags.review_id
      and r.user_id = review_flags.user_id and r.expires_at > statement_timestamp()
  ));
create policy review_checklist_active_owner on public.review_checklist_topics for select to authenticated
  using ((select auth.uid()) = user_id and exists (
    select 1 from public.reviews r where r.id = review_checklist_topics.review_id
      and r.user_id = review_checklist_topics.user_id and r.expires_at > statement_timestamp()
  ));

-- Only the narrowly scoped RPCs below may write these tables. This prevents
-- direct requests from changing ownership, creation dates or expiry dates.
revoke all on public.reviews, public.review_documents, public.review_flags, public.review_checklist_topics from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public.reviews, public.review_documents, public.review_flags, public.review_checklist_topics from public;
grant select on public.reviews, public.review_documents, public.review_flags, public.review_checklist_topics to authenticated;

-- Definer is necessary because direct table writes are revoked. The actor
-- must match auth.uid(), every owner is derived from that actor, all names
-- are qualified, and no caller-supplied timestamps are accepted.
create function public.create_review(p_signer_id uuid, p_review jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  completed timestamptz := clock_timestamp();
  review_id uuid := (p_review->>'id')::uuid;
begin
  if actor is null or actor is distinct from p_signer_id then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if jsonb_typeof(p_review->'documents') is distinct from 'array'
     or jsonb_typeof(p_review->'flags') is distinct from 'array'
     or jsonb_typeof(p_review->'topics') is distinct from 'array' then
    raise exception 'Invalid review packet';
  end if;
  if jsonb_array_length(p_review->'documents') not between 1 and 12
     or jsonb_array_length(p_review->'topics') <> 6
     or coalesce(length(btrim(p_review->>'summary')), 0) = 0 then
    raise exception 'Incomplete review packet';
  end if;
  if (p_review->>'clean')::boolean is distinct from
     (jsonb_array_length(p_review->'flags') = 0 and (p_review->>'dropped_flag_count')::integer = 0) then
    raise exception 'Invalid clean review';
  end if;
  if exists (select 1 from jsonb_array_elements(p_review->'flags') f
    where coalesce(length(btrim(f->>'counter_offer')), 0) = 0
       or coalesce(length(btrim(f->>'residual_risk')), 0) = 0) then
    raise exception 'Every flag needs a proposed edit and remaining risk';
  end if;

  insert into public.reviews(id, user_id, created_at, saved_at, expires_at, summary, clean, dropped_flag_count)
  values (review_id, actor, completed, null, completed + interval '720 hours',
    p_review->>'summary', (p_review->>'clean')::boolean, (p_review->>'dropped_flag_count')::integer);

  insert into public.review_documents(review_id, user_id, document_id, title, extracted_text, position)
  select review_id, actor, d.document_id, d.title, d.extracted_text, d.position
  from jsonb_to_recordset(p_review->'documents') as d(document_id text, title text, extracted_text text, position integer);

  insert into public.review_flags(review_id, user_id, rank, severity, consequence, triggering_condition, counter_offer, residual_risk, source_document_id, source_start, source_end)
  select review_id, actor, f.rank, f.severity, f.consequence, f.triggering_condition, f.counter_offer, f.residual_risk, f.source_document_id, f.source_start, f.source_end
  from jsonb_to_recordset(p_review->'flags') as f(rank integer, severity text, consequence text, triggering_condition text, counter_offer text, residual_risk text, source_document_id text, source_start integer, source_end integer);

  insert into public.review_checklist_topics(review_id, user_id, position, topic_id, status, source_document_id, source_start, source_end)
  select review_id, actor, t.position, t.topic_id, t.status, t.source_document_id, t.source_start, t.source_end
  from jsonb_to_recordset(p_review->'topics') as t(position integer, topic_id text, status text, source_document_id text, source_start integer, source_end integer);

  return jsonb_build_object('created_at', completed, 'saved_at', null, 'expires_at', completed + interval '720 hours');
end;
$$;

create function public.retain_review(p_signer_id uuid, p_review_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  saved timestamptz;
  held public.reviews%rowtype;
begin
  if actor is null or actor is distinct from p_signer_id then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select * into held from public.reviews where id = p_review_id and user_id = actor for update;
  if not found then return null; end if;
  -- Read the clock after the row lock, so a waiting save cannot revive a
  -- review that expired while another transaction held the lock.
  saved := clock_timestamp();
  if held.expires_at <= saved then
    delete from public.reviews where id = held.id and user_id = actor;
    return null;
  end if;
  update public.reviews set saved_at = saved, expires_at = saved + interval '2160 hours'
    where id = held.id and user_id = actor;
  return jsonb_build_object('created_at', held.created_at, 'saved_at', saved, 'expires_at', saved + interval '2160 hours');
end;
$$;

-- Physical deletion is privileged maintenance. It is unavailable to API
-- users; child tables and all stored extracted text cascade with each review.
create function public.purge_expired_reviews()
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  removed bigint;
  cutoff timestamptz := clock_timestamp();
begin
  delete from public.reviews where expires_at <= cutoff;
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.create_review(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.retain_review(uuid, uuid) from public, anon, authenticated;
revoke all on function public.purge_expired_reviews() from public, anon, authenticated;
grant execute on function public.create_review(uuid, jsonb) to authenticated;
grant execute on function public.retain_review(uuid, uuid) to authenticated;
grant execute on function public.purge_expired_reviews() to service_role;

-- Remove already-expired legacy data immediately on migration application.
select public.purge_expired_reviews();
