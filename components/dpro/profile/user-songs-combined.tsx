"use client"

import { useState, useEffect, useMemo } from "react"
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
import { UserSongsList } from "./user-songs-list"
import { UserSongMatrix } from "./user-song-matrix"
import type {
  UserMatrixSortMode,
  UserSongMatrixData,
  YearGroup,
} from "@/hooks/use-user-song-matrix"
import type { UserSong, UserSongCategory, UserSongStat } from "@/hooks/use-user-songs-data"

function getViewFromParams(params: URLSearchParams): "list" | "matrix" {
  const v = params.get("songsView")
  return v === "list" || v === "matrix" ? v : "list"
}

function getSortFromParams(params: URLSearchParams): UserMatrixSortMode {
  const s = params.get("songsSort")
  if (
    s === "alphabetical" ||
    s === "chronological" ||
    s === "playcount"
  ) {
    return s
  }
  return "chronological"
}

export interface UserSongsCombinedProps {
  viewMode: "list" | "matrix"
  setViewMode: (mode: "list" | "matrix") => void
  matrixSortMode: UserMatrixSortMode
  setMatrixSortMode: (mode: UserMatrixSortMode) => void
  categories: UserSongCategory[]
  songs: UserSong[]
  userSongStats: UserSongStat[]
  songMatrix: UserSongMatrixData
  sortedSongs: string[]
  yearGroups: YearGroup[]
  yearIdMap: Record<string, string>
  shows: Array<{ show_id: string; show_date: string }>
  onSongClick?: (
    songName: string,
    songDisplayName?: string | null,
    songId?: string
  ) => void
}

export function UserSongsCombined({
  viewMode,
  setViewMode,
  matrixSortMode,
  setMatrixSortMode,
  categories,
  songs,
  userSongStats,
  songMatrix,
  sortedSongs,
  yearGroups,
  yearIdMap,
  shows,
  onSongClick,
}: UserSongsCombinedProps) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlView = getViewFromParams(searchParams)
    const urlSort = getSortFromParams(searchParams)
    if (urlView !== viewMode) setViewMode(urlView)
    if (urlSort !== matrixSortMode) setMatrixSortMode(urlSort)
  }, [searchParams])

  const updateUrl = (updates: { view?: "list" | "matrix"; sort?: UserMatrixSortMode }) => {
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
      if (updates.sort === "chronological") {
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

  const handleSortChange = (sort: UserMatrixSortMode) => {
    setMatrixSortMode(sort)
    updateUrl({ sort })
  }

  const songIdMap = useMemo(() => {
    const map: Record<string, string> = {}
    songs.forEach((s) => {
      map[s.song] = s.song_id
    })
    return map
  }, [songs])

  const uniqueSongCount = songMatrix.songs.length

  return (
    <Card
      className={`ring-0 bg-card/80 overflow-hidden py-0 ${
        viewMode === "matrix"
          ? "border border-[#232325]"
          : "border border-border/60"
      }`}
    >
      <div className="border-b border-border/60 bg-muted/60 px-3 py-1.5 flex justify-between items-center">
        <h2 className="text-sm font-semibold">{uniqueSongCount} Songs Played</h2>
        <div className="flex items-center gap-3">
          {viewMode === "matrix" && (
            <>
              <div className="hidden md:flex items-center bg-background rounded-md border border-border py-0.5 px-1 gap-1">
                <span className="text-muted-foreground text-[0.625rem] ml-1 font-medium">
                  Sort:
                </span>
                <Button
                  variant={matrixSortMode === "alphabetical" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => handleSortChange("alphabetical")}
                >
                  A-Z
                </Button>
                <Button
                  variant={matrixSortMode === "chronological" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => handleSortChange("chronological")}
                >
                  Chronological
                </Button>
                <Button
                  variant={matrixSortMode === "playcount" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => handleSortChange("playcount")}
                >
                  Most Played
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="md:hidden">
                  <Button variant="outline" size="icon" className="h-7 w-7">
                    <ArrowDownUp className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleSortChange("alphabetical")}>
                    A-Z
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortChange("chronological")}>
                    Chronological
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
              className={`size-4 ${
                viewMode === "list" ? "text-foreground" : "text-muted-foreground"
              }`}
            />
            <button
              type="button"
              role="switch"
              aria-checked={viewMode === "matrix"}
              onClick={() =>
                handleViewChange(viewMode === "list" ? "matrix" : "list")
              }
              className="relative inline-flex h-4 w-[47px] items-center rounded-full border border-border transition-colors bg-background"
            >
              <span
                className={`absolute h-[10px] w-[10px] rounded-lg bg-foreground transition-transform duration-200 ${
                  viewMode === "matrix" ? "left-[33px]" : "left-[2px]"
                }`}
              />
            </button>
            <LayoutGrid
              className={`size-4 ${
                viewMode === "matrix" ? "text-foreground" : "text-muted-foreground"
              }`}
            />
          </div>
        </div>
      </div>
      <CardContent className="p-0">
        {viewMode === "list" ? (
          <div className="p-4">
            <UserSongsList
              categories={categories}
              songs={songs}
              userSongStats={userSongStats}
              onSongClick={onSongClick}
            />
          </div>
        ) : (
          <UserSongMatrix
            songMatrix={songMatrix}
            sortedSongs={sortedSongs}
            yearGroups={yearGroups}
            yearIdMap={yearIdMap}
            songIdMap={songIdMap}
            shows={shows}
            onSongClick={onSongClick}
          />
        )}
      </CardContent>
    </Card>
  )
}
