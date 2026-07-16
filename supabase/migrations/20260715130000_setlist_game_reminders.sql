-- Setlist Game "picks lock soon" push notifications.
--   • per-type opt-in flags on apns_tokens (additive to the app's token table)
--   • per-show dedupe table (show_time values are stable, so one row = one sent)
--   • 15-min pg_cron job that pings the setlist-game-reminders Edge Function
--     via pg_net (the function signs the APNs JWT and sends).

-- Per-notification-type opt-in. Existing tokens keep live-shows on; game off.
alter table public.apns_tokens
  add column if not exists live_shows_enabled boolean not null default true,
  add column if not exists setlist_game_enabled boolean not null default false;

comment on column public.apns_tokens.live_shows_enabled is
  'Device opted into live setlist pushes (now-playing / show-event brain buttons).';
comment on column public.apns_tokens.setlist_game_enabled is
  'Device opted into Setlist Game "picks lock soon" reminders.';

-- One row per show we have already reminded about (dedupe).
create table if not exists public.setlist_game_reminders (
  show_id uuid primary key references public.shows (show_id) on delete cascade,
  sent_at timestamptz not null default now()
);

comment on table public.setlist_game_reminders is
  'Shows a Setlist Game lock-soon push has been sent for. Written by the setlist-game-reminders Edge Function (service role).';

alter table public.setlist_game_reminders enable row level security;

-- Scheduled trigger: every 15 min, invoke the reminder Edge Function.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net;

-- Auth + target come from Vault (create these secrets once, out of band — never
-- in this migration):
--   setlist_game_reminders_url  = https://<project-ref>.supabase.co/functions/v1/setlist-game-reminders
--   setlist_game_cron_key       = <your Supabase service_role key>
select cron.unschedule(jobid) from cron.job where jobname = 'setlist-game-reminders-15min';

select cron.schedule(
  'setlist-game-reminders-15min',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'setlist_game_reminders_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'setlist_game_cron_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
