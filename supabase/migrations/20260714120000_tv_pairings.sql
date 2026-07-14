-- Apple TV device-pairing sign-in (RFC 8628 style).
--
-- The TV calls tv-pair-start to mint a pairing, shows a QR encoding
-- /tv-login?code=<user_code>. The phone completes the existing web SSO and calls
-- tv-pair-bind (with its Wysteria JWT) to attach the token. The TV polls
-- tv-pair-poll with its device_code until status = 'bound', receives the token,
-- and the row is consumed. Rows are short-lived (~10 min) and managed entirely
-- by the edge functions (service role) — no client access, so RLS is on with no
-- policies.

create table if not exists public.tv_pairings (
  id uuid primary key default gen_random_uuid(),
  -- Secret the TV polls with. Returned only to the TV, never placed in the QR.
  device_code text not null unique,
  -- Short code embedded in the QR URL and shown on-screen as a fallback.
  user_code text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'bound', 'consumed')),
  -- The Wysteria JWT, set by tv-pair-bind, handed to the TV once, then cleared.
  token text,
  profile_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists tv_pairings_user_code_idx on public.tv_pairings (user_code);
create index if not exists tv_pairings_device_code_idx on public.tv_pairings (device_code);
create index if not exists tv_pairings_expires_at_idx on public.tv_pairings (expires_at);

comment on table public.tv_pairings is
  'Short-lived Apple TV sign-in pairings. Managed via tv-pair-* edge functions (service role); no direct client access.';

alter table public.tv_pairings enable row level security;

-- Optional housekeeping: drop expired/consumed rows. Wire to pg_cron if desired,
-- or rely on the edge functions treating expired rows as invalid.
-- delete from public.tv_pairings where expires_at < now() - interval '1 hour';
