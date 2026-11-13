-- Daeil Band: count and bulk cleanup of visitors with no activity.
-- Run once in Supabase SQL Editor after the existing admin migrations.
-- A visitor is inactive when they have zero cheers, no messages and no RSVP.
-- Blocked visitors are intentionally preserved.

create or replace function public.daeil_admin_inactive_visitor_count()
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.visitors v
  where coalesce(v.blocked, false) = false
    and not exists (
      select 1 from public.cheers c where c.visitor_id = v.visitor_id
    )
    and not exists (
      select 1 from public.questions q where q.visitor_id = v.visitor_id
    )
    and not exists (
      select 1 from public.rsvps r where r.visitor_id = v.visitor_id
    );
$$;

create or replace function public.daeil_admin_cleanup_inactive_visitors()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer := 0;
begin
  delete from public.visitors v
  where coalesce(v.blocked, false) = false
    and not exists (
      select 1 from public.cheers c where c.visitor_id = v.visitor_id
    )
    and not exists (
      select 1 from public.questions q where q.visitor_id = v.visitor_id
    )
    and not exists (
      select 1 from public.rsvps r where r.visitor_id = v.visitor_id
    );

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.daeil_admin_inactive_visitor_count() from public, anon, authenticated;
revoke all on function public.daeil_admin_cleanup_inactive_visitors() from public, anon, authenticated;
grant execute on function public.daeil_admin_inactive_visitor_count() to service_role;
grant execute on function public.daeil_admin_cleanup_inactive_visitors() to service_role;
