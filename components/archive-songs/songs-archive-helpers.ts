import type {
  SongsArchiveCategory,
  SongsArchiveSong,
} from "@/hooks/use-songs-archive-data"

export type SectionKey =
  | "studio"
  | "live"
  | "ted"
  | "covers"
  | "side"
  | "miscCovers"

/** Cover Songs: sole category in the Cover Songs section (songs grid). */
export const COVER_DUAL_SECTION_CANONID = 299 as const

/** Miscellaneous Covers: own section below Side Projects (songs grid). */
export const COVER_WIDE_SECTION_CANONID = 300 as const

export const SECTION_TITLES: Record<SectionKey, string> = {
  studio: "Studio Releases",
  live: "Live-Only Songs",
  ted: "Ted Tapes Songs/Jams",
  covers: "Cover Songs",
  side: "Side Projects",
  miscCovers: "Miscellaneous Covers",
}

export const SECTION_ORDER: readonly SectionKey[] = [
  "studio",
  "live",
  "ted",
  "covers",
  "side",
  "miscCovers",
]

export function sectionOf(canonid: number): SectionKey {
  if (canonid <= 20) return "studio"
  if ((canonid >= 21 && canonid <= 170) || canonid === 298) return "live"
  if (canonid >= 171 && canonid <= 297) return "ted"
  if (canonid === COVER_DUAL_SECTION_CANONID) return "covers"
  if (canonid === COVER_WIDE_SECTION_CANONID) return "miscCovers"
  return "side"
}

export function buildSongsByCategory(
  cats: readonly SongsArchiveCategory[],
  songs: readonly SongsArchiveSong[],
): Record<string, SongsArchiveSong[]> {
  const out: Record<string, SongsArchiveSong[]> = {}
  for (const cat of cats) {
    out[cat.category] = songs
      .filter((s) => s.song_category === cat.category)
      .sort((a, b) => {
        if (a.song_categoryorder !== b.song_categoryorder)
          return a.song_categoryorder - b.song_categoryorder
        return a.song.localeCompare(b.song)
      })
  }
  return out
}

export function groupCategoriesBySection(
  cats: readonly SongsArchiveCategory[],
): Record<SectionKey, SongsArchiveCategory[]> {
  const bySection: Record<SectionKey, SongsArchiveCategory[]> = {
    studio: [],
    live: [],
    ted: [],
    covers: [],
    side: [],
    miscCovers: [],
  }
  for (const cat of [...cats].sort(
    (a, b) => a.category_canonid - b.category_canonid,
  )) {
    bySection[sectionOf(cat.category_canonid)].push(cat)
  }
  return bySection
}

export function performerOptions(
  performerBySong: Record<string, string[]>,
): string[] {
  const set = new Set<string>()
  for (const arr of Object.values(performerBySong)) {
    for (const g of arr) set.add(g)
  }
  return [...set].sort()
}

/** Same filtering/sort/limit as `/archive/songs` list search modal. */
export function songsArchiveSearchHits(
  songs: SongsArchiveSong[],
  searchQuery: string,
): SongsArchiveSong[] {
  const q = searchQuery.trim().toLowerCase()
  let list = [...songs]
  if (q) {
    list = songs.filter(
      (s) =>
        (s.song_displayname || s.song).toLowerCase().includes(q) ||
        s.song.toLowerCase().includes(q) ||
        s.song_category.toLowerCase().includes(q) ||
        (s.song_originalartist || "").toLowerCase().includes(q),
    )
  }
  list.sort((a, b) => a.song.localeCompare(b.song))
  return list.slice(0, 60)
}
