-- Event wiring for the Live Activity pushes. Requires pg_net + pg_cron.
-- (Applied manually via the SQL editor on 2026-07-18; kept here as the migration
-- of record. Idempotent.)
--
-- One-time config (NOT in this file — no secrets in migrations):
--   store the dedicated cron secret in Vault under 'live_activity_cron_key'
--   (matching the live-activity-push function's LIVE_ACTIVITY_CRON_SECRET env).
-- (The functions base URL is this project's own public domain, so it's inlined
--  below — the SQL-editor role can't `alter database … set` a custom GUC.)
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Helper: POST { event, show_id } to the live-activity-push edge function.
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

-- Trigger: a setlist row changed for a show currently in its live window → update.
-- entry_show / shows.show_id are uuid; la_push takes text (cast at the call site).
create or replace function public.la_on_setlist_change()
returns trigger language plpgsql as $$
declare _show uuid := coalesce(NEW.entry_show, OLD.entry_show);
begin
  if _show is null then
    return coalesce(NEW, OLD);
  end if;
  if exists (
    select 1 from public.shows s
    where s.show_id = _show
      and s.show_time <= now()
      and s.show_time >= now() - interval '6 hours'
  ) then
    perform public.la_push('update', _show::text);
  end if;
  return coalesce(NEW, OLD);
end $$;

drop trigger if exists trg_la_setlist_change on public.setlist_entries;
create trigger trg_la_setlist_change
after insert or update or delete on public.setlist_entries
for each row execute function public.la_on_setlist_change();

-- Cron: shows entering the live window → start (once each; state row dedupes).
-- live_activity_show_state.show_id is text; shows.show_id is uuid — cast explicitly.
select cron.schedule('la-start-scan', '* * * * *', $$
  with due as (
    insert into public.live_activity_show_state (show_id, started_at)
    select s.show_id::text, now()
    from public.shows s
    left join public.live_activity_show_state st on st.show_id = s.show_id::text
    where s.show_time <= now()
      and s.show_time >= now() - interval '6 hours'
      and st.show_id is null
    on conflict (show_id) do nothing
    returning show_id
  )
  select public.la_push('start', show_id) from due;
$$);

-- Cron: shows whose window just closed → end (once each) + token cleanup.
select cron.schedule('la-end-scan', '* * * * *', $$
  with due as (
    update public.live_activity_show_state st
    set ended_at = now()
    from public.shows s
    where st.show_id = s.show_id::text
      and st.ended_at is null
      and s.show_time < now() - interval '6 hours'
    returning st.show_id
  )
  select public.la_push('end', show_id) from due;
$$);
