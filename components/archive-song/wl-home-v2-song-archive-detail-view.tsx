"use client"

import { notFound } from "next/navigation"
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { SongArchiveLengthBoxplot } from "@/components/archive-song/song-archive-length-boxplot"
import {
  placementLegendRows,
  placementStatsForVerbatimBar,
  type SongArchivePerformanceWtedPayload,
  WlHomeV2SongArchiveDetailPerformances,
} from "@/components/archive-song/wl-home-v2-song-archive-detail-performances"
import { WlHomeV2SongArchiveDetailHeader } from "@/components/archive-song/wl-home-v2-song-archive-detail-header"
import { WlHomeV2SongArchiveDetailInfoStrip } from "@/components/archive-song/wl-home-v2-song-archive-detail-info-strip"
import { WlHomeV2SongArchiveDetailModals } from "@/components/archive-song/wl-home-v2-song-archive-detail-modals"
import { WlHomeV2SongArchiveDetailWtedAside } from "@/components/archive-song/wl-home-v2-song-archive-detail-wted-aside"
import { WlHomeV2SongArchiveDetailLyricsColumn } from "@/components/archive-song/wl-home-v2-song-archive-detail-lyrics-column"
import { SongsArchiveSearchGlyph } from "@/components/archive-song/wl-home-v2-song-archive-search-glyph"
import { songsArchiveSearchHits } from "@/components/archive-songs/songs-archive-helpers"
import { useAuth } from "@/components/auth-context"
import { WL_V2_ARCHIVES_BREADCRUMB_ROOT } from "@/components/setlist-breadcrumb-context"
import {
  WlHomeV2ArchiveCrumbsShell,
  WlHomeV2ArchiveCrumbsTrail,
} from "@/components/wl-home-v2/wl-home-v2-archive-crumbs"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { useSetlistData } from "@/hooks/use-setlist-data"
import { useSongData } from "@/hooks/use-song-data"
import { useSongsArchiveData } from "@/hooks/use-songs-archive-data"
import { useSongWtedAirplay } from "@/hooks/use-song-wted-airplay"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { SongDisplayName } from "@/components/dpro/song-display-name"

import "./song-archive-detail-verbatim.css"

