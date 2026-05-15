"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { notFound, useRouter, useSearchParams } from "next/navigation"
import {
  useSetlistBreadcrumb,
  WTED_ARCHIVES_BREADCRUMB_ROOT,
} from "@/components/setlist-breadcrumb-context"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { useSongData } from "@/hooks/use-song-data"
import { useSongWtedAirplay } from "@/hooks/use-song-wted-airplay"
import { SongHeader } from "@/components/dpro/song/song-header"
import { SongInfo } from "@/components/dpro/song/song-info"
import { SongPerformanceChart } from "@/components/dpro/song/song-performance-chart"
import { SongWtedRadioPanel } from "@/components/dpro/song/song-wted-radio-panel"
import { SongLyrics } from "@/components/dpro/song/song-lyrics"
import { SetlistJotyDrawer } from "@/components/dpro/setlist/setlist-joty-drawer"
import { getSongArchiveUrl } from "@/lib/song-archive-url"

const SONG_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function SongPageContent({ songId }: { songId: string }) {
  const { setSetlistBreadcrumbs } = useSetlistBreadcrumb()
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [jotyDrawerOpen, setJotyDrawerOpen] = useState(false)
  const [jotyYear, setJotyYear] = useState<number | null>(null)
  const [jotyHighlightedEntryId, setJotyHighlightedEntryId] = useState<
    string | null
  >(null)

  const {
    song,
    songName,
    performances,
    stats,
    placementStats,
    lastPlayed,
    loading,
    error,
    progress,
  } = useSongData(songId)

  const wtedAirplay = useSongWtedAirplay(song?.song ?? null)
  const showWtedColumn =
    wtedAirplay.loading || wtedAirplay.groups.length > 0

  useEffect(() => {
    if (!song) {
      setSetlistBreadcrumbs(null)
      return
    }
    setSetlistBreadcrumbs([
      WTED_ARCHIVES_BREADCRUMB_ROOT,
      { label: "Songs", href: "/archive/songs" },
      { label: song.song, href: getSongArchiveUrl(songId) },
    ])
    return () => setSetlistBreadcrumbs(null)
  }, [song, songId, setSetlistBreadcrumbs])

  useEffect(() => {
    if (song) {
      document.title = `${song.song} – WTEDRadio.com`
      return () => {
        document.title = "WTEDRadio.com"
      }
    }
  }, [song])

  const handleGroupClick = (group: string) => {
    setSelectedGroup((current) => (current === group ? null : group))
  }

  const songInfoCardCount = useMemo(() => {
    if (!song) return 1
    const hasGroupCounts = stats.groupCounts.length > 0
    const hasSongNotes = !!song.song_coachnotes
    const hasPlacementStats = placementStats.length > 0
    return (
      1 +
      (hasGroupCounts ? 1 : 0) +
      (hasSongNotes ? 1 : 0) +
      (hasPlacementStats ? 1 : 0)
    )
  }, [song, stats.groupCounts.length, placementStats.length])

  /** Match SongInfo: 3+ cards can use `lg:@[1000px]/song-main:grid-cols-3` (wide row). */
  const performancesRowWideLayout = songInfoCardCount >= 3

  if (loading) {
    return (
      <LoadingPageCard
        message={songName ? `Loading ${songName}…` : undefined}
        page="song"
        progress={progress}
      />
    )
  }

  if (error || (!loading && !song)) {
    notFound()
  }

  if (!song) return null

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
      <SongHeader
        songName={song.song}
        songDisplayName={song.song_displayname}
      />

      <div
        className={`grid grid-cols-1 gap-4 ${
          song.song_lyrics ? "xl:grid-cols-[1fr_280px]" : ""
        }`}
      >
        <div className="@container/song-main min-w-0 space-y-4 xl:col-start-1">
          <SongInfo
            song={song}
            stats={stats}
            lastPlayed={lastPlayed}
            selectedGroup={selectedGroup}
            onGroupClick={handleGroupClick}
            placementStats={placementStats}
          />

          <div
            className={cn(
              "grid grid-cols-1 gap-3",
              performancesRowWideLayout &&
                showWtedColumn &&
                "lg:@[1000px]/song-main:grid-cols-3",
            )}
          >
            <div
              className={cn(
                "min-w-0",
                performancesRowWideLayout &&
                  showWtedColumn &&
                  "lg:@[1000px]/song-main:col-span-2",
              )}
            >
              <SongPerformanceChart
                performances={performances}
                selectedGroup={selectedGroup}
                songName={song.song}
                songDisplayName={song.song_displayname}
                onJOTYClick={(year, entryId) => {
                  setJotyYear(year)
                  setJotyHighlightedEntryId(entryId)
                  setJotyDrawerOpen(true)
                }}
              />
            </div>
            {showWtedColumn ? (
              <div
                className={cn(
                  "min-w-0",
                  performancesRowWideLayout &&
                    "lg:@[1000px]/song-main:col-span-1",
                )}
              >
                <SongWtedRadioPanel
                  groups={wtedAirplay.groups}
                  loading={wtedAirplay.loading}
                />
              </div>
            ) : null}
          </div>
        </div>

        {song.song_lyrics && (
          <div className="xl:col-start-2 xl:row-start-1">
            <SongLyrics lyrics={song.song_lyrics} />
          </div>
        )}
      </div>

      <SetlistJotyDrawer
        open={jotyDrawerOpen}
        onOpenChange={setJotyDrawerOpen}
        year={jotyYear}
        highlightedEntryId={jotyHighlightedEntryId}
      />
    </div>
  )
}

export default function SongArchivePageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawList = useMemo(
    () =>
      searchParams
        .getAll("id")
        .map((s) => s.trim())
        .filter(Boolean),
    [searchParams],
  )
  const idSet = new Set(rawList)
  const songIdParam = rawList[0] ?? ""

  useEffect(() => {
    if (songIdParam) return
    router.replace("/archive/songs")
  }, [songIdParam, router])

  if (idSet.size > 1) notFound()

  if (!songIdParam) {
    return (
      <LoadingPageCard message="Opening songs…" page="song" />
    )
  }

  if (!SONG_ID_RE.test(songIdParam)) notFound()

  return <SongPageContent songId={songIdParam} />
}
