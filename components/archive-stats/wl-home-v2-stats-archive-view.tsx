"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"

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
import { StatCard } from "@/components/dpro/stats/stat-card"
import { LongestSongsCard } from "@/components/dpro/stats/longest-songs-card"
import { LiberatedSongsCard } from "@/components/dpro/stats/liberated-songs-card"
import {
  ShowStatCard,
  RarityValue,
  GapValue,
} from "@/components/dpro/stats/show-stat-card"
import { TourSongSpread } from "@/components/dpro/tours/tour-song-spread"
import { WlTopSlotsCategorySwatch } from "@/components/dpro/tours/top-slots-carousel"
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
  WL_HOME_V2_STATS_TILE_ACCENTS,
  WL_HOME_V2_STATS_YEARS,
} from "@/components/archive-stats/wl-home-v2-stats-archive.constants"

const STATS_BREADCRUMBS: BreadcrumbItem[] = [
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
  { label: "Stats", href: "/archive/stats" },
]

function StatsTile({
  panelTitle,
  panelHeadRight,
  headerAccentColor,
  bgIndex,
  children,
  embed = "standard",
}: {
  panelTitle?: string
  panelHeadRight?: ReactNode
  headerAccentColor?: string
  bgIndex: number
  children: ReactNode
  /** Match tour stats: `side-card` + `.sc-label` + setlist row chrome (not `widget-panel`). */
  embed?: "standard" | "tour-song-spread"
}) {
  const showHeadRight = panelHeadRight != null || headerAccentColor != null
  const tileBgIndex = bgIndex % 4

  if (embed === "tour-song-spread") {
    return (
      <section
        className="tile tile-stats tile-stats--tour-song-spread"
        data-wl-stats-tile-bg={String(tileBgIndex)}
      >
        <div className="tile-stats-inner">
          <div className="wl-home-v2-setlist flex min-h-0 min-w-0 flex-1 flex-col">
            <div
              className="side-card wl-home-v2-setlist-song-spread-side-card wl-home-v2-tour-stats-song-spread flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-[rgb(44,46,45)]"
            >
              <div className="sc-label">Song Spread</div>
              {children}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className="tile tile-stats"
      data-wl-stats-tile-bg={String(tileBgIndex)}
    >
      <div className="tile-stats-inner">
        <div className="widget-panel wl-home-v2-stats-archive-widget-panel">
          <div className="wp-head wl-home-v2-years-shows-wp-head">
            <span className="min-w-0 truncate">{panelTitle}</span>
            {showHeadRight ?
              <div className="wp-head-right">
                {panelHeadRight}
                {headerAccentColor ?
                  <WlTopSlotsCategorySwatch color={headerAccentColor} />
                : null}
              </div>
            : null}
          </div>
          <div className="wl-home-v2-stats-archive-widget-panel__body">
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}

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
  const accent = WL_HOME_V2_STATS_TILE_ACCENTS

  return (
    <div className="wl-home-v2-stats-archive-page box-border flex min-h-0 min-w-0 w-full flex-1 flex-col px-4 py-5 sm:px-5 lg:px-[18px] lg:py-6">
      <WlHomeV2ArchiveCrumbsShell
        variant="page-gutter"
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
        <section className="flex min-h-0 flex-col">
          <h2 className="sc-label wl-home-v2-songs-archive-section-heading">
            Songs
          </h2>
          <div className="grid grid--stats-4">
            <StatsTile panelTitle="Top Songs Played" bgIndex={0}>
              <StatCard
                title="Top Songs Played"
                headerClassName="bg-[#3C1E40] text-white py-2"
                items={topSongs}
                getDisplayName={(item) => item.song ?? ""}
                getSong={(item) => item.song ?? ""}
                getSongDisplayName={(item) => item.song_displayname ?? null}
                getCount={(item) => item.play_count ?? 0}
                showEmptyState={showEmptyState}
                wlHomeV2
              />
            </StatsTile>
            <StatsTile
              panelTitle="Top Show Openers"
              bgIndex={1}
              headerAccentColor={accent.topShowOpeners}
            >
              <StatCard
                title="Top Show Openers"
                headerClassName="bg-[#047857] text-white py-2"
                items={showOpeners}
                getDisplayName={(item) => item.song_name ?? ""}
                getSong={(item) => item.song_name ?? ""}
                getSongDisplayName={(item) => item.song_displayname ?? null}
                getCount={(item) => item.times_played ?? 0}
                showEmptyState={showEmptyState}
                wlHomeV2
              />
            </StatsTile>
            <StatsTile
              panelTitle="Top Set Openers"
              bgIndex={2}
              headerAccentColor={accent.topSetOpeners}
            >
              <StatCard
                title="Top Set Openers"
                headerClassName="bg-[#10b981] text-white py-2"
                items={setOpeners}
                getDisplayName={(item) => item.song_name ?? ""}
                getSong={(item) => item.song_name ?? ""}
                getSongDisplayName={(item) => item.song_displayname ?? null}
                getCount={(item) => item.times_played ?? 0}
                showEmptyState={showEmptyState}
                wlHomeV2
              />
            </StatsTile>
            <StatsTile
              panelTitle="Top Set Closers"
              bgIndex={3}
              headerAccentColor={accent.topSetClosers}
            >
              <StatCard
                title="Top Set Closers"
                headerClassName="bg-[#3b82f6] text-white py-2"
                items={setClosers}
                getDisplayName={(item) => item.song_name ?? ""}
                getSong={(item) => item.song_name ?? ""}
                getSongDisplayName={(item) => item.song_displayname ?? null}
                getCount={(item) => item.times_played ?? 0}
                showEmptyState={showEmptyState}
                wlHomeV2
              />
            </StatsTile>
            <StatsTile
              panelTitle="Top Encores"
              bgIndex={4}
              headerAccentColor={accent.topEncores}
            >
              <StatCard
                title="Top Encores"
                headerClassName="bg-[#be123c] text-white py-2"
                items={encores}
                getDisplayName={(item) => item.song_name ?? ""}
                getSong={(item) => item.song_name ?? ""}
                getSongDisplayName={(item) => item.song_displayname ?? null}
                getCount={(item) => item.times_played ?? 0}
                showEmptyState={showEmptyState}
                wlHomeV2
              />
            </StatsTile>
            {selectedYear === "all-time" ?
              <StatsTile panelTitle="Longest Songs" bgIndex={5}>
                <LongestSongsCard
                  items={longestSongs}
                  showEmptyState={false}
                  wlHomeV2
                />
              </StatsTile>
            : <StatsTile panelTitle="Most Common Not Played" bgIndex={5}>
                <StatCard
                  title="Most Common Not Played"
                  headerClassName="bg-white text-black py-2"
                  items={notPlayedSongs}
                  getDisplayName={(item) => item.song ?? ""}
                  getSong={(item) => item.song ?? ""}
                  getSongDisplayName={(item) => item.song_displayname ?? null}
                  getCount={(item) => item.play_count ?? 0}
                  showEmptyState={showEmptyState}
                  wlHomeV2
                />
              </StatsTile>
            }

            {selectedYear !== "all-time" && (
              <StatsTile panelTitle="Longest Songs" bgIndex={6}>
                <LongestSongsCard
                  items={longestSongs}
                  showEmptyState={showEmptyState}
                  wlHomeV2
                />
              </StatsTile>
            )}
            <StatsTile
              panelTitle="Top Returning Songs"
              bgIndex={selectedYear === "all-time" ? 6 : 7}
            >
              <LiberatedSongsCard
                items={liberatedSongs}
                showEmptyState={showEmptyState}
                wlHomeV2
              />
            </StatsTile>
            <StatsTile
              embed="tour-song-spread"
              bgIndex={selectedYear === "all-time" ? 7 : 8}
            >
              <TourSongSpread
                shows={songSpreadShows}
                variant="wl-home-v2-setlist"
              />
            </StatsTile>
          </div>
        </section>

        <section className="flex min-h-0 flex-col wl-home-v2-stats-archive-shows-section">
          <h2 className="sc-label wl-home-v2-songs-archive-section-heading">
            Shows
          </h2>
          <div className="grid grid--stats-4">
            <StatsTile
              panelTitle="Longest Shows"
              bgIndex={selectedYear === "all-time" ? 8 : 9}
            >
              <ShowStatCard
                title="Longest Shows"
                headerClassName="bg-muted py-2"
                items={longestShows}
                showLengthRank
                showEmptyState={showEmptyState}
                wlHomeV2
                wlHomeV2FixedShowStatRowHeight
              />
            </StatsTile>
            <StatsTile
              panelTitle="Shows with Rarest Setlist"
              bgIndex={selectedYear === "all-time" ? 9 : 10}
            >
              <ShowStatCard
                title="Shows with Rarest Setlist"
                headerClassName="bg-muted py-2"
                items={lowestRarityShows}
                valueFormatter={(value) => <RarityValue value={value} />}
                showEmptyState={showEmptyState}
                wlHomeV2
              />
            </StatsTile>
            <StatsTile
              panelTitle="Shows with Longest Average Show Gap"
              bgIndex={selectedYear === "all-time" ? 10 : 11}
            >
              <ShowStatCard
                title="Shows with Longest Average Show Gap"
                headerClassName="bg-muted py-2"
                items={highestGapShows}
                valueFormatter={(value) => <GapValue value={value} />}
                showEmptyState={showEmptyState}
                wlHomeV2
              />
            </StatsTile>
            <StatsTile
              panelTitle="Most Attended Shows"
              bgIndex={selectedYear === "all-time" ? 11 : 12}
            >
              <ShowStatCard
                title="Most Attended Shows"
                headerClassName="bg-muted py-2"
                items={highestAttendedShows}
                showEmptyState={showEmptyState}
                wlHomeV2
                wlHomeV2FixedShowStatRowHeight
              />
            </StatsTile>
            <StatsTile
              panelTitle="Highest Rated Shows"
              bgIndex={selectedYear === "all-time" ? 12 : 13}
              panelHeadRight={
                <span className="text-[10px] font-normal text-white/55 normal-case tracking-normal">
                  (min. 5 reviews)
                </span>
              }
            >
              <ShowStatCard
                title="Highest Rated Shows"
                headerClassName="bg-muted py-2"
                items={highestRatedShows}
                showEmptyState={showEmptyState}
                wlHomeV2
                wlHomeV2FixedShowStatRowHeight
              />
            </StatsTile>
          </div>
        </section>
      </div>
    </div>
  )
}
