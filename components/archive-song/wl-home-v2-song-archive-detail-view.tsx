"use client"

import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

import {
  placementLegendRows,
  placementStatsForVerbatimBar,
  WlHomeV2SongArchiveDetailPerformances,
} from "@/components/archive-song/wl-home-v2-song-archive-detail-performances"
import { SongsArchiveListSearchModal } from "@/components/archive-songs/wl-home-v2-songs-archive-list-modals"
import { songsArchiveSearchHits } from "@/components/archive-songs/songs-archive-helpers"
import { SetlistJotyDrawer } from "@/components/dpro/setlist/setlist-joty-drawer"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { WL_V2_ARCHIVES_BREADCRUMB_ROOT } from "@/components/setlist-breadcrumb-context"
import {
  WlHomeV2ArchiveCrumbsShell,
  WlHomeV2ArchiveCrumbsTrail,
} from "@/components/wl-home-v2/wl-home-v2-archive-crumbs"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { useSongData } from "@/hooks/use-song-data"
import { useSongsArchiveData } from "@/hooks/use-songs-archive-data"
import { useSongWtedAirplay } from "@/hooks/use-song-wted-airplay"
import { songDetailPlacementLegendSwatch } from "@/lib/song-detail-placement-chip"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { formatSetlistDate, getRarityColor } from "@/lib/setlist-utils"
import { getWtedEpisodeDisplayName } from "@/lib/wted-episode-display-name"
import { getWtedEpisodeUrl } from "@/lib/wted-episode-url"
import { CaretDown, CaretUp } from "@phosphor-icons/react"

import "./song-archive-detail-verbatim.css"

