-- Daeil Band: visitor registration, moderation and dashboard statistics
-- Run once in Supabase SQL Editor. This migration preserves existing cheers/questions/RSVP rows.

create table if not exists public.visitors (
  visitor_id text primary key,
  nickname text not null default '관객' check (char_length(nickname) between 1 and 14),
  blocked boolean not null default false,
  block_reason text,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  last_cheer_at timestamptz,
  last_message_at timestamptz
);

alter table public.cheers add column if not exists visitor_id text;
alter table public.questions add column if not exists visitor_id text;

create index if not exists idx_visitors_last_seen on public.visitors(last_seen desc);
create index if not exists idx_visitors_blocked on public.visitors(blocked);
create index if not exists idx_cheers_created_at on public.cheers(created_at desc);
create index if not exists idx_cheers_emoji on public.cheers(emoji);
create index if not exists idx_cheers_visitor_id on public.cheers(visitor_id);
create index if not exists idx_questions_created_at on public.questions(created_at desc);
create index if not exists idx_questions_visitor_id on public.questions(visitor_id);

alter table public.visitors enable row level security;
-- No public policies. Server-side service-role access only.

create or replace function public.daeil_admin_stats()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'total_visitors', (select count(*) from public.visitors),
    'unique_nicknames', (select count(distinct lower(nickname)) from public.visitors),
    'blocked_visitors', (select count(*) from public.visitors where blocked = true),
    'total_cheers', (select count(*) from public.cheers),
    'cheers_by_emoji', coalesce((
      select jsonb_object_agg(emoji, cnt)
      from (select emoji, count(*) as cnt from public.cheers group by emoji) s
    ), '{}'::jsonb),
    'cheers_by_visitor', coalesce((
      select jsonb_object_agg(visitor_id, cnt)
      from (select visitor_id, count(*) as cnt from public.cheers where visitor_id is not null group by visitor_id) s
    ), '{}'::jsonb),
    'total_messages', (select count(*) from public.questions),
    'pending_messages', (select count(*) from public.questions where status = 'pending'),
    'answered_messages', (select count(*) from public.questions where status = 'answered'),
    'rsvp', coalesce((
      select jsonb_object_agg(attendance, cnt)
      from (
        select attendance,
          sum(case when attendance = 'yes' then greatest(headcount, 1) else 1 end)::integer as cnt
        from public.rsvps
        group by attendance
      ) r
    ), '{}'::jsonb)
  );
$$;

revoke all on function public.daeil_admin_stats() from public, anon, authenticated;
grant execute on function public.daeil_admin_stats() to service_role;
