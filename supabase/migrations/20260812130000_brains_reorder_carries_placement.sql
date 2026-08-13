-- Let a wted-brains reorder carry entry_placement alongside set and setnum.
--
-- Why: dragging a song from Set 1 into Set 2 reassigns entry_set and renumbers
-- entry_setnum, but the original version left entry_placement untouched — so the
-- row kept reading "Main Set 1" while sitting in set 2. Placement drives the
-- coloured pills on the setlist and the archive's own placement statistics, so a
-- stale value is a real data error, not a cosmetic one, and a setlister moving a
-- song mid-show is unlikely to notice it.
--
-- The client derives the new placement with getDefaultPlacementForSet(), the same
-- helper the entry modal uses when you change a set by hand, so a dragged row and
-- a hand-edited row end up with identical values.
--
-- Additive to the function's parameter list only; the table is untouched, so the
-- pre-change dependency audit does not apply. Callers are dpro-admin's
-- setlist_entries_reorder action and nothing else.
create or replace function public.brains_reorder_setlist_entries(p_entries jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  touched integer;
begin
  update public.setlist_entries se
  set entry_set       = e.entry_set,
      entry_setnum    = e.entry_setnum,
      -- coalesce, not straight assignment: getDefaultPlacementForSet() returns null
      -- for a set name it does not recognise, and a reorder must never blank a
      -- placement that was already correct.
      entry_placement = coalesce(e.entry_placement, se.entry_placement)
  from jsonb_to_recordset(p_entries)
    as e(
      entry_id uuid,
      entry_set text,
      entry_setnum integer,
      entry_placement text
    )
  where se.entry_id = e.entry_id;

  get diagnostics touched = row_count;
  return touched;
end;
$$;

comment on function public.brains_reorder_setlist_entries(jsonb) is
  'Renumber a batch of setlist entries in one statement. Input is
   [{"entry_id":uuid,"entry_set":text,"entry_setnum":int,"entry_placement":text|null}, ...];
   returns the row count touched so the caller can confirm every entry landed.

   One statement means one transaction: a drag that moves a song up a set
   renumbers every row below it, and a half-applied renumber leaves two entries
   sharing a setnum, which sort nondeterministically. All rows move or none do.

   entry_set, entry_setnum and entry_placement are foreign keys onto sets(set),
   setnums(setnums) and placements(placements), so an out-of-range value fails the
   constraint rather than writing something the archive cannot represent. A null
   entry_placement leaves the existing value alone.';
