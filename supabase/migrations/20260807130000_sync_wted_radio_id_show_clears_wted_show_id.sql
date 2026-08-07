-- Teach sync_wted_radio_id_show() about wted_show_id.
--
-- Background: 20260807120000 added wted_radio_ids.wted_show_id, which ties a
-- track to a COMPILATION episode. It is mutually exclusive with show_id, which
-- ties a track to a single concert — the Recently Played artwork rule reads one
-- or the other and would be ambiguous if both were set.
--
-- The hole this closes: the previous version set show_id with no knowledge of
-- wted_show_id, so assigning a radio_id that already carried a compilation link
-- would leave BOTH columns populated. Low likelihood in practice — the 736 rows
-- backfilled by the crawl are intros, outros and sponsor reads that nobody maps
-- to a setlist entry — but it is the one code path that can break the invariant.
--
-- Direction of the fix: the admin wins. Mapping a radio_id to a setlist entry is
-- a deliberate statement that the track is concert content, so it overrides
-- whatever the Radio.co playlist crawl inferred.
--
-- Behaviour is otherwise identical, including the no-match case: if the radio_id
-- has no setlist entry the subquery returns no rows, the UPDATE touches nothing,
-- and any existing wted_show_id is left alone. It only clears when it is
-- actually assigning a show_id.
create or replace function public.sync_wted_radio_id_show(p_radio_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.wted_radio_ids w
  set show_id = se.entry_show,
      wted_show_id = null
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
  'Set wted_radio_ids.show_id for one radio_id to the oldest-dated show that
   carries it in setlist_entries, and clear wted_show_id so the two stay mutually
   exclusive. A deliberate setlist mapping means the track is concert content and
   overrides any compilation link from the Radio.co playlist crawl. No-op if the
   id has no matching entries or no catalog row.';

-- Now that no path can set both, the invariant can be enforced rather than
-- merely observed. Verified 0 violating rows immediately after the 20260807120000
-- backfill (736 wted_show_id, 7,830 show_id, 0 both).
--
-- Deliberately left commented out: dpro-admin swallows this function's RPC error
-- into console.error (index.ts:107), so a constraint violation raised through
-- that path would fail silently rather than surfacing to the admin. Enable this
-- once that error is propagated.
--
-- alter table public.wted_radio_ids
--   add constraint wted_radio_ids_show_xor_wted_show
--   check (show_id is null or wted_show_id is null);
