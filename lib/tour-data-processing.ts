import type {
  TourShow,
  SlotShowData,
  SlotData,
  SongEntryWithId,
} from "@/types/tour"

/** Map placement names (from DB) to SlotShowData keys */
const PLACEMENT_TO_SLOT_KEY: Record<string, keyof SlotShowData> = {
  "Set 1 Opener": "Set_1_Opener",
  "Set 1 Closer": "Set_1_Closer",
  "Set 2 Opener": "Set_2_Opener",
  "Set 2 Closer": "Set_2_Closer",
  "Set 3 Opener": "Set_3_Opener",
  "Set 3 Closer": "Set_3_Closer",
  "Set 4 Opener": "Set_4_Opener",
  "Set 4 Closer": "Set_4_Closer",
  "Set 5 Opener": "Set_5_Opener",
  "Set 5 Closer": "Set_5_Closer",
  "Encore 1": "Encore_1",
  "Encore 2": "Encore_2",
  "Encore 3": "Encore_3",
}

/** Slot keys that have placement data (for activeColumns) */
export const SLOT_KEYS: (keyof SlotShowData)[] = [
  "Set_1_Opener",
  "Set_1_Closer",
  "Set_2_Opener",
  "Set_2_Closer",
  "Set_3_Opener",
  "Set_3_Closer",
  "Set_4_Opener",
  "Set_4_Closer",
  "Set_5_Opener",
  "Set_5_Closer",
  "Encore_1",
  "Encore_2",
  "Encore_3",
]

export interface RawSetlistEntry {
  entry_id?: string
  entry_song: string
  entry_placement: string
  entry_setnum: number
  entry_length?: string | null
  entry_short?: string | null
  entry_show?: string
  songs?:
    | {
        song_id?: string
        song_category?: string | null
        song_originalartist?: string | null
        categories?: {
          category_artwork?: string
          category_canonid?: number
        }
      }
    | {
        song_id?: string
        song_category?: string | null
        song_originalartist?: string | null
        categories?: {
          category_artwork?: string
          category_canonid?: number
        }
      }[]
}

export interface RawShowRow {
  show_id: string
  show_date: string
  show_iscanon?: boolean
  show_tour?: string
  show_group?: string
  show_subvenue?: string
  show_detail?: string | null
  show_alert?: string | null
  show_canonid?: number | null
  show_venue_location?: string | null
  show_subvenue_venue?: string
  venue_id?: string
  attended?: boolean
  show_wl_link?: string | null
  show_length?: string | null
  show_rarity?: string | null
  show_gap?: string | null
  subvenues?: { venues?: { venue_id: string } }
}

/**
 * Process raw show data into TourShow format.
 */
