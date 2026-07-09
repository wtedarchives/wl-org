"use client"

import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-context"
import { fetchTourCore } from "@/lib/archive/fetch-tour-core"
import { archiveQueryKeys } from "@/lib/archive-query-keys"
import { getTourArchiveUrl } from "@/lib/tour-archive-url"
import { useAttendeeData } from "@/hooks/use-attendee-data"
import { useShowRatings } from "@/hooks/use-show-ratings"
import {
  processSlotsData,
  processTourDataWithCategories,
  SLOT_KEYS,
  type RawSetlistEntry,
} from "@/lib/tour-data-processing"
import { supabase } from "@/lib/supabase"
import type {
  Tour,
  TourShow,
  SlotShowData,
  SlotData,
} from "@/types/tour"

const EMPTY_TOUR_SHOWS: TourShow[] = []
const EMPTY_TOURS: Tour[] = []
const EMPTY_RAW_ENTRIES: RawSetlistEntry[] = []

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
  const { session } = useAuth()
  const profileId = session?.profileId ?? null

  const { data, isLoading: queryLoading } = useQuery({
    queryKey: archiveQueryKeys.tourCore(tourId ?? "", profileId),
    queryFn: () => fetchTourCore(tourId!, profileId),
    enabled: Boolean(tourId && supabase),
  })

  const [hasGuestAppearances, setHasGuestAppearances] = useState(false)
  const [uniqueSongCount, setUniqueSongCount] = useState(0)

  useEffect(() => {
    if (!data?.redirectTourId) return
    router.replace(getTourArchiveUrl(data.redirectTourId), { scroll: false })
  }, [data?.redirectTourId, router])

  useEffect(() => {
    if (!data || data.redirectTourId) return
    setHasGuestAppearances(data.hasGuestAppearances)
    setUniqueSongCount(data.uniqueSongCount)
  }, [
    data,
    data?.hasGuestAppearances,
    data?.uniqueSongCount,
    data?.redirectTourId,
    tourId,
  ])

  const currentTour = data?.redirectTourId ? null : (data?.currentTour ?? null)
  const tours = data?.tours ?? EMPTY_TOURS
  const shows = data?.shows ?? EMPTY_TOUR_SHOWS
  const rawEntries = data?.rawEntries ?? EMPTY_RAW_ENTRIES
  const showsWithSetlists = useMemo(
    () => new Set(data?.showsWithSetlists ?? []),
    [data?.showsWithSetlists],
  )
  const showsWithReleases = useMemo(
    () => new Set(data?.showsWithReleases ?? []),
    [data?.showsWithReleases],
  )
  const showsWithRadioIds = useMemo(
    () => new Set(data?.showsWithRadioIds ?? []),
    [data?.showsWithRadioIds],
  )
  const isLoading = Boolean(tourId && supabase && queryLoading)

  const showIdsKey = shows.map((s) => s.show_id).join("\0")
  const showSlices: ShowSlice[] = useMemo(
    () => shows.map((s) => ({ show_id: s.show_id })),
    [showIdsKey, shows],
  )
  const { attendeeCounts } = useAttendeeData(showSlices)
  const { showRatings } = useShowRatings(showSlices)

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
