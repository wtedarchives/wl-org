-- Live Activity push-token storage for the native app's setlist Live Activity.
-- Written only by the edge functions (service role); RLS on, no policies.
-- (Applied manually via the SQL editor on 2026-07-18; kept here as the migration
-- of record. Idempotent.)

-- Device-level push-to-start tokens.
create table if not exists public.live_activity_start_tokens (
  token       text primary key,
  environment text not null check (environment in ('sandbox', 'production')),
  updated_at  timestamptz not null default now()
);

-- Per-activity update tokens, keyed by the show the activity is for.
create table if not exists public.live_activity_update_tokens (
  token       text primary key,
  show_id     text not null,
  environment text not null check (environment in ('sandbox', 'production')),
  updated_at  timestamptz not null default now()
);
create index if not exists live_activity_update_tokens_show_idx
  on public.live_activity_update_tokens (show_id);

-- Tracks which shows have had a start/end push, so the cron scans fire once each.
create table if not exists public.live_activity_show_state (
  show_id    text primary key,
  started_at timestamptz,
  ended_at   timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.live_activity_start_tokens  enable row level security;
alter table public.live_activity_update_tokens enable row level security;
alter table public.live_activity_show_state    enable row level security;
-- (Intentionally no policies — only the service role touches these.)
