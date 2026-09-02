import { INDEX_SKIP_SONG_IMPROV_JAM } from "@/components/dpro/setlist/display-setlist-table.constants"
import { excludeRecordingSessionShows } from "@/lib/show-recording-session-filter"
import {
  processShowData,
  type RawSetlistEntry,
  type RawShowRow,
} from "@/lib/tour-data-processing"
import { supabase } from "@/lib/supabase"
import type { Tour, TourShow } from "@/types/tour"

const DEFAULT_TOUR_NAME = "2025 Holiday Run"
const BATCH_SIZE = 1000
const PAGE_SIZE = 1000

export interface TourCoreData {
  currentTour: Tour | null
  tours: Tour[]
  shows: TourShow[]
  rawEntries: RawSetlistEntry[]
  showsWithSetlists: string[]
  showsWithReleases: string[]
  showsWithRadioIds: string[]
  hasGuestAppearances: boolean
  uniqueSongCount: number
  /** When the requested tour id is invalid, redirect to this tour. */
  redirectTourId?: string
}

export async function fetchTourCore(
  tourId: string,
  profileId: string | null | undefined,
): Promise<TourCoreData> {
  const empty: TourCoreData = {
    currentTour: null,
    tours: [],
    shows: [],
    rawEntries: [],
    showsWithSetlists: [],
    showsWithReleases: [],
    showsWithRadioIds: [],
    hasGuestAppearances: false,
    uniqueSongCount: 0,
  }

  if (!supabase) {
    throw new Error("Supabase client is not configured")
  }

  const client = supabase

  const { data: tourRow, error: tourError } = await client
    .from("tours")
    .select("tour_id, tour, tour_canonid, tour_showfields")
    .eq("tour_id", tourId)
    .single()

  if (tourError || !tourRow) {
    const { data: defaultTour } = await client
      .from("tours")
      .select("tour_id, tour, tour_canonid, tour_showfields")
      .eq("tour", DEFAULT_TOUR_NAME)
      .single()

    if (defaultTour) {
      return { ...empty, redirectTourId: defaultTour.tour_id as string }
    }
    return empty
  }

  const tourName = tourRow.tour as string
  const currentTour: Tour = {
    tour_id: tourRow.tour_id,
    tour: tourName,
    tour_canonid: tourRow.tour_canonid ?? 0,
    tour_showfields: tourRow.tour_showfields ?? undefined,
  }

  const { data: toursData, error: toursError } = await client
    .from("tours")
    .select("tour_id, tour, tour_canonid, tour_showfields")
    .order("tour_canonid", { ascending: true })

  const tours =
    !toursError && toursData
      ? (
          toursData as {
            tour_id: string
            tour: string
            tour_canonid?: number
            tour_showfields?: boolean
          }[]
        ).map((t) => ({
          tour_id: t.tour_id,
          tour: t.tour,
          tour_canonid: t.tour_canonid ?? 0,
          tour_showfields: t.tour_showfields,
        }))
      : []

  const { data: showsData, error: showsError } = await client
    .from("shows")
    .select(
      `
            show_id,
            show_date,
            show_iscanon,
            show_tour,
            show_group,
            show_subvenue,
            show_detail,
            show_alert,
            show_canonid,
            show_venue_location,
            show_subvenue_venue,
            show_wl_link,
            show_issetlistgame,
            show_length,
            show_rarity,
            show_gap,
            subvenues:show_subvenue(
              venues:subvenue_venue(
                venue_id
              )
            )
          `,
    )
    .eq("show_tour", tourName)
    .order("show_date", { ascending: true })
    .order("show_canonid", { ascending: true, nullsFirst: true })
    .order("show_group", { ascending: true })

  if (showsError) throw showsError

  const rawShows = excludeRecordingSessionShows(
    (showsData ?? []) as RawShowRow[],
  )
  const showIds = rawShows.map((s) => s.show_id)

  let attendedShowIds: string[] = []
  if (profileId) {
    try {
      const { data: attendedData } = await client
        .from("user_attended_shows")
        .select("show_id")
        .eq("user_id", profileId)
      attendedShowIds = (attendedData ?? []).map((r) => r.show_id)
    } catch {
      // ignore
    }
  }

  const processedShows = rawShows.map((show) => {
    const subvenues = show.subvenues
    const venueId = subvenues?.venues?.venue_id
    return {
      ...show,
      venue_id: venueId,
    }
  }) as RawShowRow[]

  let allEntries: RawSetlistEntry[] = []
  if (showIds.length > 0) {
    const chunks: string[][] = []
    for (let i = 0; i < showIds.length; i += 500) {
      chunks.push(showIds.slice(i, i + 500))
    }
    for (const chunk of chunks) {
      let page = 0
      let hasMore = true
      while (hasMore) {
        const { data: entriesData, error: entriesError } = await client
          .from("setlist_entries")
          .select(
            `
                  entry_id,
                  entry_song,
                  entry_placement,
                  entry_setnum,
                  entry_length,
                  entry_short,
                  entry_show,
                  songs:entry_song(
                    song_id,
                    song,
                    song_displayname,
                    song_category,
                    song_originalartist,
                    song_categoryorder,
                    categories(
                      category_artwork,
                      category_canonid
                    )
                  )
                `,
          )
          .in("entry_show", chunk)
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

        if (entriesError) throw entriesError
        if (entriesData && entriesData.length > 0) {
          allEntries = allEntries.concat(entriesData as RawSetlistEntry[])
          page += 1
          hasMore = entriesData.length === PAGE_SIZE
        } else {
          hasMore = false
        }
      }
    }
  }

  const entriesByShow = new Map<string, RawSetlistEntry[]>()
  for (const e of allEntries) {
    const sid = e.entry_show
    if (sid) {
      const list = entriesByShow.get(sid) ?? []
      list.push(e)
      entriesByShow.set(sid, list)
    }
  }

  const shows = processedShows.map((show) => {
    const entries = entriesByShow.get(show.show_id) ?? []
    return processShowData(show, entries, attendedShowIds)
  })

  const entryIds = allEntries
    .map((e) => e.entry_id)
    .filter((id): id is string => Boolean(id))

  let hasGuestAppearances = false
  if (entryIds.length > 0) {
    for (let i = 0; i < entryIds.length; i += 500) {
      const chunk = entryIds.slice(i, i + 500)
      const { data: guestData } = await client
        .from("setlist_entry_guests")
        .select("setlist_entry_id")
        .in("setlist_entry_id", chunk)
        .range(0, 0)
      if (Array.isArray(guestData) && guestData.length > 0) {
        hasGuestAppearances = true
        break
      }
    }
  }

  const uniqueSongCount = new Set(
    allEntries
      .filter((e) => e.entry_song !== INDEX_SKIP_SONG_IMPROV_JAM)
      .map((e) => e.entry_song),
  ).size

  let showsWithSetlists: string[] = []
  let showsWithReleases: string[] = []
  let showsWithRadioIds: string[] = []

  if (showIds.length > 0) {
    try {
      const { data: setlistData } = await client
        .from("show_setlists")
        .select("show_id")
        .in("show_id", showIds)
      showsWithSetlists = (setlistData ?? []).map(
        (r: { show_id: string }) => r.show_id,
      )
    } catch {
      showsWithSetlists = []
    }

    try {
      const { count } = await client
        .from("releases_shows")
        .select("*", { count: "exact", head: true })
        .in("show_id", showIds)
      const totalBatches = Math.ceil((count ?? 0) / BATCH_SIZE)
      let allReleaseShows: { show_id: string }[] = []
      for (let i = 0; i < totalBatches; i += 1) {
        const start = i * BATCH_SIZE
        const end = Math.min(start + BATCH_SIZE - 1, (count ?? 0) - 1)
        const { data } = await client
          .from("releases_shows")
          .select("show_id")
          .in("show_id", showIds)
          .range(start, end)
        if (data) allReleaseShows = allReleaseShows.concat(data as { show_id: string }[])
      }
      showsWithReleases = allReleaseShows.map((r) => r.show_id)
    } catch {
      showsWithReleases = []
    }

    try {
      const { data: radioData } = await client
        .from("setlist_entries")
        .select("entry_show")
        .in("entry_show", showIds)
        .not("radio_id", "is", null)
      showsWithRadioIds = (radioData ?? [])
        .map((r: { entry_show?: string }) => r.entry_show)
        .filter(Boolean) as string[]
    } catch {
      showsWithRadioIds = []
    }
  }

  return {
    currentTour,
    tours,
    shows,
    rawEntries: allEntries,
    showsWithSetlists,
    showsWithReleases,
    showsWithRadioIds,
    hasGuestAppearances,
    uniqueSongCount,
  }
}
