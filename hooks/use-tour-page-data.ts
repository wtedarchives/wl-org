"use client"

import { useTourData } from "@/hooks/use-tour-data"
import {
  useAverageSetlist,
  type AverageSetlistResult,
} from "@/hooks/use-average-setlist"
import { useNotPlayedInTour } from "@/hooks/use-not-played-in-tour"
import type { UseTourDataResult } from "@/hooks/use-tour-data"

/**
 * Combines useTourData with useAverageSetlist and useNotPlayedInTour so that
 * isLoading stays true until all tour page data (including average setlist and
 * most common not played) is ready. This prevents the loading card from
 * disappearing while child components are still loading.
 */
export function useTourPageData(
  tourId: string | undefined,
): UseTourDataResult & {
  notPlayedSongs: ReturnType<typeof useNotPlayedInTour>["notPlayedSongs"]
  averageSetlistResult: AverageSetlistResult | undefined
  progress?: number
} {
  const tourData = useTourData(tourId)
  const showIds = tourData.shows.map((s) => s.show_id)
  const needAvgSetlist =
    tourData.shows.length > 0 && tourData.currentTourShowFields === true
  const needNotPlayed =
    tourData.hasTourSetlistEntries &&
    tourData.currentTourShowFields === true &&
    showIds.length > 0

  const avgSetlist = useAverageSetlist(
    needAvgSetlist ? tourData.shows : [],
    "tour",
  )
  const { notPlayedSongs, isLoading: notPlayedLoading } = useNotPlayedInTour(
    needNotPlayed ? tourData.currentTourId ?? undefined : undefined,
    needNotPlayed ? tourData.currentTour?.tour : undefined,
    needNotPlayed ? showIds : [],
  )

  const allDataReady =
    !tourData.isLoading &&
    (!needAvgSetlist || !avgSetlist.isLoading) &&
    (!needNotPlayed || !notPlayedLoading)

  const totalSteps = 1 + (needAvgSetlist ? 1 : 0) + (needNotPlayed ? 1 : 0)
  const loadedSteps =
    (tourData.isLoading ? 0 : 1) +
    (needAvgSetlist && !avgSetlist.isLoading ? 1 : 0) +
    (needNotPlayed && !notPlayedLoading ? 1 : 0)
  const progress =
    !allDataReady && totalSteps > 0
      ? (loadedSteps / totalSteps) * 100
      : undefined

  return {
    ...tourData,
    isLoading: !allDataReady,
    notPlayedSongs,
    averageSetlistResult: needAvgSetlist ? avgSetlist : undefined,
    progress,
  }
}
