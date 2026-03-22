/** show_group values surfaced as "Performed by" pills on the Songs list view */
export const SONGS_LIST_PERFORMER_GROUPS = [
  "Goose",
  "Vasudo",
  "St John's Revival",
  "Orebolo",
  "Great Blue",
  "FASHØN",
  "Peter Anspach",
  "ElephantProof",
  "Swimmer",
] as const

export const SONGS_LIST_PERFORMER_GROUP_SET = new Set<string>(
  SONGS_LIST_PERFORMER_GROUPS
)

export type SetlistEntryShowRow = {
  entry_song: string | null
  shows: { show_group: string | null } | null
}

export function aggregatePerformersBySong(
  rows: SetlistEntryShowRow[]
): Record<string, string[]> {
  const map = new Map<string, Set<string>>()
  for (const row of rows) {
    const song = row.entry_song
    const group = row.shows?.show_group
    if (!song || !group || !SONGS_LIST_PERFORMER_GROUP_SET.has(group)) continue
    let set = map.get(song)
    if (!set) {
      set = new Set()
      map.set(song, set)
    }
    set.add(group)
  }
  const out: Record<string, string[]> = {}
  for (const [song, set] of map) {
    out[song] = [...set].sort((a, b) => a.localeCompare(b))
  }
  return out
}
