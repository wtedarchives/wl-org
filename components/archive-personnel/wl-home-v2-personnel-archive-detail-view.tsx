"use client"

import { notFound } from "next/navigation"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react"

import "@/components/archive-song/song-archive-detail-verbatim.css"

import { SongsArchiveSearchGlyph } from "@/components/archive-song/wl-home-v2-song-archive-search-glyph"
import { GuestPerformanceChart } from "@/components/dpro/personnel/guest-performance-chart"
import { PersonnelShowsByGroup } from "@/components/dpro/personnel/personnel-shows-by-group"
import { PersonnelSongSpreadCard } from "@/components/dpro/personnel/personnel-song-spread-card"
import { PersonnelSongsCard } from "@/components/dpro/personnel/personnel-songs-card"
import { WlHomeV2PersonnelArchiveDetailHeader } from "@/components/archive-personnel/wl-home-v2-personnel-archive-detail-header"
import { WlHomeV2PersonnelArchiveSearchModal } from "@/components/archive-personnel/wl-home-v2-personnel-archive-search-modal"
import {
  personnelArchiveSearchHits,
  type PersonnelSearchGuestRow,
} from "@/components/archive-personnel/personnel-archive-search-helpers"
import { WL_V2_ARCHIVES_BREADCRUMB_ROOT } from "@/components/setlist-breadcrumb-context"
import {
  WlHomeV2ArchiveCrumbsShell,
  WlHomeV2ArchiveCrumbsTrail,
} from "@/components/wl-home-v2/wl-home-v2-archive-crumbs"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import {
  useGuestData,
  type SongCount,
  type SongSpreadCategory,
} from "@/hooks/use-guest-data"
import { getPersonnelArchiveUrl } from "@/lib/personnel-archive-url"
import { supabase } from "@/lib/supabase"

