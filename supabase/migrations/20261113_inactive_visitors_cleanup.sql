-- Daeil Band: bulk cleanup of visitor registrations with no activity.
-- Run once in Supabase SQL Editor. Active visitors and their records are preserved.
--
-- A visitor is considered inactive only when they have:
--   0 cheers, 0 questions/messages, and 0 after-party RSVP records.
-- The DELETE and row count happen in one database function call.

create or replace function public.daeil_admin_delete_inactive_visitors()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_visitors integer := 0;
begin
  delete from public.visitors v
  where not exists (
    select 1 from public.cheers c
    where c.visitor_id = v.visitor_id
  )
  and not exists (
    select 1 from public.questions q
    where q.visitor_id = v.visitor_id
  )
  and not exists (
    select 1 from public.rsvps r
    where r.visitor_id = v.visitor_id
  );

  get diagnostics deleted_visitors = row_count;

  return jsonb_build_object(
    'ok', true,
    'deleted_visitors', deleted_visitors
  );
end;
$$;

revoke all on function public.daeil_admin_delete_inactive_visitors() from public, anon, authenticated;
grant execute on function public.daeil_admin_delete_inactive_visitors() to service_role;
