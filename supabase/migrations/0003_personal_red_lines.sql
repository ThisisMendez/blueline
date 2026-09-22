-- Account preferences contain no lease text and belong only to their signer.
create table public.signer_red_lines (
  user_id uuid primary key references auth.users(id) on delete cascade,
  red_lines text[] not null default '{}',
  constraint red_lines_limit check (cardinality(red_lines) <= 20),
  constraint red_lines_no_nulls check (array_position(red_lines, null) is null)
);

alter table public.signer_red_lines enable row level security;

create policy "Signers read their own red lines"
  on public.signer_red_lines for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Signers create their own red lines"
  on public.signer_red_lines for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Signers edit their own red lines"
  on public.signer_red_lines for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Signers delete their own red lines"
  on public.signer_red_lines for delete to authenticated
  using ((select auth.uid()) = user_id);
