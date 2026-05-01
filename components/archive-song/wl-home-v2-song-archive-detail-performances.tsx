"use client"

import { useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import { usePerformanceData } from "@/hooks/use-performance-data"
import { usePerformanceSorting } from "@/hooks/use-performance-sorting"
import type { SongPerformance } from "@/types/song"

import {
  perfMatchesSongArchiveFilters,
  PERFORMANCES_VIEW_QUERY,
  performancesViewFromSearchParams,
  buildTimelineSegments,
} from "@/components/archive-song/song-archive-detail-performances-lib"
import type { SongArchivePerformanceWtedPayload } from "@/components/archive-song/song-archive-detail-performances-types"
import {
  SongArchiveDetailPerfCardShell,
  SongArchiveDetailPerfEmpty,
  SongArchiveDetailPerfTable,
  SongArchiveDetailPerfTimeline,
  type PerfSortColumnId,
} from "@/components/archive-song/wl-home-v2-song-archive-detail-perf-views"

export type { SongArchivePerformanceWtedPayload } from "@/components/archive-song/song-archive-detail-performances-types"
export {
  placementLegendRows,
  placementStatsForVerbatimBar,
} from "@/components/archive-song/song-archive-detail-placement-stats"

export function WlHomeV2SongArchiveDetailPerformances({
  performances,
  songCanonical,
  songDisplayName,
  selectedGroup,
  selectedPlacement,
  onClearPerformanceFilter,
  onJotyBadgeClick,
  onWtedPayloadClick,
}: {
  performances: SongPerformance[]
  songCanonical: string
  songDisplayName?: string | null
  selectedGroup: string | null
  selectedPlacement: string | null
  onClearPerformanceFilter: () => void
  onJotyBadgeClick?: (year: number, entryId: string | null) => void
  onWtedPayloadClick?: (payload: SongArchivePerformanceWtedPayload) => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const performancesView = useMemo(
    () => performancesViewFromSearchParams(searchParams),
    [searchParams],
  )

  const setPerformancesView = useCallback(
    (mode: "timeline" | "table") => {
      const params = new URLSearchParams(searchParams.toString())
      if (mode === "timeline") params.delete(PERFORMANCES_VIEW_QUERY)
      else params.set(PERFORMANCES_VIEW_QUERY, "table")
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const { performancesWithGaps } = usePerformanceData(performances)
  const { sortColumn, sortDirection, handleSort, sortPerformances } =
    usePerformanceSorting()
  const showTooltips = useIsDesktopContentLayout()

  const showWtedColumn = useMemo(
    () =>
      performances.some(
        (p) => !!p.radio_id && String(p.radio_id).trim() !== "",
      ),
    [performances],
  )

  const filteredPerformances = useMemo(
    () =>
      performancesWithGaps.filter((p) =>
        perfMatchesSongArchiveFilters(p, selectedGroup, selectedPlacement),
      ),
    [performancesWithGaps, selectedGroup, selectedPlacement],
  )

  const byYear = useMemo(() => {
    const map = new Map<number, SongPerformance[]>()
    filteredPerformances.forEach((p) => {
      const y = parseInt(p.show_date.slice(0, 4), 10)
      if (Number.isNaN(y)) return
      if (!map.has(y)) map.set(y, [])
      map.get(y)!.push(p)
    })
    for (const [, arr] of map) {
      arr.sort((a, b) => {
        const d = a.show_date.localeCompare(b.show_date)
        if (d !== 0) return d
        const s = (a.entry_set || "").localeCompare(b.entry_set || "")
        if (s !== 0) return s
        return (
          (parseInt(String(a.entry_setnum), 10) || 0) -
          (parseInt(String(b.entry_setnum), 10) || 0)
        )
      })
    }
    return map
  }, [filteredPerformances])

  const timelineYears = useMemo(
    () => [...byYear.keys()].sort((a, b) => a - b),
    [byYear],
  )

  const timelineSegments = useMemo(
    () => buildTimelineSegments(timelineYears),
    [timelineYears],
  )

  const sortedTableRows = useMemo(() => {
    return sortPerformances(filteredPerformances)
  }, [filteredPerformances, sortColumn, sortDirection, sortPerformances])

  const onSortColumn = useCallback(
    (column: PerfSortColumnId) => () => handleSort(column),
    [handleSort],
  )

  if (performances.length === 0) {
    return <SongArchiveDetailPerfEmpty />
  }

  return (
    <>
      <SongArchiveDetailPerfCardShell
        selectedGroup={selectedGroup}
        selectedPlacement={selectedPlacement}
        onClearPerformanceFilter={onClearPerformanceFilter}
        performancesView={performancesView}
        setPerformancesView={setPerformancesView}
      >
        <SongArchiveDetailPerfTimeline
          performancesView={performancesView}
          timelineSegments={timelineSegments}
          byYear={byYear}
          showTooltips={showTooltips}
        />
        <SongArchiveDetailPerfTable
          performancesView={performancesView}
          showWtedColumn={showWtedColumn}
          showTooltips={showTooltips}
          sortColumn={sortColumn}
          onSortColumn={onSortColumn}
          sortedTableRows={sortedTableRows}
          selectedGroup={selectedGroup}
          songCanonical={songCanonical}
          songDisplayName={songDisplayName}
          onJotyBadgeClick={onJotyBadgeClick}
          onWtedPayloadClick={onWtedPayloadClick}
        />
      </SongArchiveDetailPerfCardShell>
    </>
  )
}
