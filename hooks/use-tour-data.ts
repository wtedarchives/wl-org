"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { supabase } from "@/lib/supabase"
import { getTourArchiveUrl } from "@/lib/tour-archive-url"
import { useAuth } from "@/components/auth-context"
import { useAttendeeData } from "@/hooks/use-attendee-data"
import { useShowRatings } from "@/hooks/use-show-ratings"
import {
  processShowData,
  processSlotsData,
  processTourDataWithCategories,
  SLOT_KEYS,
  type RawSetlistEntry,
  type RawShowRow,
} from "@/lib/tour-data-processing"
import type {
  Tour,
  TourShow,
  SlotShowData,
  SlotData,
} from "@/types/tour"
import { INDEX_SKIP_SONG_IMPROV_JAM } from "@/components/dpro/setlist/display-setlist-table.constants"

const DEFAULT_TOUR_NAME = "2025 Holiday Run"
const BATCH_SIZE = 1000
const PAGE_SIZE = 1000

interface ShowSlice {
  show_id: string
}

export interface UseTourDataResult {
  currentTour: Tour | null
  currentTourId: string | null
  currentTourShowFields: boolean | undefined
  shows: TourShow[]
  tours: Tour[]
  slots: SlotShowData[]
  activeColumns: (keyof SlotShowData)[]
  hasSlotEntries: boolean
  songIdMap: Record<string, string>
  songDisplayNameMap: Record<string, string | null>
  topSlots: SlotData[]
  hasTourSetlistEntries: boolean
  hasGuestAppearances: boolean
  uniqueSongCount: number
  showsWithSetlists: Set<string>
  attendeeCounts: Record<string, number>
  showRatings: Record<string, number>
  showsWithReleases: Set<string>
  showsWithRadioIds: Set<string>
  isLoading: boolean
  setHasGuestAppearances: (value: boolean) => void
  setUniqueSongCount: (value: number) => void
}

