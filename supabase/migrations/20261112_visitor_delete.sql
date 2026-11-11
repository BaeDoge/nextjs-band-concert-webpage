-- Permanently remove one visitor and all records linked to that browser ID.
-- Run once in Supabase SQL Editor after 20261112_admin_moderation.sql.

create or replace function public.daeil_admin_delete_visitor(p_visitor_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_cheers integer := 0;
  deleted_questions integer := 0;
  deleted_rsvps integer := 0;
  deleted_visitors integer := 0;
begin
  delete from public.cheers where visitor_id = p_visitor_id;
  get diagnostics deleted_cheers = row_count;

  delete from public.questions where visitor_id = p_visitor_id;
  get diagnostics deleted_questions = row_count;

  delete from public.rsvps where visitor_id = p_visitor_id;
  get diagnostics deleted_rsvps = row_count;

  delete from public.visitors where visitor_id = p_visitor_id;
  get diagnostics deleted_visitors = row_count;

  return jsonb_build_object(
    'ok', true,
    'deleted_cheers', deleted_cheers,
    'deleted_questions', deleted_questions,
    'deleted_rsvps', deleted_rsvps,
    'deleted_visitors', deleted_visitors
  );
end;
$$;

revoke all on function public.daeil_admin_delete_visitor(text) from public, anon, authenticated;
grant execute on function public.daeil_admin_delete_visitor(text) to service_role;