export function WlHomeV2SongArchiveDetailView({ songId }: { songId: string }) {
  const { session } = useAuth()
  const songPerfWtedModalHeadingId = useId()
  const openArchiveHub = useWlHomeV2OpenArchiveHub()
  const { songs: archiveSongs } = useSongsArchiveData()

  const {
    song,
    songName,
    performances,
    stats,
    placementStats,
    lastPlayed,
    loading,
    error,
  } = useSongData(songId)

  const wted = useSongWtedAirplay(song?.song ?? null)

  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [selectedPlacement, setSelectedPlacement] = useState<string | null>(
    null,
  )
  const [jotyOpen, setJotyOpen] = useState(false)
  const [jotyYear, setJotyYear] = useState<number | null>(null)
  const [jotyEntryId, setJotyEntryId] = useState<string | null>(null)

  const [songPerfWtedModal, setSongPerfWtedModal] =
    useState<SongArchivePerformanceWtedPayload | null>(null)
  const [perfTableWtedLoginRequiredOpen, setPerfTableWtedLoginRequiredOpen] =
    useState(false)

  const { setlist: perfTableWtedAnchorSetlist } = useSetlistData(
    songPerfWtedModal?.entry.entry_show,
  )

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  const wtedListRef = useRef<HTMLUListElement>(null)
  const [wtedScrollUp, setWtedScrollUp] = useState(false)
  const [wtedScrollDown, setWtedScrollDown] = useState(false)

  useWlHomeV2ScrollLock(searchOpen)

  const searchHits = useMemo(
    () => songsArchiveSearchHits(archiveSongs, searchQuery),
    [archiveSongs, searchQuery],
  )

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    setSearchQuery("")
  }, [])

  const openSongArchiveSearch = useCallback(() => {
    setSearchOpen(true)
    setSearchQuery("")
  }, [])

  const songPerfWtedModalOpen = !!songPerfWtedModal

  const onPerfTableWtedPayloadClick = useCallback(
    (payload: SongArchivePerformanceWtedPayload) => {
      if (!session) {
        setPerfTableWtedLoginRequiredOpen(true)
        return
      }
      setSongPerfWtedModal(payload)
    },
    [session],
  )

  const closePerfTableWtedModal = useCallback(() => {
    setSongPerfWtedModal(null)
  }, [])

  useEffect(() => {
    if (!songPerfWtedModalOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      closePerfTableWtedModal()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [songPerfWtedModalOpen, closePerfTableWtedModal])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (searchOpen) {
          setSearchOpen(false)
          setSearchQuery("")
        }
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen(true)
        setSearchQuery("")
        setTimeout(() => searchInputRef.current?.focus(), 40)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [searchOpen])

  useEffect(() => {
    if (!searchOpen) return
    setTimeout(() => searchInputRef.current?.focus(), 40)
  }, [searchOpen])

  useEffect(() => {
    setSelectedGroup(null)
    setSelectedPlacement(null)
  }, [songId])

  useEffect(() => {
    if (!song) return
    document.title = `${song.song_displayname?.trim() || song.song} — WTEDRadio.com`
    return () => {
      document.title = "WTEDRadio.com"
    }
  }, [song])

  const subtitleParts = useMemo(() => {
    if (!song) return []
    return [song.song_category]
  }, [song])

  const barSegments = useMemo(
    () => placementStatsForVerbatimBar(placementStats),
    [placementStats],
  )

  const legendRows = useMemo(
    () => placementLegendRows(placementStats),
    [placementStats],
  )

  /** Must stay aligned with conditional `.card` blocks in `info-strip` below. */
  const infoStripCardCount = useMemo(() => {
    let n = 1
    if (stats.groupCounts.length > 0) n += 1
    if (song?.song_coachnotes?.trim()) n += 1
    if (placementStats.length > 0) n += 1
    return n
  }, [
    stats.groupCounts.length,
    song?.song_coachnotes,
    placementStats.length,
  ])

  const showWtedBesidePerformances =
    wted.loading || wted.groups.length > 0

  const hasLyricsSide = Boolean(song?.song_lyrics?.trim())

  const scrollWtedListBy = useCallback((delta: number) => {
    const behavior =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ?
        ("auto" as const)
      : ("smooth" as const)
    wtedListRef.current?.scrollBy({ top: delta, behavior })
  }, [])

  useLayoutEffect(() => {
    if (!showWtedBesidePerformances || loading) {
      setWtedScrollUp(false)
      setWtedScrollDown(false)
      return
    }

    const el = wtedListRef.current
    if (!el) return

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      const eps = 2
      if (scrollHeight <= clientHeight + eps) {
        setWtedScrollUp(false)
        setWtedScrollDown(false)
        return
      }
      setWtedScrollUp(scrollTop > eps)
      setWtedScrollDown(scrollTop + clientHeight < scrollHeight - eps)
    }

    update()
    const t = window.setTimeout(update, 0)
    el.addEventListener("scroll", update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    const mo = new MutationObserver(() => {
      queueMicrotask(update)
    })
    mo.observe(el, { childList: true, subtree: true })
    return () => {
      window.clearTimeout(t)
      el.removeEventListener("scroll", update)
      ro.disconnect()
      mo.disconnect()
    }
  }, [showWtedBesidePerformances, wted.loading, wted.groups, loading])

  if (loading) {
    return (
      <WlHomeV2PageLoading
        message={songName ? `Loading ${songName}…` : "Loading song…"}
      />
    )
  }

  if (error || !song) {
    notFound()
  }

  const breadcrumbs = [
    WL_V2_ARCHIVES_BREADCRUMB_ROOT,
    { label: "Songs", href: "/archive/songs" },
    {
      label: song.song_displayname?.trim() || song.song,
      href: getSongArchiveUrl(songId),
    },
  ]

  return (
    <div
      className="song-archive-detail-vx wl-home-v2-song-archive-page box-border flex min-h-0 min-w-0 w-full flex-1 flex-col px-4 py-5 sm:px-5 lg:px-[18px] lg:py-6"
    >
      <WlHomeV2ArchiveCrumbsShell
        variant="page-gutter"
        selectorsAriaLabel="Search songs"
        selectors={
          <button
            type="button"
            className="song-archive-detail-vx__crumbs-search-btn"
            title="Search songs"
            aria-label="Search songs"
            onClick={openSongArchiveSearch}
          >
            <SongsArchiveSearchGlyph />
            <span>Search</span>
          </button>
        }
        trail={
          <WlHomeV2ArchiveCrumbsTrail
            items={breadcrumbs}
            openArchiveHub={openArchiveHub ?? undefined}
            renderLastCrumb={() => (
              <SongDisplayName
                song={song.song}
                songDisplayName={song.song_displayname}
                underlineOnHover={false}
              />
            )}
          />
        }
      />

      <div
        className={
          hasLyricsSide ?
            "song-archive-detail-vx__main"
          : "song-archive-detail-vx__main song-archive-detail-vx__main--no-side"
        }
      >
        <div className="col-main">
          <WlHomeV2SongArchiveDetailHeader
            song={song}
            subtitleParts={subtitleParts}
          />

          <WlHomeV2SongArchiveDetailInfoStrip
            song={song}
            stats={stats}
            lastPlayed={lastPlayed}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            selectedPlacement={selectedPlacement}
            setSelectedPlacement={setSelectedPlacement}
            barSegments={barSegments}
            legendRows={legendRows}
            infoStripCardCount={infoStripCardCount}
            hasPlacements={placementStats.length > 0}
          />

          <div
            className={
              showWtedBesidePerformances ?
                "perf-wted-band perf-wted-band--split"
              : "perf-wted-band"
            }
          >
            <div className="perf-wted-band__performances">
              <WlHomeV2SongArchiveDetailPerformances
                performances={performances}
                songCanonical={song?.song ?? ""}
                songDisplayName={song?.song_displayname ?? null}
                selectedGroup={selectedGroup}
                selectedPlacement={selectedPlacement}
                onClearPerformanceFilter={() => {
                  setSelectedGroup(null)
                  setSelectedPlacement(null)
                }}
                onJotyBadgeClick={(year, entryId) => {
                  setJotyYear(year)
                  setJotyEntryId(entryId)
                  setJotyOpen(true)
                }}
                onWtedPayloadClick={onPerfTableWtedPayloadClick}
              />
              <SongArchiveLengthBoxplot performances={performances} />
            </div>
            {showWtedBesidePerformances ?
              <WlHomeV2SongArchiveDetailWtedAside
                wtedListRef={wtedListRef}
                wtedScrollUp={wtedScrollUp}
                wtedScrollDown={wtedScrollDown}
                scrollWtedListBy={scrollWtedListBy}
                loading={wted.loading}
                groups={wted.groups}
              />
            : null}
          </div>
        </div>

        {hasLyricsSide ? <WlHomeV2SongArchiveDetailLyricsColumn song={song} /> : null}
      </div>

      <WlHomeV2SongArchiveDetailModals
        searchOpen={searchOpen}
        closeSearch={closeSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchHits={searchHits}
        searchInputRef={searchInputRef}
        perfTableWtedLoginRequiredOpen={perfTableWtedLoginRequiredOpen}
        setPerfTableWtedLoginRequiredOpen={setPerfTableWtedLoginRequiredOpen}
        songPerfWtedModalOpen={songPerfWtedModalOpen}
        closePerfTableWtedModal={closePerfTableWtedModal}
        songPerfWtedModal={songPerfWtedModal}
        perfTableWtedAnchorSetlist={perfTableWtedAnchorSetlist}
        songPerfWtedModalHeadingId={songPerfWtedModalHeadingId}
        jotyOpen={jotyOpen}
        setJotyOpen={setJotyOpen}
        jotyYear={jotyYear}
        jotyEntryId={jotyEntryId}
      />
    </div>
  )
}
