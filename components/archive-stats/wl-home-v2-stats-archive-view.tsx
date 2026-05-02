"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import {
  WlHomeV2StatsArchiveShowGrids,
  WlHomeV2StatsArchiveSongGrids,
} from "@/components/archive-stats/wl-home-v2-stats-archive-grids"
import {
  WlHomeV2ArchiveCrumbsShell,
  WlHomeV2ArchiveCrumbsTrail,
} from "@/components/wl-home-v2/wl-home-v2-archive-crumbs"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"
import {
  WL_HOME_V2_SETLIST_SELECT_CONTENT,
  WL_HOME_V2_SETLIST_SELECT_TRIGGER,
} from "@/components/wl-home-v2/wl-home-v2-setlist-placeholder-view.constants"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStatsData } from "@/hooks/use-stats-data"
import { isSupabaseConfigured, supabase } from "@/lib/supabase"
import {
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
  type BreadcrumbItem,
} from "@/components/setlist-breadcrumb-context"

import {
  WL_HOME_V2_STATS_DEFAULT_YEAR,
  WL_HOME_V2_STATS_YEARS,
} from "@/components/archive-stats/wl-home-v2-stats-archive.constants"

const STATS_BREADCRUMBS: BreadcrumbItem[] = [
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
  { label: "Stats", href: "/archive/stats" },
]

export function WlHomeV2StatsArchiveView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const openArchiveHub = useWlHomeV2OpenArchiveHub()
  const yearParam = searchParams.get("year")
  const selectedYear =
    yearParam === "all-time" ?
      "all-time"
    : yearParam ?
      (() => {
        const n = parseInt(yearParam, 10)
        return Number.isNaN(n) ? WL_HOME_V2_STATS_DEFAULT_YEAR : n
      })()
    : null

  const [connectionError, setConnectionError] = useState(false)

  useEffect(() => {
    if (selectedYear === null) return
    const yearLabel =
      selectedYear === "all-time" ? "All-Time" : String(selectedYear)
    document.title = `${yearLabel} Stats — WTED.org`
    return () => {
      document.title = "WTED.org"
    }
  }, [selectedYear])

  useEffect(() => {
    if (selectedYear !== null) return
    const params = new URLSearchParams(searchParams.toString())
    params.set("year", String(WL_HOME_V2_STATS_DEFAULT_YEAR))
    router.replace(`/archive/stats?${params.toString()}`, { scroll: false })
  }, [selectedYear, router, searchParams])

  const testConnection = useCallback(async () => {
    if (!supabase) {
      setConnectionError(true)
      return
    }
    try {
      const { error } = await supabase.from("shows").select("show_id").limit(1)
      if (error) setConnectionError(true)
      else setConnectionError(false)
    } catch {
      setConnectionError(true)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setConnectionError(true)
      return
    }
    testConnection()
  }, [testConnection])

  const {
    topSongs,
    showOpeners,
    setOpeners,
    setClosers,
    encores,
    notPlayedSongs,
    longestSongs,
    liberatedSongs,
    longestShows,
    lowestRarityShows,
    highestGapShows,
    highestAttendedShows,
    highestRatedShows,
    songSpreadShows,
    isAnyStatLoading,
  } = useStatsData(selectedYear ?? WL_HOME_V2_STATS_DEFAULT_YEAR)

  const setYear = (year: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("year", year)
    router.replace(`/archive/stats?${params.toString()}`, { scroll: false })
  }

  if (!isSupabaseConfigured() || connectionError) {
    return (
      <div className="wl-home-v2-stats-archive-page flex min-h-0 min-w-0 flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
        <div className="widget-panel py-10 text-center">
          <p className="text-sm text-white/65">
            Trouble communicating with the database server. Please reload the
            page.
          </p>
        </div>
      </div>
    )
  }

  if (selectedYear === null) {
    return (
      <div className="wl-home-v2-stats-archive-page min-w-0 flex-1">
        <WlHomeV2PageLoading message="Loading stats data…" />
      </div>
    )
  }

  if (isAnyStatLoading) {
    return (
      <div className="wl-home-v2-stats-archive-page min-w-0 flex-1">
        <WlHomeV2PageLoading message="Loading stats data…" />
      </div>
    )
  }

  const yearLabel =
    selectedYear === "all-time" ? "All-Time" : String(selectedYear)
  const showEmptyState = selectedYear !== "all-time"
  const yearSelectValue = String(selectedYear)

  return (
    <div className="wl-home-v2-stats-archive-page box-border flex min-h-0 min-w-0 w-full flex-1 flex-col px-4 py-5 sm:px-5 lg:px-[18px] lg:py-6">
      <WlHomeV2ArchiveCrumbsShell
        variant="page-gutter"
        className="wl-home-v2-archive-crumbs-shell--inline-selectors"
        selectorsAriaLabel="Stats year"
        trail={
          <WlHomeV2ArchiveCrumbsTrail
            items={STATS_BREADCRUMBS}
            openArchiveHub={openArchiveHub ?? undefined}
          />
        }
        selectors={
          <Select value={yearSelectValue} onValueChange={setYear}>
            <SelectTrigger
              aria-label="Year"
              className={WL_HOME_V2_SETLIST_SELECT_TRIGGER}
            >
              <SelectValue placeholder={yearLabel} />
            </SelectTrigger>
            <SelectContent className={WL_HOME_V2_SETLIST_SELECT_CONTENT}>
              {WL_HOME_V2_STATS_YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y === "all-time" ? "All-Time" : String(y)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <WlHomeV2StatsArchiveSongGrids
          selectedYear={selectedYear}
          showEmptyState={showEmptyState}
          topSongs={topSongs}
          showOpeners={showOpeners}
          setOpeners={setOpeners}
          setClosers={setClosers}
          encores={encores}
          notPlayedSongs={notPlayedSongs}
          longestSongs={longestSongs}
          liberatedSongs={liberatedSongs}
          songSpreadShows={songSpreadShows}
        />
        <WlHomeV2StatsArchiveShowGrids
          selectedYear={selectedYear}
          showEmptyState={showEmptyState}
          longestShows={longestShows}
          lowestRarityShows={lowestRarityShows}
          highestGapShows={highestGapShows}
          highestAttendedShows={highestAttendedShows}
          highestRatedShows={highestRatedShows}
        />
      </div>
    </div>
  )
}
