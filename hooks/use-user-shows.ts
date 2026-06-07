"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { excludeRecordingSessionShows } from "@/lib/show-recording-session-filter"

const PAGE_SIZE = 1000
const CHUNK_SIZE = 200

export interface UserShow {
  show_id: string
  show_date: string
}

export function useUserShows(userId: string | null) {
  const [shows, setShows] = useState<UserShow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUserShows() {
      if (!userId || !supabase) {
        setLoadingProgress(100)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setLoadingProgress(5)
      setErrorMessage(null)

      try {
        let allAttendedShows: Array<{ show_id: string }> = []
        let page = 0
        let hasMore = true

        while (hasMore) {
          const { data, error } = await supabase
            .from("user_attended_shows")
            .select("show_id")
            .eq("user_id", userId)
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

          if (error) throw error

          if (data && data.length > 0) {
            allAttendedShows = [...allAttendedShows, ...data]
            page++
            setLoadingProgress(Math.min(20, 5 + page * 3))
            hasMore = data.length === PAGE_SIZE
          } else {
            hasMore = false
          }
        }

        setLoadingProgress(25)

        if (allAttendedShows.length === 0) {
          setShows([])
          setLoadingProgress(100)
          setIsLoading(false)
          return
        }

        const showIds = allAttendedShows.map((s) => s.show_id)
        const showIdChunks: string[][] = []
        for (let i = 0; i < showIds.length; i += CHUNK_SIZE) {
          showIdChunks.push(showIds.slice(i, i + CHUNK_SIZE))
        }

        let allShowsData: UserShow[] = []

        for (let i = 0; i < showIdChunks.length; i++) {
          const chunk = showIdChunks[i]
          page = 0
          hasMore = true

          while (hasMore) {
            const { data, error } = await supabase
              .from("shows")
              .select("show_id, show_date, show_detail")
              .in("show_id", chunk)
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
              .order("show_date", { ascending: true })

            if (error) throw error

            if (data && data.length > 0) {
              allShowsData = [
                ...allShowsData,
                ...excludeRecordingSessionShows(data),
              ]
              page++
              const progressPerChunk = 25 / showIdChunks.length
              const chunkProgress = (i / showIdChunks.length) * 25
              const pageProgress =
                (page * progressPerChunk) /
                Math.ceil(chunk.length / PAGE_SIZE)
              setLoadingProgress(
                Math.min(50, 25 + chunkProgress + pageProgress)
              )
              hasMore = data.length === PAGE_SIZE
            } else {
              hasMore = false
            }
          }
        }

        allShowsData.sort(
          (a, b) =>
            new Date(a.show_date).getTime() - new Date(b.show_date).getTime()
        )
        setShows(allShowsData)
        setLoadingProgress(100)
      } catch (error) {
        console.error("Error fetching user attended shows:", error)
        setErrorMessage("Failed to load attended shows data")
        setShows([])
      } finally {
        setLoadingProgress(100)
        setIsLoading(false)
      }
    }

    fetchUserShows()
  }, [userId])

  return { shows, isLoading, loadingProgress, errorMessage }
}
