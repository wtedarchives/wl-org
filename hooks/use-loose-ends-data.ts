"use client"

import { useCallback, useEffect, useState } from "react"

import {
  buildShowStatsBundle,
  groupLooseEndsByCategory,
  processFiveInARow,
  processSideProjects,
  updateLooseEndsCompletion,
} from "@/lib/loose-ends-compute"
import {
  clearLooseEndsSessionCache,
  getLooseEndsFromSessionCache,
  setLooseEndsSessionCache,
} from "@/lib/loose-ends-cache"
import {
  preloadLooseEndBadgeArtworkFromGrouped,
  preloadLooseEndBadgeArtworkFromRows,
} from "@/lib/loose-end-badge-preload"
import {
  buildAttendedJoined,
  buildCategoryProgress,
  countDebutsForShows,
  fetchAllShowIdsForUser,
  fetchGlobalVenueNames,
  fetchShowsForLooseEnds,
  processStands,
} from "@/lib/loose-ends-fetch"
import { supabase } from "@/lib/supabase"
import type { GroupedLooseEnds, LooseEndRow } from "@/types/loose-ends"

export function useLooseEndsData(userId: string | null) {
  const [groupedLooseEnds, setGroupedLooseEnds] = useState<GroupedLooseEnds>({})
  const [categories, setCategories] = useState<string[]>([])
  const [attendedShowCount, setAttendedShowCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const runFetch = useCallback(
    async (forceRefresh: boolean) => {
      if (!userId || !supabase) {
        setGroupedLooseEnds({})
        setCategories([])
        setAttendedShowCount(0)
        setLoading(false)
        setLoadingProgress(100)
        setError(null)
        return
      }

      if (!forceRefresh) {
        const cached = getLooseEndsFromSessionCache(userId)
        if (cached) {
          setGroupedLooseEnds(cached.groupedLooseEnds)
          setCategories(cached.categories)
          setAttendedShowCount(cached.attendedShowCount ?? 0)
          setLoading(false)
          setLoadingProgress(100)
          setError(null)
          preloadLooseEndBadgeArtworkFromGrouped(
            cached.groupedLooseEnds,
            cached.categories,
          )
          return
        }
      }

      try {
        setLoading(true)
        setError(null)
        setAttendedShowCount(0)
        setLoadingProgress(5)

        const { data: looseEndsRows, error: looseErr } = await supabase
          .from("looseends")
          .select(
            "end, end_description, end_id, end_local_file, end_order, end_category, end_visible"
          )
          .eq("end_visible", true)
          .order("end_order", { ascending: true })

        if (looseErr) {
          setError(looseErr.message)
          return
        }

        const looseEndsData = (looseEndsRows ?? []) as LooseEndRow[]
        setLoadingProgress(12)
        preloadLooseEndBadgeArtworkFromRows(looseEndsData)

        if (looseEndsData.length === 0) {
          setGroupedLooseEnds({})
          setCategories([])
          setAttendedShowCount(0)
          setLoadingProgress(100)
          return
        }

        const showIds = await fetchAllShowIdsForUser(
          supabase,
          userId,
          setLoadingProgress
        )
        const shows = await fetchShowsForLooseEnds(
          supabase,
          showIds,
          setLoadingProgress
        )
        setAttendedShowCount(showIds.length)
        const attendedShowsData = buildAttendedJoined(showIds, shows)

        const sideProjectsAttended = processSideProjects(attendedShowsData)
        const { canonicalShows, bundle: showStats } =
          buildShowStatsBundle(attendedShowsData)

        const canonicalShowIds = canonicalShows
          .map((r) => r.shows?.show_id)
          .filter(Boolean) as string[]

        const [
          globalVenueNames,
          debutCount,
          standsAttended,
          fiveDone,
          categoriesResult,
        ] = await Promise.all([
          canonicalShows.length > 0
            ? fetchGlobalVenueNames(supabase)
            : Promise.resolve([]),
          countDebutsForShows(supabase, canonicalShowIds),
          processStands(supabase, attendedShowsData),
          Promise.resolve(processFiveInARow(attendedShowsData)),
          supabase.from("categories").select("category"),
        ])

        if (categoriesResult.error) throw categoriesResult.error
        const allCategories = categoriesResult.data ?? []

        showStats.debutCount = debutCount
        if (canonicalShows.length > 0 && globalVenueNames.length > 0) {
          const globalSet = new Set(globalVenueNames)
          showStats.attendedGlobalShow = canonicalShows.some(
            (row) =>
              row.shows?.show_subvenue_venue &&
              globalSet.has(row.shows.show_subvenue_venue)
          )
        }

        setLoadingProgress(45)
        const categoryLooseEnds = looseEndsData.filter(
          (e) => e.end_category === "Completionist"
        )

        const progress = await buildCategoryProgress(
          supabase,
          categoryLooseEnds,
          allCategories,
          showIds,
          setLoadingProgress
        )

        setLoadingProgress(92)
        const updatedLooseEnds = updateLooseEndsCompletion(
          looseEndsData,
          sideProjectsAttended,
          showStats,
          standsAttended,
          fiveDone,
          progress
        )
        const { grouped, categoryList } =
          groupLooseEndsByCategory(updatedLooseEnds)

        setGroupedLooseEnds(grouped)
        setCategories(categoryList)
        setLooseEndsSessionCache(userId, {
          groupedLooseEnds: grouped,
          categories: categoryList,
          attendedShowCount: showIds.length,
        })
        setLoadingProgress(100)
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error"
        setError(msg)
        setLoadingProgress(100)
      } finally {
        setLoading(false)
      }
    },
    [userId]
  )

  useEffect(() => {
    void runFetch(false)
  }, [runFetch])

  const refetch = useCallback(() => {
    if (userId) clearLooseEndsSessionCache(userId)
    void runFetch(true)
  }, [userId, runFetch])

  return {
    groupedLooseEnds,
    categories,
    attendedShowCount,
    loading,
    loadingProgress,
    error,
    refetch,
  }
}
