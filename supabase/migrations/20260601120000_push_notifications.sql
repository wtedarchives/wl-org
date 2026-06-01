-- Live show push notifications: global opt-in on profiles + Web Push subscriptions.

alter table public.profiles
  add column if not exists push_notifications_enabled boolean not null default false;

comment on column public.profiles.push_notifications_enabled is
  'When true, user receives live setlist push alerts (admin brain / show-event buttons).';

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_subscriptions_endpoint_key unique (endpoint)
);

create index if not exists push_subscriptions_profile_id_idx
  on public.push_subscriptions (profile_id);

comment on table public.push_subscriptions is
  'Browser Web Push subscriptions for opted-in profiles. Managed via Edge Functions (service role).';

alter table public.push_subscriptions enable row level security;
