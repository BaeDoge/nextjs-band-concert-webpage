-- Daeil Band activity gallery visibility setting.
-- Safe to run after the admin_moderation migration.

create table if not exists public.site_settings (
  id integer primary key check (id = 1),
  gallery_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, gallery_enabled)
values (1, true)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;
-- No anon/authenticated policies. Access only from the server using Supabase secret key.
