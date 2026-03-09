"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GuestPerformanceTimelineView } from "./guest-performance-timeline-view"
import { GuestPerformanceTableView } from "./guest-performance-table-view"
import type { GuestShow } from "@/hooks/use-guest-data"

interface GuestTimelinePerf {
  formattedDate: string
  show_id: string
  fullData: GuestShow
}

interface GuestPerformanceChartProps {
  performances: GuestShow[]
  songShowMap: Record<string, string[]>
  guestName: string
  selectedGroup: string | null
  selectedSong: string | null
}

function sortGuestShows(
  performances: GuestShow[],
  sortColumn: string,
  sortDirection: "asc" | "desc",
): GuestShow[] {
  return [...performances].sort((a, b) => {
    let valueA: string | number
    let valueB: string | number

    switch (sortColumn) {
      case "show_date":
        valueA = new Date(a.show_date).getTime()
        valueB = new Date(b.show_date).getTime()
        return sortDirection === "asc"
          ? (valueA as number) - (valueB as number)
          : (valueB as number) - (valueA as number)
      case "show_group":
        valueA = a.show_group || ""
        valueB = b.show_group || ""
        break
      case "show_venue_location":
        valueA = a.show_venue_location || ""
        valueB = b.show_venue_location || ""
        break
      default:
        valueA = ""
        valueB = ""
    }

    const comparison =
      typeof valueA === "string" && typeof valueB === "string"
        ? valueA.localeCompare(valueB)
        : valueA < valueB
          ? -1
          : valueA > valueB
            ? 1
            : 0
    return sortDirection === "asc" ? comparison : -comparison
  })
}

export function GuestPerformanceChart({
  performances,
  songShowMap,
  guestName,
  selectedGroup,
  selectedSong,
}: GuestPerformanceChartProps) {
  const searchParams = useSearchParams()

  const getViewModeFromUrl = (): "timeline" | "table" => {
    const viewParam = searchParams?.get("view")
    return viewParam === "table" || viewParam === "timeline"
      ? viewParam
      : "timeline"
  }

  const [viewMode, setViewMode] = useState<"timeline" | "table">(
    getViewModeFromUrl,
  )
  const [sortColumn, setSortColumn] = useState("show_date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    const urlViewMode = getViewModeFromUrl()
    if (urlViewMode !== viewMode) setViewMode(urlViewMode)
  }, [searchParams])

  const handleViewModeChange = (newViewMode: "timeline" | "table") => {
    setViewMode(newViewMode)
    const url = new URL(window.location.href)
    if (newViewMode === "timeline") {
      url.searchParams.delete("view")
    } else {
      url.searchParams.set("view", newViewMode)
    }
    window.history.replaceState({}, "", url.toString())
  }

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
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-pressed={viewMode === "timeline"}
              onClick={() => handleViewModeChange("timeline")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "timeline"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              aria-label="Timeline view"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
                <path d="M15 3v18" />
              </svg>
            </button>
            <button
              type="button"
              aria-pressed={viewMode === "table"}
              onClick={() => handleViewModeChange("table")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "table"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              aria-label="Table view"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" />
                <path d="M3 15h18" />
              </svg>
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {viewMode === "timeline" ? (
          <GuestPerformanceTimelineView
            performancesByYear={performancesByYear}
            selectedGroup={selectedGroup}
          />
        ) : (
          <GuestPerformanceTableView
            performances={sortedPerformances}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            handleSort={handleSort}
            selectedGroup={selectedGroup}
          />
        )}
      </CardContent>
    </Card>
  )
}
