"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { UserGuest, GuestsByCategory } from "@/types/user-guests"

const PAGE_SIZE = 1000
const CHUNK_SIZE = 200

export function useUserGuests(userId: string | null) {
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [guestsByCategory, setGuestsByCategory] = useState<GuestsByCategory>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUserGuests() {
      if (!userId || !supabase) {
        setLoading(false)
        setLoadingProgress(100)
        return
      }

      try {
        setLoading(true)
        setLoadingProgress(5)
        setError(null)

        // 1. Get user's attended shows with pagination
        let allAttendedShows: Array<{ show_id: string }> = []
        let page = 0
        let hasMore = true

        while (hasMore) {
          const { data, error: fetchError } = await supabase
            .from("user_attended_shows")
            .select("show_id")
            .eq("user_id", userId)
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

          if (fetchError) throw fetchError

          if (data && data.length > 0) {
            allAttendedShows = [...allAttendedShows, ...data]
            page++
            setLoadingProgress(Math.min(20, 5 + page * 3))
            hasMore = data.length === PAGE_SIZE
          } else {
            hasMore = false
          }
        }

        if (allAttendedShows.length === 0) {
          setGuestsByCategory({})
          setLoadingProgress(100)
          setTimeout(() => setLoading(false), 500)
          return
        }

        const showIds = allAttendedShows.map((s) => s.show_id)
        const showIdChunks: string[][] = []
        for (let i = 0; i < showIds.length; i += CHUNK_SIZE) {
          showIdChunks.push(showIds.slice(i, i + CHUNK_SIZE))
        }

        // 2. Get setlist entries for those shows with pagination and chunking
        let allSetlistEntries: Array<{ entry_id: string; entry_show: string }> =
          []

        for (let i = 0; i < showIdChunks.length; i++) {
          const currentChunk = showIdChunks[i]
          page = 0
          hasMore = true

          while (hasMore) {
            const { data, error: fetchError } = await supabase
              .from("setlist_entries")
              .select("entry_id, entry_show")
              .in("entry_show", currentChunk)
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

            if (fetchError) throw fetchError

            if (data && data.length > 0) {
              allSetlistEntries = [...allSetlistEntries, ...data]
              page++
              const progressPerChunk = 20 / showIdChunks.length
              const chunkProgress = (i / showIdChunks.length) * 20
              const pageProgress =
                (page * progressPerChunk) /
                Math.ceil(currentChunk.length / PAGE_SIZE)
              setLoadingProgress(
                Math.min(40, 20 + chunkProgress + pageProgress)
              )
              hasMore = data.length === PAGE_SIZE
            } else {
              hasMore = false
            }
          }
        }

        if (allSetlistEntries.length === 0) {
          setGuestsByCategory({})
          setLoadingProgress(100)
          setTimeout(() => setLoading(false), 500)
          return
        }

        const entryToShowMap: Record<string, string> = {}
        allSetlistEntries.forEach((entry) => {
          entryToShowMap[entry.entry_id] = entry.entry_show
        })

        const entryIds = allSetlistEntries.map((e) => e.entry_id)
        const entryIdChunks: string[][] = []
        for (let i = 0; i < entryIds.length; i += CHUNK_SIZE) {
          entryIdChunks.push(entryIds.slice(i, i + CHUNK_SIZE))
        }

        // 3. Get guest appearances for those setlist entries
        let allGuestJoins: Array<{
          setlist_entry_id: string
          guest_id: string
        }> = []

        for (let i = 0; i < entryIdChunks.length; i++) {
          const currentChunk = entryIdChunks[i]
          page = 0
          hasMore = true

          while (hasMore) {
            const { data, error: fetchError } = await supabase
              .from("setlist_entry_guests")
              .select("setlist_entry_id, guest_id")
              .in("setlist_entry_id", currentChunk)
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

            if (fetchError) throw fetchError

            if (data && data.length > 0) {
              allGuestJoins = [...allGuestJoins, ...data]
              page++
              const progressPerChunk = 20 / entryIdChunks.length
              const chunkProgress = (i / entryIdChunks.length) * 20
              const pageProgress =
                (page * progressPerChunk) /
                Math.ceil(currentChunk.length / PAGE_SIZE)
              setLoadingProgress(
                Math.min(60, 40 + chunkProgress + pageProgress)
              )
              hasMore = data.length === PAGE_SIZE
            } else {
              hasMore = false
            }
          }
        }

        if (allGuestJoins.length === 0) {
          setGuestsByCategory({})
          setLoadingProgress(100)
          setTimeout(() => setLoading(false), 500)
          return
        }

        const guestIds = [...new Set(allGuestJoins.map((j) => j.guest_id))]
        const guestIdChunks: string[][] = []
        for (let i = 0; i < guestIds.length; i += CHUNK_SIZE) {
          guestIdChunks.push(guestIds.slice(i, i + CHUNK_SIZE))
        }

        // 4. Get guest details
        let allGuests: Array<{
          guest_id: string
          guest: string
          guest_category: string
        }> = []

        for (let i = 0; i < guestIdChunks.length; i++) {
          const currentChunk = guestIdChunks[i]
          page = 0
          hasMore = true

          while (hasMore) {
            const { data, error: fetchError } = await supabase
              .from("guests")
              .select("guest_id, guest, guest_category")
              .in("guest_id", currentChunk)
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

            if (fetchError) throw fetchError

            if (data && data.length > 0) {
              allGuests = [...allGuests, ...data]
              page++
              const progressPerChunk = 20 / guestIdChunks.length
              const chunkProgress = (i / guestIdChunks.length) * 20
              const pageProgress =
                (page * progressPerChunk) /
                Math.ceil(currentChunk.length / PAGE_SIZE)
              setLoadingProgress(
                Math.min(80, 60 + chunkProgress + pageProgress)
              )
              hasMore = data.length === PAGE_SIZE
            } else {
              hasMore = false
            }
          }
        }

        if (allGuests.length === 0) {
          setGuestsByCategory({})
          setLoadingProgress(100)
          setTimeout(() => setLoading(false), 500)
          return
        }

        setLoadingProgress(85)

        // 5. Process data to count guest appearances by category
        const guestMap: Record<string, UserGuest> = {}
        const guestSongs: Record<string, Set<string>> = {}
        const guestShows: Record<string, Set<string>> = {}

        allGuests.forEach((g) => {
          guestSongs[g.guest_id] = new Set()
          guestShows[g.guest_id] = new Set()
          guestMap[g.guest_id] = {
            guest_id: g.guest_id,
            guest: g.guest,
            guest_category: g.guest_category,
            song_count: 0,
            show_count: 0,
          }
        })

        setLoadingProgress(90)

        allGuestJoins.forEach((join) => {
          const guestId = join.guest_id
          const entryId = join.setlist_entry_id
          const showId = entryToShowMap[entryId]

          if (guestId && entryId) {
            guestSongs[guestId]?.add(entryId)
          }
          if (guestId && showId) {
            guestShows[guestId]?.add(showId)
          }
        })

        Object.keys(guestMap).forEach((guestId) => {
          guestMap[guestId].song_count = guestSongs[guestId]?.size ?? 0
          guestMap[guestId].show_count = guestShows[guestId]?.size ?? 0
        })

        setLoadingProgress(95)

        const groupedGuests: GuestsByCategory = {}
        Object.values(guestMap).forEach((guest) => {
          const category = guest.guest_category
          if (!groupedGuests[category]) {
            groupedGuests[category] = { guests: [], count: 0 }
          }
          groupedGuests[category].guests.push(guest)
          groupedGuests[category].count = groupedGuests[category].guests.length
        })

        for (const category of Object.keys(groupedGuests)) {
          groupedGuests[category].guests.sort(
            (a, b) => b.song_count - a.song_count
          )
        }

        setGuestsByCategory(groupedGuests)
        setLoadingProgress(100)
        setTimeout(() => setLoading(false), 500)
      } catch (err) {
        console.error("Error fetching user personnel:", err)
        setError("Failed to load personnel data")
        setLoadingProgress(100)
        setTimeout(() => setLoading(false), 500)
      }
    }

    fetchUserGuests()
  }, [userId])

  return {
    loading,
    loadingProgress,
    guestsByCategory,
    error,
  }
}
