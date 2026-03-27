"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { usePerformanceData } from "@/hooks/use-performance-data"
import { usePerformanceSorting } from "@/hooks/use-performance-sorting"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X } from "lucide-react"
import { PerformanceTimelineView } from "./performance-timeline-view"
import { PerformanceTableView } from "./performance-table-view"
import type { SongPerformance } from "@/types/song"
import { SongDisplayName } from "@/components/dpro/song-display-name"

interface SongPerformanceChartProps {
  performances: SongPerformance[]
  selectedGroup: string | null
  songName: string
  songDisplayName?: string | null
  onJOTYClick?: (year: number, entryId: string | null) => void
}

interface TimelinePerf {
  formattedDate: string
  show_id: string
  entry_placement: string
  fullData: SongPerformance
}

export function SongPerformanceChart({
  performances,
  selectedGroup,
  songName,
  songDisplayName,
  onJOTYClick,
}: SongPerformanceChartProps) {
  const { user } = useAuth()
  const searchParams = useSearchParams()

  const getViewModeFromUrl = (): "timeline" | "table" => {
    const viewParam = searchParams?.get("view")
    return viewParam === "table" || viewParam === "timeline" ? viewParam : "timeline"
  }

  const [viewMode, setViewMode] = useState<"timeline" | "table">(
    getViewModeFromUrl,
  )
  const [showOnlyAttended, setShowOnlyAttended] = useState(false)

  useEffect(() => {
    const urlViewMode = getViewModeFromUrl()
    if (urlViewMode !== viewMode) {
      setViewMode(urlViewMode)
    }
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

  const { performancesWithGaps, attendedShowIds, loadingAttended } =
    usePerformanceData(performances)
  const { sortColumn, sortDirection, handleSort, sortPerformances } =
    usePerformanceSorting()

  const filteredPerformances =
    showOnlyAttended && user
      ? performancesWithGaps.filter((perf) => attendedShowIds.has(perf.show_id))
      : performancesWithGaps

  const performancesByYear = filteredPerformances.reduce(
    (acc, perf) => {
      if (!perf.show_date) return acc
      const [year, month, day] = perf.show_date.split("-")
      const yearNum = parseInt(year, 10)
      if (!acc[yearNum]) acc[yearNum] = []
      const formattedDate = `${month}.${day}`
      acc[yearNum].push({
        formattedDate,
        show_id: perf.show_id,
        entry_placement: perf.entry_placement,
        fullData: perf,
      })
      return acc
    },
    {} as Record<number, TimelinePerf[]>,
  )

  const sortedPerformances = sortPerformances(filteredPerformances)

  if (performances.length === 0) {
    return (
      <Card className="border-border/60 bg-card/80 overflow-hidden py-0">
        <CardHeader className="bg-muted/60 py-2">
          <CardTitle className="text-sm font-semibold">
            Performances
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6">
          <p className="text-center text-sm text-muted-foreground">
            <span className="font-medium inline">
              <SongDisplayName
                song={songName}
                songDisplayName={songDisplayName}
                underlineOnHover={false}
              />
            </span>{" "}
            hasn&apos;t been played live.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-border/60 bg-card/80 overflow-hidden py-0">
        <CardHeader className="bg-muted/60 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-sm font-semibold">
                Performances
              </CardTitle>
              {user && (
                <button
                  type="button"
                  onClick={() => setShowOnlyAttended(!showOnlyAttended)}
                  disabled={loadingAttended}
                  className={`flex items-center gap-2 px-2 py-1 rounded-md border border-border text-xs font-medium transition-colors ${
                    loadingAttended ? "opacity-50 cursor-wait" : ""
                  } ${
                    showOnlyAttended
                      ? "bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border-emerald-600/40"
                      : "bg-muted/60 hover:bg-muted"
                  }`}
                >
                  <span className="size-4 flex items-center justify-center">
                    {showOnlyAttended ? (
                      <Check className="size-3" />
                    ) : (
                      <X className="size-3" />
                    )}
                  </span>
                  <span>My Shows</span>
                </button>
              )}
            </div>
            {selectedGroup && (
              <span className="text-xs font-medium px-2 py-0.5 rounded border border-border bg-muted/60">
                {selectedGroup}
              </span>
            )}
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
            <PerformanceTimelineView
              performancesByYear={performancesByYear}
              selectedGroup={selectedGroup}
            />
          ) : (
            <PerformanceTableView
              performances={sortedPerformances}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              handleSort={handleSort}
              selectedGroup={selectedGroup}
              onJOTYClick={onJOTYClick}
              songCanonical={songName}
              songDisplayName={songDisplayName}
            />
          )}
        </CardContent>
      </Card>
    </>
  )
}
