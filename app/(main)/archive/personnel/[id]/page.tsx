"use client"

import { use, useEffect, useMemo, useState } from "react"
import { notFound } from "next/navigation"
import { useSetlistBreadcrumb } from "@/components/setlist-breadcrumb-context"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { useGuestData } from "@/hooks/use-guest-data"
import type { SongCount, SongSpreadCategory } from "@/hooks/use-guest-data"
import { PersonnelHeader } from "@/components/dpro/personnel/personnel-header"
import { PersonnelSongsCard } from "@/components/dpro/personnel/personnel-songs-card"
import { PersonnelSongSpreadCard } from "@/components/dpro/personnel/personnel-song-spread-card"
import { PersonnelShowsByGroup } from "@/components/dpro/personnel/personnel-shows-by-group"
import { GuestPerformanceChart } from "@/components/dpro/personnel/guest-performance-chart"

export default function PersonnelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: guestId } = use(params)
  const { setSetlistBreadcrumbs } = useSetlistBreadcrumb()
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [selectedSong, setSelectedSong] = useState<string | null>(null)

  const {
    guest,
    performances,
    songs,
    songSpreadData,
    songShowMap,
    loading,
    progress,
    error,
  } = useGuestData(guestId)

  const guestName = guest?.guest ?? "Guest"

  useEffect(() => {
    if (!guest) {
      setSetlistBreadcrumbs(null)
      return
    }
    setSetlistBreadcrumbs([
      { label: "Setlist Archive", href: "/archive" },
      { label: "Personnel", href: "/archive/personnel" },
      { label: guestName, href: "" },
    ])
    return () => setSetlistBreadcrumbs(null)
  }, [guest, guestName, setSetlistBreadcrumbs])

  useEffect(() => {
    if (guest) {
      document.title = `${guestName} – WysteriaLane.org`
      return () => {
        document.title = ""
      }
    }
  }, [guest, guestName])

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
          songShowMap[s.song]?.filter((id) => showIdsInGroup.has(id)).length ?? 0
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

  if (!guestId) notFound()

  if (loading) {
    return (
      <LoadingPageCard
        message={guest ? `Loading ${guest.guest}…` : undefined}
        page="personnel"
        progress={progress}
      />
    )
  }

  if (error || (!loading && !guest)) {
    notFound()
  }

  if (!guest) return null

  if (performances.length === 0) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
        <PersonnelHeader
          guestName={guestName}
          guestInstrument={guest.guest_instrument}
        />
        <div className="rounded-lg border border-border/60 bg-card/80 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{guestName}</span> doesn&apos;t have
            any performance records.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
      <PersonnelHeader
        guestName={guestName}
        guestInstrument={guest.guest_instrument}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <PersonnelSongsCard
          songs={displaySongs}
          selectedSong={selectedSong}
          onSongClick={handleSongClick}
        />
        <PersonnelSongSpreadCard songSpreadData={displaySongSpreadData} />
        <PersonnelShowsByGroup
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
      />
    </div>
  )
}
