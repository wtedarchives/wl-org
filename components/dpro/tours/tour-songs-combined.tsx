"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { List, LayoutGrid, ArrowDownUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { TourSongStats } from "./tour-song-stats"
import { TourSongMatrix, type MatrixSortMode } from "./tour-song-matrix"
import { cn } from "@/lib/utils"

interface Show {
  show_id: string
  show_date: string
  show_canonid?: number | null
  setlist_entries?: Array<{
    entry_song: string
    entry_length?: string | null
    entry_short?: string | null
    songs?: {
      song_id?: string
      song_category?: string
      categories?: { category_canonid?: number }
    }
  }>
}

interface TourSongsCombinedProps {
  shows: Show[]
  songIdMap?: Record<string, string>
  uniqueSongCount?: number
  onSongCountChange?: (count: number) => void
  tourId?: string
  onSongClick?: (songName: string, songDisplayName?: string | null) => void
  /** WL Home archive: `widget-panel` + `wp-head` chrome to match Slots / longest tables. */
  wlHomeV2?: boolean
}

function getViewFromParams(params: URLSearchParams): "list" | "matrix" {
  const v = params.get("songsView")
  return v === "list" || v === "matrix" ? v : "list"
}

function getSortFromParams(params: URLSearchParams): MatrixSortMode {
  const s = params.get("songsSort")
  if (
    s === "alphabetical" ||
    s === "chronological" ||
    s === "playcount"
  ) {
    return s
  }
  return "alphabetical"
}

