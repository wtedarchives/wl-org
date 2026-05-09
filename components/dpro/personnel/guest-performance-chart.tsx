"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GuestPerformanceTimelineView } from "./guest-performance-timeline-view"
import { GuestPerformanceTableView } from "./guest-performance-table-view"
import type { GuestShow } from "@/hooks/use-guest-data"
import { SongArchiveDetailPerfCardShell } from "@/components/archive-song/wl-home-v2-song-archive-detail-perf-views"
import {
  PERFORMANCES_VIEW_QUERY,
  performancesViewFromSearchParams,
} from "@/components/archive-song/song-archive-detail-performances-lib"
import {
  getLegacyPerformancesViewFromUrl,
  sortGuestShows,
  type GuestTimelinePerf,
} from "@/components/dpro/personnel/guest-performance-chart.lib"
import { PersonnelPerfHeadFilterPills } from "@/components/dpro/personnel/guest-performance-head-filter-pills"
import { GuestPerformanceLegacyViewToggle } from "@/components/dpro/personnel/guest-performance-legacy-view-toggle"

interface GuestPerformanceChartProps {
  performances: GuestShow[]
  songShowMap: Record<string, string[]>
  guestName: string
  selectedGroup: string | null
  selectedSong: string | null
  wlHomeV2?: boolean
  /** WL Home personnel: clear tour/group filter from performances header pill. */
  onClearSelectedGroup?: () => void
  /** WL Home personnel: clear song filter from performances header pill. */
  onClearSelectedSong?: () => void
}

export function GuestPerformanceChart({
  performances,
  songShowMap,
  guestName,
  selectedGroup,
  selectedSong,
  wlHomeV2 = false,
  onClearSelectedGroup,
  onClearSelectedSong,
}: GuestPerformanceChartProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const [legacyViewMode, setLegacyViewMode] = useState<"timeline" | "table">(() =>
    getLegacyPerformancesViewFromUrl(searchParams),
  )
  const [sortColumn, setSortColumn] = useState("show_date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    if (wlHomeV2) return
    setLegacyViewMode(getLegacyPerformancesViewFromUrl(searchParams))
  }, [searchParams, wlHomeV2])

  const performancesViewWl = useMemo(
    () => performancesViewFromSearchParams(searchParams),
    [searchParams],
  )

  const performancesView = wlHomeV2 ? performancesViewWl : legacyViewMode

  const setPerformancesViewMode = useCallback(
    (mode: "timeline" | "table") => {
      if (wlHomeV2) {
        const params = new URLSearchParams(searchParams.toString())
        if (mode === "timeline") params.delete(PERFORMANCES_VIEW_QUERY)
        else params.set(PERFORMANCES_VIEW_QUERY, "table")
        const qs = params.toString()
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
      } else {
        setLegacyViewMode(mode)
        const url = new URL(window.location.href)
        if (mode === "timeline") {
          url.searchParams.delete("view")
        } else {
          url.searchParams.set("view", mode)
        }
        window.history.replaceState({}, "", url.toString())
      }
    },
    [wlHomeV2, pathname, router, searchParams],
  )

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const filteredPerformances = useMemo(() => {
    let result = performances

    if (selectedGroup) {
      result = result.filter((p) => p.show_group === selectedGroup)
    }

    if (selectedSong) {
      const showIds = songShowMap[selectedSong] ?? []
      const showIdSet = new Set(showIds)
      result = result.filter((p) => showIdSet.has(p.show_id))
    }

    return result
  }, [performances, selectedGroup, selectedSong, songShowMap])

  const performancesByYear = useMemo(() => {
    const byYear: Record<number, GuestTimelinePerf[]> = {}

    for (const perf of filteredPerformances) {
      if (!perf.show_date) continue
      const [year, month, day] = perf.show_date.split("-")
      const yearNum = parseInt(year, 10)
      if (!byYear[yearNum]) byYear[yearNum] = []
      byYear[yearNum].push({
        formattedDate: `${month}.${day}`,
        show_id: perf.show_id,
        fullData: perf,
      })
    }

    return byYear
  }, [filteredPerformances])

  const sortedPerformances = useMemo(
    () => sortGuestShows(filteredPerformances, sortColumn, sortDirection),
    [filteredPerformances, sortColumn, sortDirection],
  )

  if (performances.length === 0) {
    if (wlHomeV2) {
      return (
        <div className="card perf-card">
          <div className="card-head perf-card-head-pad">
            <h3>Performances</h3>
          </div>
          <div className="card-body">
            <p
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.65)",
                margin: 0,
              }}
            >
              <span className="font-medium" style={{ color: "#fff" }}>
                {guestName}
              </span>{" "}
              doesn&apos;t have any performance records.
            </p>
          </div>
        </div>
      )
    }
    return (
      <Card className="border-border/60 bg-card/80 overflow-hidden py-0">
        <CardHeader className="bg-muted/60 py-2">
          <CardTitle className="text-sm font-semibold">Performances</CardTitle>
        </CardHeader>
        <CardContent className="py-6">
          <p className="text-center text-sm text-muted-foreground">
            <span className="font-medium">{guestName}</span> doesn&apos;t have
            any performance records.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (wlHomeV2) {
    return (
      <SongArchiveDetailPerfCardShell
        selectedGroup={null}
        selectedPlacement={null}
        onClearPerformanceFilter={() => {}}
        performancesView={performancesView}
        setPerformancesView={setPerformancesViewMode}
        headFilters={
          <PersonnelPerfHeadFilterPills
            selectedGroup={selectedGroup}
            selectedSong={selectedSong}
            onClearSelectedGroup={onClearSelectedGroup}
            onClearSelectedSong={onClearSelectedSong}
          />
        }
      >
        <div
          hidden={performancesView !== "timeline"}
          style={{ opacity: performancesView === "timeline" ? 1 : 0 }}
        >
          <GuestPerformanceTimelineView
            performancesByYear={performancesByYear}
            selectedGroup={selectedGroup}
            wlHomeV2
          />
        </div>
        <div
          hidden={performancesView !== "table"}
          style={{ opacity: performancesView === "table" ? 1 : 0 }}
        >
          <GuestPerformanceTableView
            performances={sortedPerformances}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            handleSort={handleSort}
            selectedGroup={selectedGroup}
            wlHomeV2
          />
        </div>
      </SongArchiveDetailPerfCardShell>
    )
  }

  return (
    <Card className="border-border/60 bg-card/80 overflow-hidden py-0">
      <CardHeader className="bg-muted/60 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm font-semibold">Performances</CardTitle>
            {(selectedGroup || selectedSong) && (
              <div className="flex flex-wrap gap-1">
                {selectedGroup && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded border border-border bg-muted/60">
                    {selectedGroup}
                  </span>
                )}
                {selectedSong && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded border border-border bg-muted/60">
                    {selectedSong}
                  </span>
                )}
              </div>
            )}
          </div>
          <GuestPerformanceLegacyViewToggle
            performancesView={performancesView}
            setPerformancesViewMode={setPerformancesViewMode}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {performancesView === "timeline" ? (
          <GuestPerformanceTimelineView
            performancesByYear={performancesByYear}
            selectedGroup={selectedGroup}
            wlHomeV2={wlHomeV2}
          />
        ) : (
          <GuestPerformanceTableView
            performances={sortedPerformances}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            handleSort={handleSort}
            selectedGroup={selectedGroup}
            wlHomeV2={wlHomeV2}
          />
        )}
      </CardContent>
    </Card>
  )
}
