-- Native app push: APNs device tokens (per-device, no sign-in required).
-- Replaces the Web Push/VAPID path for live setlist alerts.

create table if not exists public.apns_tokens (
  id uuid primary key default gen_random_uuid(),
  device_token text not null,
  profile_id uuid references public.profiles (id) on delete set null,
  environment text not null default 'production',
  bundle_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint apns_tokens_device_token_key unique (device_token)
);

create index if not exists apns_tokens_profile_id_idx
  on public.apns_tokens (profile_id);

comment on table public.apns_tokens is
  'APNs device tokens for the native app''s live setlist alerts. Per-device (profile_id optional). Managed via Edge Functions (service role).';

-- Locked down: only the service role (Edge Functions) touches this. No policies.
alter table public.apns_tokens enable row level security;
