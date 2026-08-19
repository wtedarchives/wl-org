-- Echo of a Show: provisional recalc when the setlist changes, plus the
-- last-20-canonical song-count average used by the over-pick warning.
--
-- Recalc is invoked by pg_net → setlist-game-recalc Edge Function.
-- Auth reuses the existing Setlist Game cron secret (Vault
-- `setlist_game_cron_key` = function env `SETLIST_GAME_CRON_SECRET`).
-- The function URL is inlined like live-activity-push (no new Vault URL).

create extension if not exists pg_net;
create extension if not exists pg_cron;

create table if not exists public.setlist_game_recalc_queue (
  show_id uuid primary key references public.shows (show_id) on delete cascade,
  requested_at timestamptz not null default now(),
  in_flight boolean not null default false
);

comment on table public.setlist_game_recalc_queue is
  'Unscored Setlist Game shows waiting for a provisional recalc after setlist_entries changes.';

alter table public.setlist_game_recalc_queue enable row level security;

create or replace function public.echo_canonical_song_average(
  except_show uuid default null
)
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select round(avg(n))::integer
  from (
    select count(e.entry_id)::numeric as n
    from public.shows s
    join public.setlist_entries e on e.entry_show = s.show_id
    where s.show_canonid is not null
      and (except_show is null or s.show_id is distinct from except_show)
    group by s.show_id, s.show_canonid
    having count(e.entry_id) > 0
    order by s.show_canonid desc
    limit 20
  ) t;
$$;

comment on function public.echo_canonical_song_average(uuid) is
  'Rounded mean song count of the 20 most recent canonical Goose shows that have a setlist.';

grant execute on function public.echo_canonical_song_average(uuid) to anon, authenticated;

create or replace function public.echo_kick_setlist_recalc(_show_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _url text := 'https://cxkxexzcfxppbthyggxo.functions.supabase.co/setlist-game-recalc';
  _key text;
begin
  if _show_id is null then
    return;
  end if;
  select decrypted_secret into _key
  from vault.decrypted_secrets
  where name = 'setlist_game_cron_key'
  limit 1;
  if _key is null or btrim(_key) = '' then
    return;
  end if;
  perform net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _key
    ),
    body := jsonb_build_object('show_id', _show_id::text)
  );
end;
$$;

create or replace function public.echo_queue_setlist_recalc()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _show uuid := coalesce(NEW.entry_show, OLD.entry_show);
begin
  if _show is null then
    return coalesce(NEW, OLD);
  end if;
  if exists (
    select 1
    from public.shows s
    where s.show_id = _show
      and s.show_issetlistgame is true
      and coalesce(s.show_scored, false) = false
  ) then
    insert into public.setlist_game_recalc_queue (show_id, requested_at, in_flight)
    values (_show, now(), false)
    on conflict (show_id) do update
      set requested_at = excluded.requested_at;
    perform public.echo_kick_setlist_recalc(_show);
  end if;
  return coalesce(NEW, OLD);
end;
$$;

revoke all on function public.echo_kick_setlist_recalc(uuid) from public, anon, authenticated;
revoke all on function public.echo_queue_setlist_recalc() from public, anon, authenticated;
grant execute on function public.echo_kick_setlist_recalc(uuid) to postgres;
grant execute on function public.echo_queue_setlist_recalc() to postgres;

drop trigger if exists trg_echo_setlist_recalc on public.setlist_entries;
create trigger trg_echo_setlist_recalc
after insert or update or delete on public.setlist_entries
for each row execute function public.echo_queue_setlist_recalc();

-- Backup if a pg_net call is dropped: drain leftover queue rows once a minute.
select cron.unschedule(jobid)
from cron.job
where jobname = 'echo-setlist-recalc-drain';

select cron.schedule(
  'echo-setlist-recalc-drain',
  '* * * * *',
  $$
  update public.setlist_game_recalc_queue
  set in_flight = false
  where in_flight
    and requested_at < now() - interval '2 minutes';

  select public.echo_kick_setlist_recalc(show_id)
  from public.setlist_game_recalc_queue
  where in_flight = false
  limit 8;
  $$
);
