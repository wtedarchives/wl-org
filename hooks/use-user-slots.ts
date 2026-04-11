"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useUserShows } from "@/hooks/use-user-shows"
import type { UserSlotShowData, UserSongEntryWithId } from "@/types/user-slots"

const PAGE_SIZE = 1000
const CHUNK_SIZE = 200

const PLACEMENT_TO_SLOT_KEY: Record<string, keyof UserSlotShowData> = {
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
  "Set 6 Opener": "Set_6_Opener",
  "Set 6 Closer": "Set_6_Closer",
  "Encore 1": "Encore_1",
  "Encore 2": "Encore_2",
  "Encore 3": "Encore_3",
}

function createEmptySlot(showId: string, showDate: string): UserSlotShowData {
  return {
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
    Set_6_Opener: null,
    Set_6_Closer: null,
    Encore_1: null,
    Encore_2: null,
    Encore_3: null,
  }
}

export function useUserSlots(userId: string | null) {
  const { shows, isLoading: showsLoading, loadingProgress: showsProgress } =
    useUserShows(userId)

  const [slots, setSlots] = useState<UserSlotShowData[]>([])
  const [activeColumns, setActiveColumns] = useState<string[]>([])
  const [songIdMap, setSongIdMap] = useState<Record<string, string>>({})
  const [songDisplayNameMap, setSongDisplayNameMap] = useState<
    Record<string, string | null>
  >({})
  const [hasSlotEntries, setHasSlotEntries] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!userId || !supabase) {
      setSlots([])
      setActiveColumns([])
      setSongIdMap({})
      setSongDisplayNameMap({})
      setHasSlotEntries(false)
      setLoadingProgress(100)
      setIsLoading(false)
      return
    }

    if (showsLoading) {
      setLoadingProgress(showsProgress)
      setIsLoading(true)
      return
    }

    if (shows.length === 0) {
      setSlots([])
      setActiveColumns([])
      setSongIdMap({})
      setSongDisplayNameMap({})
      setHasSlotEntries(false)
      setLoadingProgress(100)
      setIsLoading(false)
      return
    }

    async function fetchSlotsData() {
      const client = supabase
      if (!client) return
      try {
        setLoadingProgress(50)
        setErrorMessage(null)

        const { data: placementsData, error: placementsError } = await client
          .from("placements")
          .select("placements, placement_order")
          .order("placement_order")

        if (placementsError) throw placementsError

        setLoadingProgress(55)

        const showIds = shows.map((s) => s.show_id)
        const showIdChunks: string[][] = []
        for (let i = 0; i < showIds.length; i += CHUNK_SIZE) {
          showIdChunks.push(showIds.slice(i, i + CHUNK_SIZE))
        }

        const showDateMap = new Map(shows.map((s) => [s.show_id, s.show_date]))
        const showCanonIdMap = new Map<string, number>()

        let allEntries: Array<{
          entry_show: string
          entry_song: string
          entry_placement: string
          entry_setnum: number
          songs?: {
            song_id?: string
            song_displayname?: string | null
          }
        }> = []

        for (let i = 0; i < showIdChunks.length; i++) {
          const chunk = showIdChunks[i]
          let page = 0
          let hasMore = true

          while (hasMore) {
            const { data, error } = await client
              .from("setlist_entries")
              .select(
                `
                entry_show,
                entry_song,
                entry_placement,
                entry_setnum,
                songs:entry_song(song_id, song_displayname)
              `
              )
              .in("entry_show", chunk)
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

            if (error) throw error

            if (data && data.length > 0) {
              allEntries = allEntries.concat(data as typeof allEntries)
              page++
              const progressPerChunk = 35 / showIdChunks.length
              const chunkProgress = (i / showIdChunks.length) * 35
              setLoadingProgress(
                Math.min(90, 55 + chunkProgress + (page * progressPerChunk) / 5)
              )
              hasMore = data.length === PAGE_SIZE
            } else {
              hasMore = false
            }
          }
        }

        const { data: showsData } = await client
          .from("shows")
          .select("show_id, show_canonid")
          .in("show_id", showIds)

        ;(showsData ?? []).forEach(
          (r: { show_id: string; show_canonid?: number | null }) => {
            showCanonIdMap.set(r.show_id, r.show_canonid ?? 999999)
          }
        )

        setLoadingProgress(92)

        const slotsByShow = new Map<string, UserSlotShowData>()
        const songIdMapLocal: Record<string, string> = {}
        const songDisplayNameMapLocal: Record<string, string | null> = {}

        for (const showId of showIds) {
          const showDate = showDateMap.get(showId) ?? ""
          slotsByShow.set(showId, createEmptySlot(showId, showDate))
        }

        for (const entry of allEntries) {
          if (entry.entry_placement.startsWith("Main Set")) continue

          const key = PLACEMENT_TO_SLOT_KEY[entry.entry_placement]
          if (!key || key === "show_id" || key === "Show_Date") continue

          const slot = slotsByShow.get(entry.entry_show)
          if (!slot) continue

          const songsRel = entry.songs
          const songRow = Array.isArray(songsRel) ? songsRel[0] : songsRel
          const songId = songRow?.song_id
          const songDisplayName = songRow?.song_displayname ?? null

          if (songId && entry.entry_song) {
            songIdMapLocal[entry.entry_song] = songId
            songDisplayNameMapLocal[entry.entry_song] = songDisplayName
          }

          const songEntry: UserSongEntryWithId = {
            song: entry.entry_song,
            song_displayname: songDisplayName,
            setnum: entry.entry_setnum,
            song_id: songId,
          }

          const existing = slot[key] as UserSongEntryWithId[] | null
          if (existing) {
            existing.push(songEntry)
          } else {
            ;(slot as Record<string, UserSongEntryWithId[] | null>)[key] = [
              songEntry,
            ]
          }
        }

        for (const slot of slotsByShow.values()) {
          for (const key of Object.keys(slot)) {
            if (key === "show_id" || key === "Show_Date") continue
            const arr = slot[key] as UserSongEntryWithId[] | null
            if (Array.isArray(arr)) {
              arr.sort((a, b) => a.setnum - b.setnum)
            }
          }
        }

        const columnsWithData = new Set<string>()
        slotsByShow.forEach((slot) => {
          Object.entries(slot).forEach(([k, v]) => {
            if (v && k !== "show_id" && k !== "Show_Date") {
              columnsWithData.add(k)
            }
          })
        })

        const orderedColumns =
          placementsData
            ?.filter((p) =>
              columnsWithData.has(p.placements.replace(/\s+/g, "_"))
            )
            .map((p) => p.placements.replace(/\s+/g, "_")) ?? []

        const slotsArray = Array.from(slotsByShow.values()).sort((a, b) => {
          const dateA = a.Show_Date
          const dateB = b.Show_Date
          if (dateA !== dateB) return dateA.localeCompare(dateB)
          const canonA = showCanonIdMap.get(a.show_id) ?? 999999
          const canonB = showCanonIdMap.get(b.show_id) ?? 999999
          return canonA - canonB
        })

        const hasEntries = slotsArray.some((slot) =>
          Object.keys(slot).some(
            (k) =>
              k !== "show_id" &&
              k !== "Show_Date" &&
              slot[k] !== null &&
              Array.isArray(slot[k]) &&
              (slot[k] as UserSongEntryWithId[]).length > 0
          )
        )

        setSlots(slotsArray)
        setActiveColumns(orderedColumns)
        setSongIdMap(songIdMapLocal)
        setSongDisplayNameMap(songDisplayNameMapLocal)
        setHasSlotEntries(hasEntries)
      } catch (err) {
        console.error("Error fetching user slots:", err)
        setErrorMessage("Failed to load slots data")
        setSlots([])
        setActiveColumns([])
        setHasSlotEntries(false)
      } finally {
        setLoadingProgress(100)
        setIsLoading(false)
      }
    }

    fetchSlotsData()
  }, [userId, shows, showsLoading])

  const isLoadingCombined = showsLoading || isLoading
  const combinedProgress = showsLoading ? showsProgress : loadingProgress

  return {
    slots,
    activeColumns,
    songIdMap,
    songDisplayNameMap,
    hasSlotEntries,
    attendedShowIds: shows.map((s) => s.show_id),
    isLoading: isLoadingCombined,
    loadingProgress: combinedProgress,
    errorMessage,
  }
}
