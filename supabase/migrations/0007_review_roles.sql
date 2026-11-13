-- Existing reviews have no selected role. Keep their reports readable and
-- store the role and all finding locations atomically for new reviews.
alter table public.reviews
  add column role text check (role in ('renter', 'landlord'));

alter table public.review_flags
  add column title text,
  add column next_step text,
  add column related_citations jsonb not null default '[]'::jsonb
    check (jsonb_typeof(related_citations) = 'array');

-- Preserve the ownership, retention and execution grants of the existing RPC.
create or replace function public.create_review(p_signer_id uuid, p_review jsonb)
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

  if p_review->>'role' is not null and exists (
    select 1 from jsonb_array_elements(p_review->'flags') f
    where coalesce(length(btrim(f->>'title')), 0) = 0
       or coalesce(length(btrim(f->>'next_step')), 0) = 0
  ) then
    raise exception 'Every role-based finding needs a title and next step';
  end if;

  insert into public.reviews(id, user_id, created_at, saved_at, expires_at, role, summary, clean, dropped_flag_count)
  values (review_id, actor, completed, null, completed + interval '720 hours',
    p_review->>'role', p_review->>'summary', (p_review->>'clean')::boolean, (p_review->>'dropped_flag_count')::integer);

  insert into public.review_documents(review_id, user_id, document_id, title, extracted_text, position)
  select review_id, actor, d.document_id, d.title, d.extracted_text, d.position
  from jsonb_to_recordset(p_review->'documents') as d(document_id text, title text, extracted_text text, position integer);

  insert into public.review_flags(
    review_id, user_id, rank, severity, title, next_step, consequence, triggering_condition,
    counter_offer, residual_risk, source_document_id, source_start, source_end, related_citations
  )
  select review_id, actor, f.rank, f.severity, f.title, f.next_step, f.consequence, f.triggering_condition,
    f.counter_offer, f.residual_risk, f.source_document_id, f.source_start, f.source_end,
    coalesce(f.related_citations, '[]'::jsonb)
  from jsonb_to_recordset(p_review->'flags') as f(
    rank integer, severity text, title text, next_step text, consequence text, triggering_condition text,
    counter_offer text, residual_risk text, source_document_id text, source_start integer, source_end integer,
    related_citations jsonb
  );

  insert into public.review_checklist_topics(review_id, user_id, position, topic_id, status, source_document_id, source_start, source_end)
  select review_id, actor, t.position, t.topic_id, t.status, t.source_document_id, t.source_start, t.source_end
  from jsonb_to_recordset(p_review->'topics') as t(position integer, topic_id text, status text, source_document_id text, source_start integer, source_end integer);

  return jsonb_build_object('created_at', completed, 'saved_at', null, 'expires_at', completed + interval '720 hours');
end;
$$;