export function WlHomeV2PersonnelArchiveDetailView({
  guestId,
}: {
  guestId: string
}) {
  const openArchiveHub = useWlHomeV2OpenArchiveHub()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [selectedSong, setSelectedSong] = useState<string | null>(null)

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [allGuests, setAllGuests] = useState<PersonnelSearchGuestRow[]>([])

  const {
    guest,
    performances,
    songs,
    songSpreadData,
    songShowMap,
    loading,
    error,
  } = useGuestData(guestId)

  const guestName = guest?.guest ?? "Guest"

  useWlHomeV2ScrollLock(searchOpen)

  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    ;(async () => {
      const { data, error: qError } = await supabase
        .from("guests")
        .select("guest_id, guest, guest_instrument")
        .order("guest", { ascending: true })
      if (cancelled || qError || !data) return
      setAllGuests(data as PersonnelSearchGuestRow[])
    })()
    return () => {
      cancelled = true
    }
  }, [guestId])

  const searchHits = useMemo(
    () => personnelArchiveSearchHits(allGuests, searchQuery),
    [allGuests, searchQuery],
  )

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    setSearchQuery("")
  }, [])

  const openPersonnelSearch = useCallback(() => {
    setSearchOpen(true)
    setSearchQuery("")
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false)
        setSearchQuery("")
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

  const handleGroupClick = (group: string) => {
    setSelectedGroup((current) => (current === group ? null : group))
  }

  const handleSongClick = (song: string) => {
    setSelectedSong((current) => (current === song ? null : song))
  }

  const { displaySongs, displaySongSpreadData } = useMemo(() => {
    if (!selectedGroup) {
      return { displaySongs: songs, displaySongSpreadData: songSpreadData }
    }
    const showIdsInGroup = new Set(
      performances
        .filter((p) => p.show_group === selectedGroup)
        .map((p) => p.show_id),
    )
    const filteredSongs: SongCount[] = songs
      .map((s) => {
        const groupCount =
          songShowMap[s.song]?.filter((id) => showIdsInGroup.has(id)).length ??
          0
        if (groupCount === 0) return null
        return { ...s, play_count: groupCount }
      })
      .filter((s): s is SongCount => s !== null)

    const categorySongs: Record<
      string,
      Array<{ song: string; playCount: number; artist?: string }>
    > = {}
    const categoryTotalPerformances: Record<string, number> = {}
    const categoryCanonIds: Record<string, number> = {}
    for (const s of songSpreadData) {
      categoryCanonIds[s.category] = s.canonid
    }
    for (const songItem of filteredSongs) {
      const category = songItem.category ?? "Uncategorized"
      if (!categorySongs[category]) {
        categorySongs[category] = []
        categoryTotalPerformances[category] = 0
      }
      const artist =
        songItem.original_artist?.trim() === "[Traditional]"
          ? "Traditional"
          : songItem.original_artist?.trim()
      categorySongs[category].push({
        song: songItem.song,
        playCount: songItem.play_count,
        artist: artist ?? undefined,
      })
      categoryTotalPerformances[category] += songItem.play_count
    }
    const filteredSpread: SongSpreadCategory[] = Object.keys(
      categoryTotalPerformances,
    ).map((category) => ({
      category,
      count: categoryTotalPerformances[category],
      canonid: categoryCanonIds[category] ?? 9999,
      songs: (categorySongs[category] ?? []).sort(
        (a, b) => b.playCount - a.playCount,
      ),
    }))
    filteredSpread.sort((a, b) => a.canonid - b.canonid)

    return { displaySongs: filteredSongs, displaySongSpreadData: filteredSpread }
  }, [selectedGroup, songs, songSpreadData, songShowMap, performances])

  useEffect(() => {
    if (!guest) return
    document.title = `${guestName} — WTEDRadio.com`
    return () => {
      document.title = "WTEDRadio.com"
    }
  }, [guest, guestName])

  useEffect(() => {
    setSelectedGroup(null)
    setSelectedSong(null)
  }, [guestId])

  if (loading) {
    return (
      <WlHomeV2PageLoading
        message={guest ? `Loading ${guest.guest}…` : "Loading personnel…"}
      />
    )
  }

  if (error || !guest) {
    notFound()
  }

  const breadcrumbs = [
    WL_V2_ARCHIVES_BREADCRUMB_ROOT,
    { label: "Personnel", href: "/archive/personnel" },
    {
      label: guestName,
      href: getPersonnelArchiveUrl(guestId),
    },
  ]

  const spreadVisible = displaySongSpreadData.length > 0
  const stripCardCount = spreadVisible ? 3 : 2

  return (
    <div className="song-archive-detail-vx wl-home-v2-song-archive-page personnel-archive-detail wl-home-v2-personnel-archive-page box-border flex min-h-0 min-w-0 w-full flex-1 flex-col px-4 py-5 sm:px-5 lg:px-[18px] lg:py-6">
      <WlHomeV2ArchiveCrumbsShell
        variant="page-gutter"
        className="wl-home-v2-archive-crumbs-shell--inline-selectors"
        selectorsAriaLabel="Search personnel"
        selectors={
          <button
            type="button"
            className="song-archive-detail-vx__crumbs-search-btn"
            title="Search personnel"
            aria-label="Search personnel"
            onClick={openPersonnelSearch}
          >
            <SongsArchiveSearchGlyph />
            <span>Search</span>
          </button>
        }
        trail={
          <WlHomeV2ArchiveCrumbsTrail
            items={breadcrumbs}
            openArchiveHub={openArchiveHub ?? undefined}
          />
        }
      />

      <WlHomeV2PersonnelArchiveSearchModal
        open={searchOpen}
        onClose={closeSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchHits={searchHits}
        searchInputRef={searchInputRef}
      />

      <div className="song-archive-detail-vx__main song-archive-detail-vx__main--no-side">
        <div className="col-main">
          <WlHomeV2PersonnelArchiveDetailHeader
            guest={guest}
            displayName={guestName}
          />

          {performances.length === 0 ?
            <div className="widget-panel rounded-lg border border-[rgb(63,65,64)] px-4 py-8 text-center backdrop-blur-sm">
              <p className="text-sm text-white/75">
                <span className="font-medium text-white">{guestName}</span>{" "}
                doesn&apos;t have any performance records.
              </p>
            </div>
          : <>
              <div
                className="info-strip"
                style={
                  {
                    "--info-strip-cards": stripCardCount,
                  } as CSSProperties
                }
              >
                <PersonnelSongsCard
                  stripLayout
                  songs={displaySongs}
                  selectedSong={selectedSong}
                  onSongClick={handleSongClick}
                />
                {spreadVisible ?
                  <div className="wl-home-v2-setlist flex min-h-0 min-w-0 max-h-[min(420px,50vh)] flex-col">
                    <div
                      className="side-card wl-home-v2-setlist-song-spread-side-card wl-home-v2-tour-stats-song-spread flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-[rgb(44,46,45)]"
                    >
                      <div className="sc-label">Song Spread</div>
                      <PersonnelSongSpreadCard
                        wlHomeV2
                        songSpreadData={displaySongSpreadData}
                      />
                    </div>
                  </div>
                : null}
                <PersonnelShowsByGroup
                  stripLayout
                  performances={performances}
                  selectedGroup={selectedGroup}
                  onGroupClick={handleGroupClick}
                />
              </div>

              <GuestPerformanceChart
                performances={performances}
                songShowMap={songShowMap}
                guestName={guestName}
                selectedGroup={selectedGroup}
                selectedSong={selectedSong}
                wlHomeV2
                onClearSelectedGroup={() => setSelectedGroup(null)}
                onClearSelectedSong={() => setSelectedSong(null)}
              />
            </>
          }
        </div>
      </div>
    </div>
  )
}
