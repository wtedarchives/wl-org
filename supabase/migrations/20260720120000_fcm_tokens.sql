-- Native Android app push: FCM device tokens (per-device, no sign-in required).
-- The Android parallel to apns_tokens; kept as a separate table so the APNs
-- path is entirely untouched.

create table if not exists public.fcm_tokens (
  id uuid primary key default gen_random_uuid(),
  fcm_token text not null,
  profile_id uuid references public.profiles (id) on delete set null,
  live_shows_enabled boolean not null default true,
  setlist_game_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fcm_tokens_fcm_token_key unique (fcm_token)
);

create index if not exists fcm_tokens_profile_id_idx
  on public.fcm_tokens (profile_id);

comment on table public.fcm_tokens is
  'FCM device tokens for the native Android app''s live-show / setlist-game / live-activity pushes. Per-device (profile_id optional). Managed via Edge Functions (service role).';

-- Locked down: only the service role (Edge Functions) touches this. No policies.
alter table public.fcm_tokens enable row level security;
