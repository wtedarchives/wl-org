"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useSongMatrix } from "@/hooks/use-song-matrix"
import { getMatrixPlacementColor } from "@/lib/stats/tour-utils"

export type MatrixSortMode =
  | "alphabetical"
  | "chronological"
  | "playcount"

interface TourSongMatrixProps {
  shows: Array<{ show_id: string; show_date: string }>
  hideTitle?: boolean
  sortMode?: MatrixSortMode
  tourId?: string
  onSongClick?: (songName: string) => void
}

export function TourSongMatrix({
  shows,
  hideTitle = false,
  sortMode = "alphabetical",
  onSongClick,
}: TourSongMatrixProps) {
  const [showsWithEntries, setShowsWithEntries] = useState<Set<string>>(
    new Set(),
  )
  const [isFiltering, setIsFiltering] = useState(true)

  useEffect(() => {
    async function filter() {
      if (!shows?.length) {
        setShowsWithEntries(new Set())
        setIsFiltering(false)
        return
      }
      try {
        const { supabase } = await import("@/lib/supabase")
        if (!supabase) {
          setShowsWithEntries(new Set(shows.map((s) => s.show_id)))
          setIsFiltering(false)
          return
        }
        const showIds = shows.map((s) => s.show_id)
        const { data, error } = await supabase
          .from("setlist_entries")
          .select("entry_show")
          .in("entry_show", showIds)
        if (error) throw error
        const withEntries = new Set(
          (data ?? [])
            .map((e: any) => e.entry_show)
            .filter(Boolean),
        )
        setShowsWithEntries(withEntries)
      } catch {
        setShowsWithEntries(new Set(shows.map((s) => s.show_id)))
      } finally {
        setIsFiltering(false)
      }
    }
    filter()
  }, [shows])

  const filteredShows = useMemo(() => {
    if (isFiltering || showsWithEntries.size === 0) return []
    const sorted = [...shows].sort(
      (a, b) =>
        new Date(a.show_date).getTime() - new Date(b.show_date).getTime(),
    )
    return sorted.filter((s) => showsWithEntries.has(s.show_id))
  }, [shows, showsWithEntries, isFiltering])

  const { songMatrix, sortedSongs, isLoading, errorMessage } = useSongMatrix(
    filteredShows,
    sortMode,
  )

  if (isFiltering || isLoading) {
    return (
      <div className="rounded-lg border border-border/60 bg-card/80 p-4">
        <div className="flex justify-center items-center h-40 text-muted-foreground text-sm">
          Loading song matrix…
        </div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="rounded-lg border border-border/60 bg-card/80 p-4">
        <div className="text-center py-6 text-destructive">{errorMessage}</div>
      </div>
    )
  }

  if (songMatrix.songs.length === 0) {
    return (
      <div className="rounded-lg border border-border/60 bg-card/80 p-4">
        <div className="text-center py-6 text-muted-foreground">
          No song data available for this tour
        </div>
      </div>
    )
  }

  return (
    <div className={!hideTitle ? "rounded-lg border border-border/60 bg-card/80 p-3" : ""}>
      {!hideTitle && (
        <h2 className="text-lg font-semibold mb-4">
          {songMatrix.songs.length} Songs Played
        </h2>
      )}
      <div className="overflow-x-auto overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="pl-3 py-1.5 text-left text-xs font-medium bg-muted/50">
                Song
              </TableHead>
              {songMatrix.showDates.map((d, i) => (
                <TableHead
                  key={d.id}
                  className="px-1 py-1.5 text-center text-xs font-medium whitespace-nowrap min-w-[3rem]"
                >
                  <Link
                    href={`/dpro/setlist/${d.id}`}
                    className="hover:underline"
                  >
                    {d.displayDate}
                  </Link>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSongs.map((song) => {
              const performances = songMatrix.data[song] ?? []
              return (
                <TableRow
                  key={song}
                  className="bg-background/70 hover:bg-muted/40"
                >
                  <TableCell className="font-medium text-xs pl-3 py-0.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onSongClick?.(song)}
                      className="hover:underline cursor-pointer"
                    >
                      <SongDisplayName
                        song={song}
                        songDisplayName={songMatrix.songDisplayNameMap?.[song]}
                      />
                    </button>
                  </TableCell>
                  {filteredShows.map((show) => {
                    const perf = performances.find(
                      (p) => p.showId === show.show_id,
                    )
                    const base = getMatrixPlacementColor(perf?.placement ?? null)
                    const bg =
                      perf?.placement?.startsWith("Main Set")
                        ? "#333333"
                        : base
                    return (
                      <TableCell
                        key={`${song}-${show.show_id}`}
                        className="text-center border-x border-border p-0"
                        style={{
                          backgroundColor: bg || undefined,
                          minWidth: "3rem",
                        }}
                      >
                        {perf && (
                          <span className="text-white text-xs font-medium inline-block py-0.5">
                            {perf.venueAppearanceCount}
                          </span>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
