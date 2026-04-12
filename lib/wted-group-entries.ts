import type { SetlistEntry } from "@/types/setlist"

function compareSetlistEntryOrder(a: SetlistEntry, b: SetlistEntry): number {
  const setCmp = a.entry_set.localeCompare(b.entry_set, undefined, {
    numeric: true,
  })
  if (setCmp !== 0) return setCmp
  return a.entry_setnum - b.entry_setnum
}

/**
 * All setlist rows on this show that share the clicked row's `radio_id`,
 * ordered by set / set order (medley order).
 */
export function getWtedEntriesForRadioGroup(
  setlist: SetlistEntry[],
  entry: SetlistEntry | null,
): SetlistEntry[] {
  if (!entry?.radio_id?.trim() || !entry.entry_show) {
    return entry ? [entry] : []
  }
  const rid = entry.radio_id
  const showId = entry.entry_show
  const filtered = setlist.filter(
    (e) =>
      e.radio_id === rid &&
      e.entry_show === showId &&
      e.radio_id != null &&
      String(e.radio_id).trim() !== "",
  )
  if (filtered.length === 0) return [entry]
  return filtered.sort(compareSetlistEntryOrder)
}
