-- "New Show on the Radio" push notifications.
--
-- Additive only: adds an opt-in flag to the token tables (no drop/rename/type
-- change), a singleton state row, and a pg_cron gate that invokes the
-- radio-program-notify edge function ONLY near a program boundary (mid-program
-- ticks do a trivial local read and return — so the edge function runs a few
-- thousand times/month, not once/minute).
--
-- Dependency note: `apns_tokens` / `fcm_tokens` are only written by the register
-- edge functions (service role) and read by the push senders; adding a
-- defaulted boolean column is safe for both. Requires pg_net + pg_cron (already
-- enabled for the Live Activity feature).

alter table public.apns_tokens
  add column if not exists radio_program_enabled boolean not null default false;
alter table public.fcm_tokens
  add column if not exists radio_program_enabled boolean not null default false;

-- Tracks the currently-airing program + its scheduled end (single row).
create table if not exists public.radio_program_state (
  id            boolean primary key default true,
  last_event_id bigint,        -- radio.co schedule event_id last notified
  current_end   timestamptz,   -- scheduled end of the current program (null = filler/none)
  updated_at    timestamptz not null default now(),
  constraint radio_program_state_singleton check (id)
);
insert into public.radio_program_state (id) values (true) on conflict (id) do nothing;

alter table public.radio_program_state enable row level security;  -- service-role only

-- Gate: every minute, cheaply decide whether to invoke the edge function.
-- Mid-program (now < end − 5 min) → return immediately. Near the boundary,
-- during filler, or when nothing is locked → invoke. Service key from Vault
-- (stored under 'service_role_key'); the function URL is this project's own.
create or replace function public.radio_program_tick()
returns void language plpgsql security definer set search_path = public as $$
declare
  _end timestamptz;
  _url text := 'https://cxkxexzcfxppbthyggxo.functions.supabase.co/radio-program-notify';
  _key text;
begin
  select current_end into _end from public.radio_program_state where id;
  if _end is not null and now() < _end - interval '5 minutes' then
    return;  -- mid-program: nothing can change yet
  end if;
  select decrypted_secret into _key
  from vault.decrypted_secrets where name = 'service_role_key' limit 1;
  perform net.http_post(
    url     := _url,
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'Authorization', 'Bearer ' || _key),
    body    := '{}'::jsonb
  );
end $$;

select cron.schedule('radio-program-scan', '* * * * *', $$ select public.radio_program_tick(); $$);

-- To remove later:
--   select cron.unschedule('radio-program-scan');
