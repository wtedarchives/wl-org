"use client"

import { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import { ArrowUp, ArrowDown } from "lucide-react"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCategoryArtwork } from "@/hooks/use-category-artwork"
import { INDEX_SKIP_SONG_IMPROV_JAM } from "@/components/dpro/setlist/display-setlist-table.constants"
import { cn } from "@/lib/utils"

interface Show {
  show_id: string
  setlist_entries?: Array<{
    entry_song: string
    entry_length?: string | null
    entry_short?: string | null
    songs?: {
      song_id?: string
      song_displayname?: string | null
      song_category?: string
      categories?: { category_canonid?: number }
    }
  }>
}

interface SongStats {
  song: string
  song_displayname?: string | null
  song_id: string
  count: number
  category: string
  categoryCanonId: number
  longest: string | null
  shortest: string | null
}

interface TourSongStatsProps {
  shows: Show[]
  songIdMap?: Record<string, string>
  onSongCountChange?: (count: number) => void
  uniqueSongCount?: number
  hideTitle?: boolean
  tourId?: string
  onSongClick?: (songName: string, songDisplayName?: string | null) => void
  wlHomeV2?: boolean
}

const SKIP_SHORTS = ["fake", "tease", "reprise", "aborted"]
const EXCLUDED_DURATION = ["aborted", "fake", "tease", "reprise"]

function CategoryCell({
  category,
  wlHomeV2 = false,
}: {
  category: string
  wlHomeV2?: boolean
}) {
  const { artwork, loaded } = useCategoryArtwork(category)
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-sm py-0.5",
          wlHomeV2 ?
            "border border-[rgb(63,65,64)] bg-black/20"
          : "bg-muted",
        )}
      >
        {loaded && artwork ?
          <Image
            src={artwork}
            alt={category}
            width={20}
            height={20}
            className="size-5 object-cover"
            unoptimized
            onError={(e) => {
              const el = e.target as HTMLImageElement
              if (el) el.style.display = "none"
            }}
          />
        : <span
            className={cn(
              "truncate px-0.5 text-[10px]",
              wlHomeV2 ?
                "text-white/46"
              : "text-muted-foreground",
            )}
          >
            {category.slice(0, 2)}
          </span>
        }
      </span>
      <span className={cn(wlHomeV2 ? "text-[11px] text-muted-foreground" : "text-xs text-muted-foreground")}>
        {category}
      </span>
    </div>
  )
}

function parseDuration(interval: string | undefined | null): number | null {
  if (!interval) return null
  const m = interval.match(/^(?:(\d+):)?(\d+):(\d+)$/)
  if (m) {
    const h = parseInt(m[1] || "0", 10)
    const min = parseInt(m[2], 10)
    const sec = parseInt(m[3], 10)
    return h * 3600 + min * 60 + sec
  }
  return null
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }
  return `${m}:${s.toString().padStart(2, "0")}`
}

