"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { List, LayoutGrid, ArrowDownUp } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserSongsList } from "./user-songs-list"
import { UserSongMatrix } from "./user-song-matrix"
import type {
  UserMatrixSortMode,
  UserSongMatrixData,
  YearGroup,
} from "@/hooks/use-user-song-matrix"
import type {
  UserSong,
  UserSongCategory,
  UserSongStat,
} from "@/hooks/use-user-songs-data"

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

  const updateUrl = (updates: {
    view?: "list" | "matrix"
    sort?: UserMatrixSortMode
  }) => {
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
    updateUrl({
      view: mode,
      sort: mode === "matrix" ? matrixSortMode : undefined,
    })
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
  const matrixMode = viewMode === "matrix"

  return (
    <div
      className={
        matrixMode ?
          "wl-profile-songs-panel wl-profile-songs-panel--matrix"
        : "wl-profile-songs-panel"
      }
    >
      <div className="wl-profile-songs-panel__head">
        <h2 className="wl-profile-songs-panel__title">
          {uniqueSongCount} Songs Seen
        </h2>
        <div className="wl-profile-songs-panel__tools">
          {matrixMode ?
            <>
              <div className="wl-profile-songs-panel__sort-wrap">
                <span className="wl-profile-songs-panel__sort-label">Sort</span>
                <button
                  type="button"
                  className={
                    matrixSortMode === "alphabetical"
                      ? "wl-profile-songs-panel__sort-btn wl-profile-songs-panel__sort-btn--active"
                    : "wl-profile-songs-panel__sort-btn"
                  }
                  onClick={() => handleSortChange("alphabetical")}
                >
                  A-Z
                </button>
                <button
                  type="button"
                  className={
                    matrixSortMode === "chronological"
                      ? "wl-profile-songs-panel__sort-btn wl-profile-songs-panel__sort-btn--active"
                    : "wl-profile-songs-panel__sort-btn"
                  }
                  onClick={() => handleSortChange("chronological")}
                >
                  Chronological
                </button>
                <button
                  type="button"
                  className={
                    matrixSortMode === "playcount"
                      ? "wl-profile-songs-panel__sort-btn wl-profile-songs-panel__sort-btn--active"
                    : "wl-profile-songs-panel__sort-btn"
                  }
                  onClick={() => handleSortChange("playcount")}
                >
                  Most Played
                </button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="wl-profile-songs-panel__sort-menu-btn"
                    aria-label="Sort matrix"
                  >
                    <ArrowDownUp className="size-4" aria-hidden />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleSortChange("alphabetical")}
                  >
                    A-Z
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSortChange("chronological")}
                  >
                    Chronological
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSortChange("playcount")}
                  >
                    Most Played
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          : null}
          <div className="wl-profile-songs-panel__view">
            <List
              className={
                viewMode === "list" ?
                  "wl-profile-songs-panel__view-icon wl-profile-songs-panel__view-icon--on"
                : "wl-profile-songs-panel__view-icon"
              }
              aria-hidden
            />
            <button
              type="button"
              role="switch"
              aria-checked={matrixMode}
              aria-label={matrixMode ? "Show list view" : "Show matrix view"}
              data-mode={matrixMode ? "matrix" : "list"}
              className="wl-profile-songs-panel__view-switch"
              onClick={() =>
                handleViewChange(viewMode === "list" ? "matrix" : "list")
              }
            >
              <span className="wl-profile-songs-panel__view-switch-thumb" />
            </button>
            <LayoutGrid
              className={
                matrixMode ?
                  "wl-profile-songs-panel__view-icon wl-profile-songs-panel__view-icon--on"
                : "wl-profile-songs-panel__view-icon"
              }
              aria-hidden
            />
          </div>
        </div>
      </div>
      <div className="wl-profile-songs-panel__body">
        {viewMode === "list" ?
          <div className="wl-profile-songs-panel__body--list">
            <UserSongsList
              categories={categories}
              songs={songs}
              userSongStats={userSongStats}
              onSongClick={onSongClick}
            />
          </div>
        : <UserSongMatrix
            songMatrix={songMatrix}
            sortedSongs={sortedSongs}
            yearGroups={yearGroups}
            yearIdMap={yearIdMap}
            songIdMap={songIdMap}
            shows={shows}
            onSongClick={onSongClick}
          />
        }
      </div>
    </div>
  )
}
