import type { WlHomeMostRecentSetlistEntry } from "@/hooks/use-wl-home-most-recent-show"

/**
 * Rows are ordered by `entry_set` then `entry_setnum`. Within each set, keep only
 * the first row per `entry_song` (later duplicates in the same set are dropped).
 */
export function groupTileSetlistBySet(entries: WlHomeMostRecentSetlistEntry[]) {
  if (entries.length === 0) return []
  const groups: WlHomeMostRecentSetlistEntry[][] = []
  let batch: WlHomeMostRecentSetlistEntry[] = [entries[0]!]
  let seenSongsInSet = new Set([entries[0]!.entry_song])
  let prevSet = entries[0]!.entry_set
  for (let i = 1; i < entries.length; i++) {
    const e = entries[i]!
    if (e.entry_set === prevSet) {
      if (seenSongsInSet.has(e.entry_song)) continue
      seenSongsInSet.add(e.entry_song)
      batch.push(e)
    } else {
      groups.push(batch)
      batch = [e]
      seenSongsInSet = new Set([e.entry_song])
      prevSet = e.entry_set
    }
  }
  groups.push(batch)
  return groups
}
