-- Keep wted_radio_ids.show_id in sync for a single radio_id, using the same rule
-- as the one-time backfill: the entry_show of the OLDEST-dated show that has this
-- radio_id in its setlist entries. Called after an admin assigns a radio_id to a
-- setlist entry (dpro-admin: setlist_entries_update).
create or replace function public.sync_wted_radio_id_show(p_radio_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.wted_radio_ids w
  set show_id = se.entry_show
  from (
    select se.entry_show
    from public.setlist_entries se
    join public.shows s on s.show_id = se.entry_show
    where se.radio_id = p_radio_id
      and se.entry_show is not null
    order by s.show_date asc nulls last
    limit 1
  ) se
  where w.radio_id = p_radio_id;
$$;

comment on function public.sync_wted_radio_id_show(text) is
  'Set wted_radio_ids.show_id for one radio_id to the oldest-dated show that carries it in setlist_entries. No-op if the id has no matching entries or no catalog row.';
