"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDownIcon } from "lucide-react"
import { isSupabaseConfigured, supabase } from "@/lib/supabase"
import { useStatsData } from "@/hooks/use-stats-data"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { StatCard } from "@/components/dpro/stats/stat-card"
import { LongestSongsCard } from "@/components/dpro/stats/longest-songs-card"
import { LiberatedSongsCard } from "@/components/dpro/stats/liberated-songs-card"
import {
  ShowStatCard,
  RarityValue,
  GapValue,
} from "@/components/dpro/stats/show-stat-card"

const DEFAULT_YEAR = 2025
const YEARS = [
  "all-time",
  ...Array.from({ length: 13 }, (_, i) => 2026 - i),
] as const

function DproStatsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const yearParam = searchParams.get("year")
  const selectedYear =
    yearParam === "all-time"
      ? "all-time"
      : yearParam
        ? (() => {
            const n = parseInt(yearParam, 10)
            return Number.isNaN(n) ? DEFAULT_YEAR : n
          })()
        : null

  const [connectionError, setConnectionError] = useState(false)

  useEffect(() => {
    if (selectedYear !== null) {
      const yearLabel = selectedYear === "all-time" ? "All-Time" : String(selectedYear)
      document.title = `${yearLabel} Stats – WTED.org`
    }
    return () => { document.title = "" }
  }, [selectedYear])

  useEffect(() => {
    if (selectedYear !== null) return
    const params = new URLSearchParams(searchParams.toString())
    params.set("year", String(DEFAULT_YEAR))
    router.replace(`/dpro/stats?${params.toString()}`, { scroll: false })
  }, [selectedYear, router, searchParams])

  const testConnection = useCallback(async () => {
    if (!supabase) {
      setConnectionError(true)
      return
    }
    try {
      const { error } = await supabase
        .from("shows")
        .select("show_id")
        .limit(1)
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
    isAnyStatLoading,
  } = useStatsData(selectedYear ?? DEFAULT_YEAR)

  const setYear = (year: number | string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("year", String(year))
    router.replace(`/dpro/stats?${params.toString()}`, { scroll: false })
  }

  if (!isSupabaseConfigured() || connectionError) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-center text-sm text-muted-foreground">
          Trouble communicating with the database server. Please reload the
          page.
        </p>
      </div>
    )
  }

  if (selectedYear === null) {
    return null
  }

  if (isAnyStatLoading) {
    return <LoadingPageCard message="Loading stats data…" />
  }

  const yearLabel = selectedYear === "all-time" ? "All-Time" : String(selectedYear)
  const showEmptyState = selectedYear !== "all-time"

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 rounded-b-none md:rounded-b-xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">
          {yearLabel} Stats
        </h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              {yearLabel}
              <ChevronDownIcon className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
            {YEARS.map((y) => (
              <DropdownMenuItem
                key={y}
                onClick={() => setYear(y)}
              >
                {y === "all-time" ? "All-Time" : String(y)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-6">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Songs
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <StatCard
              title="Top Songs Played"
              headerClassName="bg-[#3C1E40] text-white py-2"
              items={topSongs}
              getDisplayName={(item) => item.song ?? ""}
              getSong={(item) => item.song ?? ""}
              getSongDisplayName={(item) => item.song_displayname ?? null}
              getCount={(item) => item.play_count ?? 0}
              showEmptyState={showEmptyState}
            />
            <StatCard
              title="Top Show Openers"
              headerClassName="bg-[#047857] text-white py-2"
              items={showOpeners}
              getDisplayName={(item) => item.song_name ?? ""}
              getSong={(item) => item.song_name ?? ""}
              getSongDisplayName={(item) => item.song_displayname ?? null}
              getCount={(item) => item.times_played ?? 0}
              showEmptyState={showEmptyState}
            />
            <StatCard
              title="Top Set Openers"
              headerClassName="bg-[#10b981] text-white py-2"
              items={setOpeners}
              getDisplayName={(item) => item.song_name ?? ""}
              getSong={(item) => item.song_name ?? ""}
              getSongDisplayName={(item) => item.song_displayname ?? null}
              getCount={(item) => item.times_played ?? 0}
              showEmptyState={showEmptyState}
            />
            <StatCard
              title="Top Set Closers"
              headerClassName="bg-[#3b82f6] text-white py-2"
              items={setClosers}
              getDisplayName={(item) => item.song_name ?? ""}
              getSong={(item) => item.song_name ?? ""}
              getSongDisplayName={(item) => item.song_displayname ?? null}
              getCount={(item) => item.times_played ?? 0}
              showEmptyState={showEmptyState}
            />
            <StatCard
              title="Top Encores"
              headerClassName="bg-[#be123c] text-white py-2"
              items={encores}
              getDisplayName={(item) => item.song_name ?? ""}
              getSong={(item) => item.song_name ?? ""}
              getSongDisplayName={(item) => item.song_displayname ?? null}
              getCount={(item) => item.times_played ?? 0}
              showEmptyState={showEmptyState}
            />
            {selectedYear === "all-time" ? (
              <LongestSongsCard items={longestSongs} showEmptyState={false} />
            ) : (
              <StatCard
                title="Most Common Not Played"
                headerClassName="bg-white text-black py-2"
                items={notPlayedSongs}
                getDisplayName={(item) => item.song ?? ""}
                getSong={(item) => item.song ?? ""}
                getSongDisplayName={(item) => item.song_displayname ?? null}
                getCount={(item) => item.play_count ?? 0}
                showEmptyState={showEmptyState}
              />
            )}

            {selectedYear !== "all-time" && (
              <LongestSongsCard
                items={longestSongs}
                showEmptyState={showEmptyState}
              />
            )}
            <LiberatedSongsCard
              items={liberatedSongs}
              showEmptyState={showEmptyState}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Shows
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <ShowStatCard
              title="Longest Shows"
              headerClassName="bg-muted py-2"
              items={longestShows}
              showLengthRank
              showEmptyState={showEmptyState}
            />
            <ShowStatCard
              title="Shows with Rarest Setlist"
              headerClassName="bg-muted py-2"
              items={lowestRarityShows}
              valueFormatter={(value) => <RarityValue value={value} />}
              showEmptyState={showEmptyState}
            />
            <ShowStatCard
              title="Shows with Longest Average Show Gap"
              headerClassName="bg-muted py-2"
              items={highestGapShows}
              valueFormatter={(value) => <GapValue value={value} />}
              showEmptyState={showEmptyState}
            />
            <ShowStatCard
              title="Most Attended Shows"
              headerClassName="bg-muted py-2"
              items={highestAttendedShows}
              showEmptyState={showEmptyState}
            />
            <ShowStatCard
              title="Highest Rated Shows"
              headerClassName="bg-muted py-2"
              items={highestRatedShows}
              showEmptyState={showEmptyState}
              subtitle="(min. 5 reviews)"
            />
          </div>
        </section>
      </div>
    </div>
  )
}

export default function DproStatsPage() {
  return (
    <Suspense fallback={<LoadingPageCard message="Loading stats data…" />}>
      <DproStatsContent />
    </Suspense>
  )
}
