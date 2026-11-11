-- Supabase SQL Editor에서 한 번 실행하세요.
-- Service-role key는 Next.js 서버에서만 사용합니다.
create extension if not exists pgcrypto;
create table if not exists public.cheers(
 id uuid primary key default gen_random_uuid(),
 nickname text not null default '익명의 관객' check(char_length(nickname)<=14),
 emoji text not null check(emoji in ('🔥','👏','💛','🎸','🐈','✨')),
 created_at timestamptz not null default now()
);
create table if not exists public.questions(
 id uuid primary key default gen_random_uuid(),
 nickname text not null default '익명의 관객',
 body text not null check(char_length(body) between 1 and 500),
 answer text,
 status text not null default 'pending' check(status in ('pending','answered')),
 created_at timestamptz not null default now(),
 answered_at timestamptz
);
create table if not exists public.rsvps(
 visitor_id text primary key,
 nickname text not null default '익명의 관객',
 attendance text not null check(attendance in ('yes','maybe','no')),
 headcount integer not null default 0 check(headcount between 0 and 6),
 message text not null default '',
 updated_at timestamptz not null default now()
);
alter table public.cheers enable row level security;
alter table public.questions enable row level security;
alter table public.rsvps enable row level security;
-- 익명 브라우저의 직접 DB 접근 정책은 만들지 않습니다.
-- 서버 API에서만 service-role key로 접근합니다.
