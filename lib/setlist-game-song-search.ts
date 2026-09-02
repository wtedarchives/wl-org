import type { Song } from "@/components/dpro/setlistgame/song-selection/types"

export const SETLIST_GAME_SONG_CATEGORY_ORDER = [
  "Goose",
  "Ted Tapes",
  "Cover Songs",
] as const

export function getSetlistGameSongCategoryLabel(
  categoryType: string | undefined,
): string {
  if (!categoryType) return "Other"
  if (categoryType === "Goose" || categoryType === "Goose Misc") return "Goose"
  if (categoryType === "Ted Tapes") return "Ted Tapes"
  if (categoryType === "Cover Songs") return "Cover Songs"
  return categoryType
}

export function setlistGameSongMatchesQuery(song: Song, query: string): boolean {
  if (!query.trim()) return true
  const needle = query.trim().toLowerCase()
  const canon = song.song.toLowerCase()
  const disp = (song.song_displayname ?? "").toLowerCase()
  return canon.includes(needle) || disp.includes(needle)
}

export function groupSetlistGameSongsByCategory(
  songs: Song[],
  query: string,
): { category: string; songs: Song[] }[] {
  const filtered = songs.filter((song) => {
    const isPlaceholder = (song as { song_placeholder?: boolean })
      .song_placeholder
    return !isPlaceholder
  })

  const groups: { category: string; songs: Song[] }[] = []
  for (const cat of SETLIST_GAME_SONG_CATEGORY_ORDER) {
    const catSongs = filtered.filter(
      (s) => getSetlistGameSongCategoryLabel(s.category_type) === cat,
    )
    const matched = catSongs.filter((s) => setlistGameSongMatchesQuery(s, query))
    if (matched.length > 0) {
      groups.push({ category: cat, songs: matched })
    }
  }
  return groups
}