export function processShowData(
  show: RawShowRow,
  entries: RawSetlistEntry[] = [],
  attendedShowIds: string[] = [],
): TourShow {
  let totalSeconds = 0
  const hasLength = entries.some((e) => e.entry_length != null)
  if (hasLength) {
    for (const entry of entries) {
      const len = entry.entry_length
      if (!len) continue
      const parts = String(len).split(":").map(Number)
      if (parts.length === 3) {
        totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2]
      } else if (parts.length === 2) {
        totalSeconds += parts[0] * 60 + parts[1]
      }
    }
  }
  let show_length: string | null = show.show_length ?? null
  if (totalSeconds > 0) {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    show_length = `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }
  const show_rarity =
    show.show_rarity != null
      ? `${Number(show.show_rarity).toFixed(2)}%`
      : null
  const show_gap =
    show.show_gap != null ? Number(show.show_gap).toFixed(2) : null

  const songEntries = entries.map((e) => {
    const songsRel = e.songs
    const songRow = Array.isArray(songsRel) ? songsRel[0] : songsRel
    return {
      entry_length: e.entry_length ?? null,
      entry_song: e.entry_song,
      entry_placement: e.entry_placement,
      entry_setnum: e.entry_setnum,
      entry_short: e.entry_short ?? null,
      songs: songRow
        ? {
            song_category: songRow.song_category ?? undefined,
            song_originalartist: songRow.song_originalartist ?? undefined,
            categories: {
              category_canonid: songRow.categories?.category_canonid ?? undefined,
              category_artwork: songRow.categories?.category_artwork,
            },
          }
        : undefined,
    }
  })

  const subvenues = show.subvenues
  const venue_id =
    subvenues?.venues?.venue_id ?? (show as any).venue_id ?? undefined

  return {
    show_iscanon: show.show_iscanon ?? false,
    show_tour: show.show_tour ?? "",
    show_id: show.show_id,
    show_date: show.show_date,
    show_group: show.show_group ?? "",
    show_subvenue: show.show_subvenue ?? "",
    show_detail: show.show_detail ?? null,
    show_alert: show.show_alert ?? null,
    show_canonid: show.show_canonid ?? null,
    show_venue_location: show.show_venue_location ?? null,
    show_subvenue_venue: show.show_subvenue_venue,
    venue_id,
    attended: attendedShowIds.includes(show.show_id),
    show_wl_link: show.show_wl_link,
    show_length,
    show_rarity,
    show_gap,
    setlist_entries: songEntries,
  }
}

/**
 * Build a SlotShowData row for a single show from its setlist entries.
 */
export function processSlotsData(
  showId: string,
  showDate: string,
  entries: RawSetlistEntry[],
): SlotShowData {
  const slot: SlotShowData = {
    show_id: showId,
    Show_Date: showDate,
    Set_1_Opener: null,
    Set_1_Closer: null,
    Set_2_Opener: null,
    Set_2_Closer: null,
    Set_3_Opener: null,
    Set_3_Closer: null,
    Set_4_Opener: null,
    Set_4_Closer: null,
    Set_5_Opener: null,
    Set_5_Closer: null,
    Encore_1: null,
    Encore_2: null,
    Encore_3: null,
  }

  for (const entry of entries) {
    const key = PLACEMENT_TO_SLOT_KEY[entry.entry_placement]
    if (!key || key === "show_id" || key === "Show_Date") continue

    const songsRel = entry.songs
    const songRow = Array.isArray(songsRel) ? songsRel[0] : songsRel
    const songId = songRow?.song_id

    const songEntry: SongEntryWithId = {
      song: entry.entry_song,
      setnum: entry.entry_setnum,
      song_id: songId,
    }

    const existing = slot[key] as SongEntryWithId[] | null
    if (existing) {
      existing.push(songEntry)
    } else {
      slot[key] = [songEntry]
    }
  }

  // Sort each slot's songs by setnum ascending (setlist order)
  for (const key of Object.keys(slot)) {
    if (key === "show_id" || key === "Show_Date") continue
    const arr = slot[key] as SongEntryWithId[] | null
    if (Array.isArray(arr)) {
      arr.sort((a, b) => a.setnum - b.setnum)
    }
  }

  return slot
}

/**
 * Aggregate tour setlist entries by placement category to produce top-slot SlotData.
 * Groups: Show Openers (Set 1 Opener only), Set Openers, Set Closers, Encores.
 */
export function processTourDataWithCategories(
  entries: RawSetlistEntry[],
): SlotData[] {
  const showOpeners = new Map<string, { count: number; artwork?: string }>()
  const setOpeners = new Map<string, { count: number; artwork?: string }>()
  const setClosers = new Map<string, { count: number; artwork?: string }>()
  const encores = new Map<string, { count: number; artwork?: string }>()

  const seenShowOpener = new Set<string>()
  const seenSetOpener = new Set<string>()
  const seenSetCloser = new Set<string>()
  const seenEncore = new Set<string>()

  for (const entry of entries) {
    const placement = entry.entry_placement
    const show = entry.entry_show ?? ""
    const songName = entry.entry_song

    const songsRel = entry.songs
    const songRow = Array.isArray(songsRel) ? songsRel[0] : songsRel
    const artwork = songRow?.categories?.category_artwork

    const addTo = (
      map: Map<string, { count: number; artwork?: string }>,
      seen: Set<string>,
    ) => {
      const key = `${show}|${placement}|${songName}`
      if (seen.has(key)) return
      seen.add(key)
      const existing = map.get(songName)
      if (existing) {
        existing.count += 1
      } else {
        map.set(songName, { count: 1, artwork })
      }
    }

    if (placement === "Set 1 Opener") addTo(showOpeners, seenShowOpener)
    if (placement.includes("Opener")) addTo(setOpeners, seenSetOpener)
    if (placement.includes("Closer")) addTo(setClosers, seenSetCloser)
    if (placement.includes("Encore")) addTo(encores, seenEncore)
  }

  const toSlotData = (
    map: Map<string, { count: number; artwork?: string }>,
    title: string,
  ): SlotData => {
    const data = Array.from(map.entries())
      .sort((a, b) => {
        if (b[1].count !== a[1].count) return b[1].count - a[1].count
        return a[0].localeCompare(b[0])
      })
      .slice(0, 8)
      .map(([song, { count, artwork }]) => ({
        left: song,
        right: count,
        ...(artwork && { artwork }),
      }))
    return {
      title,
      headerLeft: "Song",
      headerRight: "Count",
      data,
    }
  }

  const result: SlotData[] = []
  if (showOpeners.size > 0) result.push(toSlotData(showOpeners, "Show Openers"))
  if (setOpeners.size > 0) result.push(toSlotData(setOpeners, "Set Openers"))
  if (setClosers.size > 0) result.push(toSlotData(setClosers, "Set Closers"))
  if (encores.size > 0) result.push(toSlotData(encores, "Encores"))

  return result
}
