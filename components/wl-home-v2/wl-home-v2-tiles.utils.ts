import type { WlHomeMostRecentSetlistEntry } from "@/hooks/use-wl-home-most-recent-show"

/** Rows are already ordered by set; split when `entry_set` changes. */
export function groupTileSetlistBySet(entries: WlHomeMostRecentSetlistEntry[]) {
  if (entries.length === 0) return []
  const groups: WlHomeMostRecentSetlistEntry[][] = []
  let batch: WlHomeMostRecentSetlistEntry[] = [entries[0]!]
  let prevSet = entries[0]!.entry_set
  for (let i = 1; i < entries.length; i++) {
    const e = entries[i]!
    if (e.entry_set === prevSet) {
      batch.push(e)
    } else {
      groups.push(batch)
      batch = [e]
      prevSet = e.entry_set
    }
  }
  groups.push(batch)
  return groups
}