function categoryInitials(category: string): string {
  const parts = category.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Matches `SongLyrics` (`components/dpro/song/song-lyrics.tsx`): wrap [labels] for
 * emphasis; any other markup in `song_lyrics` passes through via `dangerouslySetInnerHTML`.
 */
function formatLyricsHtml(lyrics: string): string {
  return lyrics.replace(
    /\[(.*?)\]/g,
    '<span class="lyrics-bracket-tag">[$1]</span>',
  )
}

function SongsArchiveSearchGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function WlHomeV2SongArchiveDetailView({ songId }: { songId: string }) {
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
    document.title = `${song.song_displayname?.trim() || song.song} — WTED.org`
    return () => {
      document.title = ""
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
          <div className="song-header">
            <div className="left">
              <div
                className="artwork-float"
                style={{
                  width: 52,
                  height: 52,
                  margin: 0,
                  float: "none",
                  flexShrink: 0,
                }}
                title={`${song.song_category} artwork`}
              >
                {song.categories?.category_artwork ?
                  <Image
                    src={song.categories.category_artwork}
                    alt=""
                    width={52}
                    height={52}
                    className="size-full object-cover"
                    unoptimized
                  />
                : categoryInitials(song.song_category)}
              </div>
              <div>
                <h1>
                  <SongDisplayName
                    song={song.song}
                    songDisplayName={song.song_displayname}
                    underlineOnHover={false}
                  />
                  {subtitleParts.length > 0 ?
                    <span className="alt-name">{subtitleParts.join(" · ")}</span>
                  : null}
                </h1>
              </div>
            </div>
          </div>

          <div
            className="info-strip"
            style={
              {
                "--info-strip-cards": infoStripCardCount,
              } as React.CSSProperties
            }
          >
            <div className="card">
              <div className="card-head">
                <h3>Song Info</h3>
              </div>
              <div className="card-body">
                {song.song_originalartist?.trim() ?
                  <div className="info-row">
                    <div className="lbl">Original Artist</div>
                    <div className="val">{song.song_originalartist}</div>
                  </div>
                : null}
                {song.song_writer?.trim() ?
                  <div className="info-row">
                    <div className="lbl">Writer</div>
                    <div className="val">{song.song_writer}</div>
                  </div>
                : null}
                {lastPlayed ?
                  <div className="info-row">
                    <div className="lbl">Last Time Played</div>
                    <div className="val">
                      <Link
                        href={getSetlistArchiveUrl(lastPlayed.show_id)}
                        className="venue-link"
                      >
                        {formatSetlistDate(lastPlayed.show_date)}
                      </Link>
                      <span className="sub">
                        (
                        {lastPlayed.showsAgo === 1 ?
                          "most recent show"
                        : `${lastPlayed.showsAgo} shows ago`}
                        )
                      </span>
                    </div>
                  </div>
                : null}
              </div>
            </div>

            {stats.groupCounts.length > 0 ?
              <div className="card">
                <div className="card-head">
                  <h3>Stats</h3>
                  <span className="hd-meta">
                    {stats.totalShows} performance
                    {stats.totalShows === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="card-body">
                  {stats.hasRarity ?
                    <div className="stats-rarity">
                      <span style={{ color: "rgba(255,255,255,0.7)" }}>
                        SONG RARITY
                      </span>
                      <span
                        className="rare-pill"
                        style={{
                          backgroundColor: getRarityColor(stats.rarity),
                          color: "#fff",
                        }}
                      >
                        {stats.rarity}
                      </span>
                    </div>
                  : null}
                  <div
                    className="lbl"
                    style={{
                      fontFamily: '"Geist Mono", monospace',
                      fontSize: 10,
                      color: "rgba(255,255,255,0.5)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    Performances by Group
                  </div>
                  <ul className="group-count-list">
                    {stats.groupCounts.map(({ group, count }) => (
                      <li key={group}>
                        <button
                          type="button"
                          className={`group-count-btn${selectedGroup === group ? " active" : ""}`}
                          data-group={group}
                          onClick={() => {
                            setSelectedPlacement(null)
                            setSelectedGroup((g) =>
                              g === group ? null : group,
                            )
                          }}
                        >
                          <span className="gn-name">{group}</span>
                          <span className="gn-count">{count}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            : null}

            {song.song_coachnotes?.trim() ?
              <div className="card notes-card">
                <div className="card-head">
                  <h3>Coach&apos;s Notes</h3>
                </div>
                <div
                  className="card-body"
                  dangerouslySetInnerHTML={{ __html: song.song_coachnotes }}
                />
              </div>
            : null}

            {placementStats.length > 0 ?
              <div className="card">
                <div className="card-head">
                  <h3>Set Placements</h3>
                </div>
                <div className="card-body">
                  <div className="placement-bar">
                    {barSegments.map((s) => (
                      <button
                        key={s.placement}
                        type="button"
                        className={`pb-seg${selectedPlacement === s.placement ? " active" : ""}`}
                        aria-label={`Filter performances by ${s.placement}`}
                        aria-pressed={selectedPlacement === s.placement}
                        style={{
                          flex: s.flex,
                          background: songDetailPlacementLegendSwatch(
                            s.placement,
                          ),
                        }}
                        onClick={() => {
                          setSelectedGroup(null)
                          setSelectedPlacement((cur) =>
                            cur === s.placement ? null : s.placement,
                          )
                        }}
                      />
                    ))}
                  </div>
                  <div className="placement-legend">
                    {legendRows.map((row) => (
                      <button
                        key={row.placement}
                        type="button"
                        className={`pl-row placement-legend-btn${selectedPlacement === row.placement ? " active" : ""}`}
                        aria-label={`Filter performances by ${row.placement}`}
                        aria-pressed={selectedPlacement === row.placement}
                        onClick={() => {
                          setSelectedGroup(null)
                          setSelectedPlacement((cur) =>
                            cur === row.placement ? null : row.placement,
                          )
                        }}
                      >
                        <span
                          className="sw"
                          style={{ background: row.swatch }}
                        />
                        <span className="nm">{row.placement}</span>
                        <span className="ct">{row.count}</span>
                        <span className="pct">{Math.round(row.pct)}%</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            : null}
          </div>

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
              />
            </div>
            {showWtedBesidePerformances ?
              <aside
                className="perf-wted-band__wted"
                aria-label="WTED Radio appearances"
              >
                <div className="card">
                  <div className="card-head wted-card-head">
                    <h3>WTED Radio</h3>
                    <p className="wted-intro">
                      Performances that appear in episodes on WTED Radio.
                    </p>
                  </div>
                  <div className="wted-list-scroll-shell">
                    {wtedScrollUp ?
                      <button
                        type="button"
                        className="wted-scroll-hint wted-scroll-hint--up"
                        aria-label="Scroll WTED list up"
                        onClick={() => scrollWtedListBy(-140)}
                      >
                        <CaretUp
                          size={12}
                          weight="bold"
                          aria-hidden
                          className="wted-scroll-hint-icon"
                        />
                      </button>
                    : null}
                    <ul ref={wtedListRef} className="wted-list">
                      {wted.loading ?
                        <li style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>
                          Loading…
                        </li>
                      : wted.groups.map((g) => {
                          const dateText =
                            g.showDate ? formatSetlistDate(g.showDate) : null
                          const rowKey =
                            g.showId
                            ?? `r:${g.showDate}:${g.venueLocation}`
                          return (
                            <li key={rowKey}>
                              <div className="wted-date">
                                {dateText && g.showId ?
                                  <Link href={getSetlistArchiveUrl(g.showId)}>
                                    {dateText}
                                  </Link>
                                : dateText}
                                {g.venueLocation?.trim() ?
                                  <span className="wted-venue">
                                    {" "}
                                    {"\u00A0"}
                                    ·
                                    {"\u00A0"}
                                    {" "}
                                    {g.venueLocation}
                                  </span>
                                : null}
                              </div>
                              <ul className="wted-eps">
                                {g.episodes.map((ep) => (
                                  <li key={ep.eeUuid}>
                                    <span className="series">{ep.wtedSeries}</span>
                                    <span className="ep">
                                      <Link href={getWtedEpisodeUrl(ep.episodeUuid)}>
                                        {getWtedEpisodeDisplayName(
                                          ep.episodeCode,
                                          ep.episodeDisplayName,
                                        )}
                                      </Link>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </li>
                          )
                        })}
                    </ul>
                    {wtedScrollDown ?
                      <button
                        type="button"
                        className="wted-scroll-hint wted-scroll-hint--down"
                        aria-label="Scroll WTED list down"
                        onClick={() => scrollWtedListBy(140)}
                      >
                        <CaretDown
                          size={12}
                          weight="bold"
                          aria-hidden
                          className="wted-scroll-hint-icon"
                        />
                      </button>
                    : null}
                  </div>
                </div>
              </aside>
            : null}
          </div>
        </div>

        {hasLyricsSide ?
          <div className="col-side">
            <div className="card lyrics-card">
              <div className="card-head">
                <h3>Lyrics</h3>
              </div>
              <div className="card-body">
                <div
                  className="lyrics-card__html"
                  dangerouslySetInnerHTML={{
                    __html: formatLyricsHtml(song.song_lyrics ?? ""),
                  }}
                />
              </div>
            </div>
          </div>
        : null}
      </div>

      <SongsArchiveListSearchModal
        open={searchOpen}
        onClose={closeSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchHits={searchHits}
        searchInputRef={searchInputRef}
      />
      <SetlistJotyDrawer
        open={jotyOpen}
        onOpenChange={setJotyOpen}
        year={jotyYear}
        highlightedEntryId={jotyEntryId}
      />
    </div>
  )
}
