-- Required deployment step. If pg_cron is unavailable or cannot be enabled,
-- this migration fails; do not mark physical retention cleanup configured.
create extension if not exists pg_cron;
select cron.schedule(
  'blueline-purge-expired-reviews',
  '* * * * *',
  'select public.purge_expired_reviews();'
);