function durationToSeconds(d: string | null): number {
  if (!d) return 0
  const parts = d.split(":").map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

export function TourSongStats({
  shows,
  songIdMap = {},
  onSongCountChange,
  uniqueSongCount,
  hideTitle = false,
  onSongClick,
  wlHomeV2 = false,
}: TourSongStatsProps) {
  const [sortColumn, setSortColumn] = useState<
    "song" | "count" | "category" | "longest" | "shortest" | null
  >(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const calculateSongStats = (): SongStats[] => {
    const songMap = new Map<
      string,
      {
        song_id: string
        song_displayname?: string | null
        count: number
        category: string
        categoryCanonId: number
        durations: number[]
      }
    >()

    for (const show of shows) {
      const validSongs = new Set<string>()
      show.setlist_entries?.forEach((e) => {
        if (e.entry_song === INDEX_SKIP_SONG_IMPROV_JAM) return
        if (
          !e.entry_short ||
          !SKIP_SHORTS.includes(e.entry_short.toLowerCase())
        ) {
          validSongs.add(e.entry_song)
        }
      })

      const uniqueInShow = new Set<string>()
      show.setlist_entries?.forEach((e) => {
        if (e.entry_song === INDEX_SKIP_SONG_IMPROV_JAM) return
        if (!validSongs.has(e.entry_song)) return
        const curr = songMap.get(e.entry_song) ?? {
          song_id: songIdMap[e.entry_song] ?? "",
          song_displayname: null,
          count: 0,
          category: "",
          categoryCanonId: 0,
          durations: [],
        }
        const inc = !uniqueInShow.has(e.entry_song)
        if (inc) uniqueInShow.add(e.entry_song)

        const catId = e.songs?.categories?.category_canonid ?? 0
        const songId = e.songs?.song_id ?? songIdMap[e.entry_song] ?? curr.song_id

        const newDurations = [...curr.durations]
        if (
          !EXCLUDED_DURATION.includes(
            (e.entry_short ?? "").toLowerCase(),
          )
        ) {
          const sec = parseDuration(e.entry_length)
          if (sec !== null) newDurations.push(sec)
        }

        songMap.set(e.entry_song, {
          song_id: songId,
          song_displayname: e.songs?.song_displayname ?? curr.song_displayname,
          count: inc ? curr.count + 1 : curr.count,
          category: e.songs?.song_category ?? curr.category,
          categoryCanonId: catId,
          durations: newDurations,
        })
      })
    }

    return Array.from(songMap.entries()).map(([song, s]) => {
      let longest: string | null = null
      let shortest: string | null = null
      if (s.durations.length > 0) {
        longest = formatDuration(Math.max(...s.durations))
        shortest = formatDuration(Math.min(...s.durations))
      }
      return {
        song,
        song_displayname: s.song_displayname,
        song_id: s.song_id,
        count: s.count,
        category: s.category,
        categoryCanonId: s.categoryCanonId,
        longest,
        shortest,
      }
    })
  }

  const sortedStats = useMemo(() => {
    const stats = calculateSongStats()
    if (!sortColumn) {
      return stats.sort((a, b) => {
        if (a.count !== b.count) return b.count - a.count
        if (a.categoryCanonId !== b.categoryCanonId)
          return a.categoryCanonId - b.categoryCanonId
        return a.song.localeCompare(b.song)
      })
    }
    return stats.sort((a, b) => {
      let cmp = 0
      if (sortColumn === "song") {
        cmp = a.song.localeCompare(b.song)
      } else if (sortColumn === "category") {
        cmp = a.categoryCanonId - b.categoryCanonId
      } else if (sortColumn === "longest") {
        cmp = durationToSeconds(b.longest) - durationToSeconds(a.longest)
      } else if (sortColumn === "shortest") {
        cmp = durationToSeconds(b.shortest) - durationToSeconds(a.shortest)
      } else {
        cmp = b.count - a.count
      }
      return sortDirection === "asc" ? -cmp : cmp
    })
  }, [shows, songIdMap, sortColumn, sortDirection])

  useEffect(() => {
    if (onSongCountChange) {
      const stats = calculateSongStats()
      onSongCountChange(stats.length)
    }
  }, [shows, songIdMap, onSongCountChange])

  const headCell = wlHomeV2 ? "!px-2 !py-0.5" : "px-2 py-0.5"
  const headCellX = wlHomeV2 ? "!px-2" : "px-2"

  const handleSort = (
    col: "song" | "count" | "category" | "longest" | "shortest",
  ) => {
    if (sortColumn === col) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortColumn(col)
      setSortDirection("desc")
    }
  }

  const SortIcon = ({
    col,
  }: {
    col: "song" | "count" | "category" | "longest" | "shortest"
  }) => {
    if (sortColumn !== col) return null
    const Icon = sortDirection === "asc" ? ArrowUp : ArrowDown
    return (
      <Icon className={cn("ml-1 inline-block", wlHomeV2 ? "size-3.5 text-white/55" : "size-4")} />
    )
  }

  return (
    <div>
      {!hideTitle && (
        <div className="border-b border-border/60 bg-muted/60 px-3 py-0.5">
          <h2 className="text-sm font-semibold">
            {uniqueSongCount ?? sortedStats.length} Songs Played
          </h2>
        </div>
      )}
      <div className="overflow-x-auto">
        <Table
          className={
            wlHomeV2 ?
              cn("wl-home-v2-years-table text-[11px] leading-3")
            : ""
          }
        >
          <TableHeader>
            <TableRow
              className={cn(
                wlHomeV2 ?
                  "border-b bg-black/25 hover:bg-black/25"
                : "bg-muted/60",
              )}
            >
              <TableHead
                className={cn(
                  "cursor-pointer text-center font-medium",
                  wlHomeV2 ? "text-[11px]" : "text-xs hover:bg-muted/70",
                  headCell,
                )}
                onClick={() => handleSort("count")}
              >
                <span className="flex items-center justify-center gap-1">
                  # <SortIcon col="count" />
                </span>
              </TableHead>
              <TableHead
                className={cn(
                  "cursor-pointer text-left font-medium",
                  wlHomeV2 ? "text-[11px]" : "text-xs hover:bg-muted/70",
                  headCell,
                )}
                onClick={() => handleSort("song")}
              >
                <span className="flex items-center gap-1">
                  Song <SortIcon col="song" />
                </span>
              </TableHead>
              <TableHead
                className={cn(
                  "cursor-pointer text-center font-medium",
                  wlHomeV2 ? "text-[11px]" : "text-xs hover:bg-muted/70",
                  headCell,
                )}
                onClick={() => handleSort("longest")}
              >
                <span className="flex items-center justify-center gap-1">
                  Longest <SortIcon col="longest" />
                </span>
              </TableHead>
              <TableHead
                className={cn(
                  "cursor-pointer text-center font-medium",
                  wlHomeV2 ? "text-[11px]" : "text-xs hover:bg-muted/70",
                  headCell,
                )}
                onClick={() => handleSort("shortest")}
              >
                <span className="flex items-center justify-center gap-1">
                  Shortest <SortIcon col="shortest" />
                </span>
              </TableHead>
              <TableHead
                className={cn(
                  "cursor-pointer text-left font-medium",
                  wlHomeV2 ? "text-[11px]" : "text-xs hover:bg-muted/70",
                  headCell,
                )}
                onClick={() => handleSort("category")}
              >
                <span className="flex items-center gap-1">
                  Category <SortIcon col="category" />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStats.map((stat) => (
              <TableRow
                key={stat.song}
                className={cn(
                  "transition-colors",
                  wlHomeV2 ?
                    "border-[rgb(34,37,35)] bg-transparent hover:!bg-[rgba(88,200,174,0.11)] [&:last-child]:border-b-0"
                  : "bg-background/70 hover:bg-muted/40",
                )}
              >
                <TableCell
                  className={cn(
                    "py-0.5 text-center tabular-nums",
                    headCellX,
                    wlHomeV2 ?
                      "font-medium text-[11px] text-white/88"
                    : "text-xs",
                  )}
                >
                  {stat.count}
                </TableCell>
                <TableCell
                  className={cn("cursor-pointer py-0.5", headCellX)}
                  onClick={() => onSongClick?.(stat.song, stat.song_displayname)}
                >
                  <span
                    className={cn(
                      "font-medium hover:underline",
                      wlHomeV2 ?
                        "text-[11px] text-white/88"
                      : "text-xs text-foreground",
                    )}
                  >
                    <SongDisplayName
                      song={stat.song}
                      songDisplayName={stat.song_displayname}
                    />
                  </span>
                </TableCell>
                <TableCell
                  className={cn(
                    "py-0.5 text-center tabular-nums text-muted-foreground",
                    headCellX,
                    wlHomeV2 ? "text-[11px]" : "text-xs",
                  )}
                >
                  {stat.longest ?? ""}
                </TableCell>
                <TableCell
                  className={cn(
                    "py-0.5 text-center tabular-nums text-muted-foreground",
                    headCellX,
                    wlHomeV2 ? "text-[11px]" : "text-xs",
                  )}
                >
                  {stat.shortest ?? ""}
                </TableCell>
                <TableCell
                  className={cn("py-0.5 text-muted-foreground", headCellX)}
                >
                  <CategoryCell category={stat.category} wlHomeV2={wlHomeV2} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