export function useTourData(tourId: string | undefined): UseTourDataResult {
  const router = useRouter()
  const { user } = useAuth()
  const [currentTour, setCurrentTour] = useState<Tour | null>(null)
  const [tours, setTours] = useState<Tour[]>([])
  const [shows, setShows] = useState<TourShow[]>([])
  const [rawEntries, setRawEntries] = useState<RawSetlistEntry[]>([])
  const [showsWithSetlists, setShowsWithSetlists] = useState<Set<string>>(
    new Set(),
  )
  const [showsWithReleases, setShowsWithReleases] = useState<Set<string>>(
    new Set(),
  )
  const [showsWithRadioIds, setShowsWithRadioIds] = useState<Set<string>>(
    new Set(),
  )
  const [isLoading, setIsLoading] = useState(true)
  const [hasGuestAppearances, setHasGuestAppearances] = useState(false)
  const [uniqueSongCount, setUniqueSongCount] = useState(0)

  const showSlices: ShowSlice[] = useMemo(
    () => shows.map((s) => ({ show_id: s.show_id })),
    [shows],
  )
  const { attendeeCounts } = useAttendeeData(showSlices)
  const { showRatings } = useShowRatings(showSlices)

  useEffect(() => {
    if (!supabase || !tourId) {
      setIsLoading(false)
      return
    }

    const client = supabase

    async function fetchTourData() {
      try {
        setIsLoading(true)

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
            router.replace(getTourArchiveUrl(defaultTour.tour_id), {
              scroll: false,
            })
          }
          setCurrentTour(null)
          setShows([])
          setRawEntries([])
          setTours([])
          setIsLoading(false)
          return
        }

        const tourName = tourRow.tour as string
        const tour: Tour = {
          tour_id: tourRow.tour_id,
          tour: tourName,
          tour_canonid: tourRow.tour_canonid ?? 0,
          tour_showfields: tourRow.tour_showfields ?? undefined,
        }
        setCurrentTour(tour)

        const { data: toursData, error: toursError } = await client
          .from("tours")
          .select("tour_id, tour, tour_canonid, tour_showfields")
          .order("tour_canonid", { ascending: true })

        if (!toursError && toursData) {
          setTours(
            (
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
            })),
          )
        }

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

        const rawShows = (showsData ?? []) as RawShowRow[]
        const showIds = rawShows.map((s) => s.show_id)

        let attendedShowIds: string[] = []
        if (session?.profileId) {
          try {
            const { data: attendedData } = await client
              .from("user_attended_shows")
              .select("show_id")
              .eq("user_id", session?.profileId)
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
                allEntries = allEntries.concat(
                  entriesData as RawSetlistEntry[],
                )
                page += 1
                hasMore = entriesData.length === PAGE_SIZE
              } else {
                hasMore = false
              }
            }
          }
        }
        setRawEntries(allEntries)

        const entriesByShow = new Map<string, RawSetlistEntry[]>()
        for (const e of allEntries) {
          const sid = e.entry_show
          if (sid) {
            const list = entriesByShow.get(sid) ?? []
            list.push(e)
            entriesByShow.set(sid, list)
          }
        }

        const processed = processedShows.map((show) => {
          const entries = entriesByShow.get(show.show_id) ?? []
          return processShowData(show, entries, attendedShowIds)
        })
        setShows(processed)

        const entryIds = allEntries
          .map((e) => e.entry_id)
          .filter((id): id is string => Boolean(id))

        let hasGuests = false
        if (entryIds.length > 0) {
          for (let i = 0; i < entryIds.length; i += 500) {
            const chunk = entryIds.slice(i, i + 500)
            const { data: guestData } = await client
              .from("setlist_entry_guests")
              .select("setlist_entry_id")
              .in("setlist_entry_id", chunk)
              .range(0, 0)
            if (Array.isArray(guestData) && guestData.length > 0) {
              hasGuests = true
              break
            }
          }
        }
        setHasGuestAppearances(hasGuests)

        const uniqueSongs = new Set(
          allEntries
            .filter((e) => e.entry_song !== INDEX_SKIP_SONG_IMPROV_JAM)
            .map((e) => e.entry_song),
        ).size
        setUniqueSongCount(uniqueSongs)

        if (showIds.length > 0) {
          try {
            const { data: setlistData } = await client
              .from("show_setlists")
              .select("show_id")
              .in("show_id", showIds)
            setShowsWithSetlists(
              new Set((setlistData ?? []).map((r: { show_id: string }) => r.show_id)),
            )
          } catch {
            setShowsWithSetlists(new Set())
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
            setShowsWithReleases(new Set(allReleaseShows.map((r) => r.show_id)))
          } catch {
            setShowsWithReleases(new Set())
          }

          try {
            const { data: radioData } = await client
              .from("setlist_entries")
              .select("entry_show")
              .in("entry_show", showIds)
              .not("radio_id", "is", null)
            setShowsWithRadioIds(
              new Set(
                (radioData ?? [])
                  .map((r: { entry_show?: string }) => r.entry_show)
                  .filter(Boolean) as string[],
              ),
            )
          } catch {
            setShowsWithRadioIds(new Set())
          }
        } else {
          setShowsWithSetlists(new Set())
          setShowsWithReleases(new Set())
          setShowsWithRadioIds(new Set())
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching tour data:", err)
        setCurrentTour(null)
        setShows([])
        setRawEntries([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTourData()
  }, [tourId, router, session?.profileId])

  const entriesByShow = useMemo(() => {
    const map = new Map<string, RawSetlistEntry[]>()
    for (const e of rawEntries) {
      const sid = e.entry_show
      if (sid) {
        const list = map.get(sid) ?? []
        list.push(e)
        map.set(sid, list)
      }
    }
    return map
  }, [rawEntries])

  const slots = useMemo(() => {
    return shows.map((show) =>
      processSlotsData(
        show.show_id,
        show.show_date,
        entriesByShow.get(show.show_id) ?? [],
      ),
    )
  }, [shows, entriesByShow])

  const activeColumns = useMemo(() => {
    const used = new Set<keyof SlotShowData>()
    for (const slot of slots) {
      for (const key of SLOT_KEYS) {
        const val = slot[key]
        if (Array.isArray(val) && val.length > 0) used.add(key)
      }
    }
    return SLOT_KEYS.filter((k) => used.has(k))
  }, [slots])

  const hasSlotEntries = activeColumns.length > 0

  const songIdMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const e of rawEntries) {
      const songsRel = e.songs
      const songRow = Array.isArray(songsRel) ? songsRel[0] : songsRel
      const songId = songRow?.song_id
      if (songId && e.entry_song) {
        map[e.entry_song] = songId
      }
    }
    return map
  }, [rawEntries])

  const songDisplayNameMap = useMemo(() => {
    const map: Record<string, string | null> = {}
    for (const e of rawEntries) {
      const songsRel = e.songs
      const songRow = Array.isArray(songsRel) ? songsRel[0] : songsRel
      const displayName = songRow?.song_displayname?.trim() || null
      if (e.entry_song) {
        map[e.entry_song] = displayName
      }
    }
    return map
  }, [rawEntries])

  const topSlots = useMemo(
    () => processTourDataWithCategories(rawEntries),
    [rawEntries],
  )

  const hasTourSetlistEntries = rawEntries.length > 0

  return {
    currentTour,
    currentTourId: currentTour?.tour_id ?? null,
    currentTourShowFields: currentTour?.tour_showfields,
    shows,
    tours,
    slots,
    activeColumns,
    hasSlotEntries,
    songIdMap,
    songDisplayNameMap,
    topSlots,
    hasTourSetlistEntries,
    hasGuestAppearances,
    uniqueSongCount,
    showsWithSetlists,
    attendeeCounts,
    showRatings,
    showsWithReleases,
    showsWithRadioIds,
    isLoading,
    setHasGuestAppearances,
    setUniqueSongCount,
  }
}
