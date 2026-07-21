-- Fix: la_on_setlist_change compared shows.show_id (uuid) to a text variable
-- derived from setlist_entries.entry_show (uuid), which aborts every insert/update
-- on setlist_entries with: operator does not exist: uuid = text.
-- Same mismatch in la-start-scan / la-end-scan joins against live_activity_show_state
-- (show_id text) vs shows (show_id uuid).

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

select cron.unschedule('la-start-scan');
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

select cron.unschedule('la-end-scan');
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
