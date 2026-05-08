"use client"


import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
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
import {
  compareTourMatrixShows,
  useSongMatrix,
  type SongMatrixShowInput,
} from "@/hooks/use-song-matrix"
import { getMatrixPlacementColor } from "@/lib/stats/tour-utils"
import { cn } from "@/lib/utils"

/** WL songs matrix: grid lines read clearly on dark panel (lighter than `rgb(34,37,35)` dividers). */
const WL_MATRIX_BORDER = "border-[rgb(63,65,64)]"

export type MatrixSortMode =
  | "alphabetical"
  | "chronological"
  | "playcount"

interface TourSongMatrixProps {
  shows: SongMatrixShowInput[]
  hideTitle?: boolean
  sortMode?: MatrixSortMode
  tourId?: string
  onSongClick?: (songName: string, songDisplayName?: string | null) => void
  /** Keeps parent “Songs Played” count in sync when this view is active (excludes jam placeholder, teases, etc.). */
  onSongCountChange?: (count: number) => void
  /** WL Home archive tour stats: chrome matches Slots / Songs list table styling. */
  wlHomeV2?: boolean
}

export function TourSongMatrix({
  shows,
  hideTitle = false,
  sortMode = "alphabetical",
  onSongClick,
  onSongCountChange,
  wlHomeV2 = false,
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
    const sorted = [...shows].sort(compareTourMatrixShows)
    return sorted.filter((s) => showsWithEntries.has(s.show_id))
  }, [shows, showsWithEntries, isFiltering])

  const { songMatrix, sortedSongs, isLoading, errorMessage } = useSongMatrix(
    filteredShows,
    sortMode,
  )

  useEffect(() => {
    if (
      !onSongCountChange ||
      isFiltering ||
      isLoading ||
      errorMessage
    ) {
      return
    }
    onSongCountChange(songMatrix.songs.length)
  }, [
    onSongCountChange,
    isFiltering,
    isLoading,
    errorMessage,
    songMatrix.songs.length,
  ])

  if (isFiltering || isLoading) {
    return wlHomeV2 ?
        <div className="flex h-36 items-center justify-center py-4 text-[11px] text-white/55">
          Loading song matrix…
        </div>
      : <div className="rounded-lg border border-[#232325] bg-card/80 p-4">
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Loading song matrix…
          </div>
        </div>
  }

  const headCell = wlHomeV2 ? "!px-2 !py-0.5" : "px-2 py-0.5"
  const headCellTight = wlHomeV2 ? "!px-1 !py-0.5" : "px-1 py-0.5"
  const headCellX = wlHomeV2 ? "!px-2" : "px-2"
  const headCellXTight = wlHomeV2 ? "!px-1" : "px-1"

  if (errorMessage) {
    return wlHomeV2 ?
        <div className="py-6 text-center text-[11px] text-red-400/95">
          {errorMessage}
        </div>
      : <div className="rounded-lg border border-[#232325] bg-card/80 p-4">
          <div className="py-6 text-center text-destructive">{errorMessage}</div>
        </div>
  }

  if (songMatrix.songs.length === 0) {
    return wlHomeV2 ?
        <div className="py-6 text-center text-[11px] text-white/55">
          No song data available for this tour
        </div>
      : <div className="rounded-lg border border-[#232325] bg-card/80 p-4">
          <div className="py-6 text-center text-muted-foreground">
            No song data available for this tour
          </div>
        </div>
  }

  const dateCount = songMatrix.showDates.length

  const songMatrixTable = (
    <Table
      className={
        wlHomeV2 ?
          cn(
            "wl-home-v2-years-table min-w-max border-separate border-spacing-0 border-b text-[11px] leading-3",
            WL_MATRIX_BORDER,
          )
        : "min-w-max"
      }
    >
      <TableHeader>
        <TableRow
          className={
            wlHomeV2 ?
              cn(
                "border-b bg-black/25 hover:bg-black/25",
                WL_MATRIX_BORDER,
              )
            : "bg-muted/60"
          }
        >
          <TableHead
            className={cn(
              "text-left font-medium",
              wlHomeV2 ? "text-[11px]" : "text-xs",
              headCell,
              wlHomeV2 ?
                cn(
                  "rounded-tl-[10px] border-l border-r border-t bg-black/25",
                  dateCount === 0 && "rounded-tr-[10px]",
                  WL_MATRIX_BORDER,
                )
              : null,
            )}
          >
            Song
          </TableHead>
          {songMatrix.showDates.map((d, i) => (
            <TableHead
              key={d.id}
              className={cn(
                "text-center font-medium whitespace-nowrap min-w-[3rem]",
                wlHomeV2 ? "text-[11px]" : "text-xs",
                headCellTight,
                wlHomeV2 ?
                  cn(
                    "border-r border-t bg-black/25",
                    WL_MATRIX_BORDER,
                    i === dateCount - 1 && "rounded-tr-[10px]",
                  )
                : null,
              )}
            >
              <Link
                href={getSetlistArchiveUrl(d.id)}
                className={cn(
                  "hover:underline",
                  wlHomeV2 ?
                    "text-white/70 underline-offset-2 hover:text-white"
                  : "",
                )}
              >
                {d.displayDate}
              </Link>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedSongs.map((song, rowIndex) => {
          const performances = songMatrix.data[song] ?? []
          const isLastRow = rowIndex === sortedSongs.length - 1
          return (
            <TableRow
              key={song}
              className={
                wlHomeV2 ?
                  "bg-transparent hover:!bg-[rgba(88,200,174,0.11)]"
                : "border-[#232325] bg-background/70 hover:bg-muted/40"
              }
            >
              <TableCell
                className={cn(
                  "whitespace-nowrap py-0.5 font-medium",
                  headCellX,
                  wlHomeV2 ?
                    cn(
                      "border-l border-r text-[11px] text-white/88",
                      !isLastRow && "border-b",
                      WL_MATRIX_BORDER,
                    )
                  : "text-xs text-foreground",
                )}
              >
                <button
                  type="button"
                  onClick={() =>
                    onSongClick?.(
                      song,
                      songMatrix.songDisplayNameMap?.[song],
                    )
                  }
                  className={cn(
                    "cursor-pointer hover:underline",
                    wlHomeV2 ?
                      "text-white/88"
                    : "",
                  )}
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
                  perf?.placement?.startsWith("Main Set") ?
                    "#333333"
                  : base
                return (
                  <TableCell
                    key={`${song}-${show.show_id}`}
                    className={cn(
                      "py-0.5 text-center",
                      headCellXTight,
                      wlHomeV2 ?
                        cn(
                          "border-r",
                          !isLastRow && "border-b",
                          WL_MATRIX_BORDER,
                        )
                      : "border-x border-[#232325]",
                    )}
                    style={{
                      backgroundColor: bg ?? undefined,
                      minWidth: "3rem",
                    }}
                  >
                    {perf ?
                      <span className="inline-block py-0.5 text-xs font-medium text-white">
                        {perf.venueAppearanceCount}
                      </span>
                    : null}
                  </TableCell>
                )
              })}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )

  return (
    <div
      className={cn(!hideTitle && !wlHomeV2 ?
        "rounded-lg border border-[#232325] bg-card/80 p-3"
      : "")}
    >
      {!hideTitle && (
        <h2 className="text-lg font-semibold mb-4">
          {songMatrix.songs.length} Songs Played
        </h2>
      )}
      <div className="overflow-x-auto overflow-y-auto">{songMatrixTable}</div>
    </div>
  )
}
