-- Decouple the internal push senders from the service-role key.
--
-- Why: `radio-program-notify` and `live-activity-push` authenticated the pg_net
-- caller by comparing the Bearer to SUPABASE_SERVICE_ROLE_KEY. When the project
-- moved to Supabase's new API-key format, the injected service key changed and
-- the Vault copy (`service_role_key`) drifted → every call 401'd silently
-- (no "New Show" pushes; live-activity start/update/end all rejected). Only
-- `setlist-game-reminders` kept working, because it already checks a dedicated
-- cron secret it controls on both sides. This migration moves the other two
-- senders onto the same pattern so a future key rotation can't break them.
--
-- One-time config (out of band — NEVER commit the secret values):
--   1. Generate two random secrets, e.g.  openssl rand -hex 32
--   2. Set them as function env secrets (both functions have verify_jwt=false):
--        supabase secrets set RADIO_PROGRAM_CRON_SECRET=<secret-a>
--        supabase secrets set LIVE_ACTIVITY_CRON_SECRET=<secret-b>
--   3. Store the SAME values in Vault (used by the tick / la_push below):
--        select vault.create_secret('<secret-a>', 'radio_program_cron_key');
--        select vault.create_secret('<secret-b>', 'live_activity_cron_key');
--
-- Rollout order (avoids a downtime window): create the Vault secrets + set the
-- function env secrets FIRST, then deploy the two functions, then apply this
-- migration. Between the deploy and this migration the tick briefly sends the old
-- Vault key while the function expects the new one → a <1 min 401 window, which is
-- harmless (the cron retries every minute).

-- Radio "New Show" tick: send the dedicated cron secret instead of service_role.
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
  from vault.decrypted_secrets where name = 'radio_program_cron_key' limit 1;
  perform net.http_post(
    url     := _url,
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'Authorization', 'Bearer ' || _key),
    body    := '{}'::jsonb
  );
end $$;

-- Live Activity push helper: send the dedicated cron secret instead of service_role.
create or replace function public.la_push(_event text, _show_id text)
returns void language plpgsql security definer set search_path = public as $$
declare
  _url text := 'https://cxkxexzcfxppbthyggxo.functions.supabase.co/live-activity-push';
  _key text;
begin
  select decrypted_secret into _key
  from vault.decrypted_secrets where name = 'live_activity_cron_key' limit 1;
  perform net.http_post(
    url     := _url,
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization', 'Bearer ' || _key),
    body    := jsonb_build_object('event', _event, 'show_id', _show_id)
  );
end $$;
