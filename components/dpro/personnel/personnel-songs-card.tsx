"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SongCount } from "@/hooks/use-guest-data"

interface PersonnelSongsCardProps {
  songs: SongCount[]
  selectedSong: string | null
  onSongClick: (song: string) => void
}

export function PersonnelSongsCard({
  songs,
  selectedSong,
  onSongClick,
}: PersonnelSongsCardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"song" | "count">("count")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const filteredSongs = useMemo(
    () =>
      songs.filter((s) =>
        s.song.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [songs, searchTerm],
  )

  const sortedSongs = useMemo(() => {
    return [...filteredSongs].sort((a, b) => {
      if (sortBy === "song") {
        return sortDirection === "asc"
          ? a.song.localeCompare(b.song)
          : b.song.localeCompare(a.song)
      }
      if (a.play_count !== b.play_count) {
        return sortDirection === "asc"
          ? a.play_count - b.play_count
          : b.play_count - a.play_count
      }
      if ((a.category_canonid ?? 0) !== (b.category_canonid ?? 0)) {
        return (a.category_canonid ?? 0) - (b.category_canonid ?? 0)
      }
      return a.song.localeCompare(b.song)
    })
  }, [filteredSongs, sortBy, sortDirection])

  return (
    <Card className="border-border/60 bg-card/80 overflow-hidden py-0 max-h-[400px] flex flex-col">
      <CardHeader className="bg-muted/60 py-2 shrink-0">
        <CardTitle className="text-sm font-semibold">Songs Played</CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3 flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {songs.length} Unique Songs
          </span>
        </div>
        <input
          type="text"
          placeholder="Search songs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {sortedSongs.length > 0 ? (
          <div className="space-y-0.5">
            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-muted-foreground">
              <button
                type="button"
                onClick={() => {
                  setSortBy("song")
                  setSortDirection(sortBy === "song" && sortDirection === "asc" ? "desc" : "asc")
                }}
                className="text-left hover:text-foreground"
              >
                Song
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortBy("count")
                  setSortDirection(sortBy === "count" && sortDirection === "desc" ? "asc" : "desc")
                }}
                className="text-right hover:text-foreground"
              >
                Count
              </button>
            </div>
            <div className="space-y-0.5">
              {sortedSongs.map((song) => (
                <button
                  key={song.song}
                  type="button"
                  onClick={() => onSongClick(song.song)}
                  className={`w-full flex justify-between px-2 py-1 text-xs rounded transition-colors text-left ${
                    selectedSong === song.song
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/60"
                  }`}
                >
                  <span className="truncate font-medium">{song.song}</span>
                  <span className="shrink-0 tabular-nums pl-2">{song.play_count}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {searchTerm ? "No songs match your search." : "No songs found."}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