export function TourSongsCombined({
  shows,
  songIdMap = {},
  uniqueSongCount = 0,
  onSongCountChange,
  tourId,
  onSongClick,
  wlHomeV2 = false,
}: TourSongsCombinedProps) {
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<"list" | "matrix">(() =>
    getViewFromParams(searchParams),
  )
  const [matrixSortMode, setMatrixSortMode] = useState<MatrixSortMode>(() =>
    getSortFromParams(searchParams),
  )

  useEffect(() => {
    const urlView = getViewFromParams(searchParams)
    const urlSort = getSortFromParams(searchParams)
    if (urlView !== viewMode) setViewMode(urlView)
    if (urlSort !== matrixSortMode) setMatrixSortMode(urlSort)
  }, [searchParams])

  const updateUrl = (updates: { view?: "list" | "matrix"; sort?: MatrixSortMode }) => {
    const params = new URLSearchParams(searchParams.toString())
    if (updates.view !== undefined) {
      if (updates.view === "list") {
        params.delete("songsView")
        params.delete("songsSort")
      } else {
        params.set("songsView", "matrix")
        if (updates.sort !== undefined && !params.has("songsSort")) {
          params.set("songsSort", updates.sort)
        }
      }
    }
    if (updates.sort !== undefined) {
      if (updates.sort === "alphabetical") {
        params.delete("songsSort")
      } else {
        params.set("songsSort", updates.sort)
      }
    }
    const q = params.toString()
    const url = q ? `?${q}` : window.location.pathname
    window.history.replaceState(null, "", url)
  }

  const handleViewChange = (mode: "list" | "matrix") => {
    setViewMode(mode)
    updateUrl({ view: mode, sort: mode === "matrix" ? matrixSortMode : undefined })
  }

  const handleSortChange = (sort: MatrixSortMode) => {
    setMatrixSortMode(sort)
    updateUrl({ sort })
  }

  const count = uniqueSongCount || 0

  const wlBtn = wlHomeV2
  const toolbar = (
    <div className="flex flex-wrap items-center gap-3">
      {viewMode === "matrix" && (
        <>
          <div
            className={cn(
              "wl-home-v2-tour-songs-sort hidden items-center rounded-md py-0.5 px-1 md:flex md:gap-1.5",
              wlBtn ?
                "border border-black/25 bg-black/25"
              : "gap-1 border border-border bg-background",
            )}
          >
            <span
              className={cn(
                "wl-home-v2-tour-songs-sort-label shrink-0 font-medium",
                !wlBtn && "pl-[6px]",
                wlBtn ? "text-[0.625rem] text-white/46" : "text-[0.625rem] text-muted-foreground",
              )}
            >
              Sort:
            </span>
            <Button
              variant={
                wlBtn ?
                  "ghost"
                : matrixSortMode === "alphabetical" ?
                  "secondary"
                : "ghost"
              }
              size="sm"
              className={cn(
                "h-6 px-[6px] text-xs",
                wlBtn &&
                  matrixSortMode === "alphabetical" &&
                  "border border-black/35 bg-white/15 text-white",
                wlBtn && matrixSortMode !== "alphabetical" &&
                  "text-white/80 hover:bg-white/10",
              )}
              onClick={() => handleSortChange("alphabetical")}
            >
              A-Z
            </Button>
            <Button
              variant={
                wlBtn ?
                  "ghost"
                : matrixSortMode === "chronological" ?
                  "secondary"
                : "ghost"
              }
              size="sm"
              className={cn(
                "h-6 px-[6px] text-xs",
                wlBtn &&
                  matrixSortMode === "chronological" &&
                  "border border-black/35 bg-white/15 text-white",
                wlBtn &&
                  matrixSortMode !== "chronological" &&
                  "text-white/80 hover:bg-white/10",
              )}
              onClick={() => handleSortChange("chronological")}
            >
              Tour Order
            </Button>
            <Button
              variant={
                wlBtn ?
                  "ghost"
                : matrixSortMode === "playcount" ?
                  "secondary"
                : "ghost"
              }
              size="sm"
              className={cn(
                "h-6 px-[6px] text-xs",
                wlBtn &&
                  matrixSortMode === "playcount" &&
                  "border border-black/35 bg-white/15 text-white",
                wlBtn &&
                  matrixSortMode !== "playcount" &&
                  "text-white/80 hover:bg-white/10",
              )}
              onClick={() => handleSortChange("playcount")}
            >
              Most Played
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-7 w-7",
                  wlBtn && "border-black/35 bg-transparent text-white hover:bg-white/10",
                )}
              >
                <ArrowDownUp className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSortChange("alphabetical")}>
                A-Z
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("chronological")}>
                Tour Order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("playcount")}>
                Most Played
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
      <div className="flex items-center gap-2">
        <List
          className={cn(
            "size-4",
            viewMode === "list" ?
              wlBtn ?
                "text-white/88"
              : "text-foreground"
            : wlBtn ?
              "text-white/40"
            : "text-muted-foreground",
          )}
        />
        <button
          type="button"
          role="switch"
          aria-checked={viewMode === "matrix"}
          onClick={() =>
            handleViewChange(viewMode === "list" ? "matrix" : "list")
          }
          className={cn(
            "relative inline-flex h-4 w-[47px] items-center rounded-full border transition-colors",
            wlBtn ?
              "border-black/35 bg-black/35"
            : "border-border bg-background",
          )}
        >
          <span
            className={`absolute h-[10px] w-[10px] rounded-lg transition-transform duration-200 ${
              wlBtn ? "bg-white/90" : "bg-foreground"
            } ${
              viewMode === "matrix" ? "left-[33px]" : "left-[2px]"
            }`}
          />
        </button>
        <LayoutGrid
          className={cn(
            "size-4",
            viewMode === "matrix" ?
              wlBtn ?
                "text-white/88"
              : "text-foreground"
            : wlBtn ?
              "text-white/40"
            : "text-muted-foreground",
          )}
        />
      </div>
    </div>
  )

  const body =
    viewMode === "list" ?
      <TourSongStats
        shows={shows}
        songIdMap={songIdMap}
        onSongCountChange={onSongCountChange}
        uniqueSongCount={count}
        hideTitle
        tourId={tourId}
        onSongClick={onSongClick}
        wlHomeV2={wlHomeV2}
      />
    : <TourSongMatrix
        shows={shows}
        hideTitle
        sortMode={matrixSortMode}
        tourId={tourId}
        onSongClick={onSongClick}
        onSongCountChange={onSongCountChange}
        wlHomeV2={wlHomeV2}
      />

  if (wlHomeV2) {
    return (
      <div className="widget-panel w-full min-w-0 overflow-hidden">
        <div className="wp-head wl-home-v2-years-shows-wp-head flex flex-wrap items-center justify-between gap-2">
          <span className="min-w-0 truncate">
            {count} Songs Played
          </span>
          <div className="wp-head-right">{toolbar}</div>
        </div>
        <div className="min-w-0">{body}</div>
      </div>
    )
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/60 px-3 py-1.5">
        <h2 className="text-sm font-semibold">{count} Songs Played</h2>
        {toolbar}
      </div>
      <CardContent className="p-0">{body}</CardContent>
    </Card>
  )
}
