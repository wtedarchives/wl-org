"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import type { SongCount } from "@/hooks/use-guest-data"

interface PersonnelSongsCardProps {
  songs: SongCount[]
  selectedSong: string | null
  onSongClick: (song: string) => void
  /** Use song detail `.info-strip` / `.card` chrome (WL Home personnel). */
  stripLayout?: boolean
}

export function PersonnelSongsCard({
  songs,
  selectedSong,
  onSongClick,
  stripLayout = false,
}: PersonnelSongsCardProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredSongs = useMemo(
    () =>
      songs.filter((s) =>
        s.song.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [songs, searchTerm],
  )

  const sortedSongs = useMemo(() => {
    return [...filteredSongs].sort((a, b) => {
      if (a.play_count !== b.play_count) {
        return b.play_count - a.play_count
      }
      if ((a.category_canonid ?? 0) !== (b.category_canonid ?? 0)) {
        return (a.category_canonid ?? 0) - (b.category_canonid ?? 0)
      }
      const aName = a.song_displayname ?? a.song
      const bName = b.song_displayname ?? b.song
      return aName.localeCompare(bName)
    })
  }, [filteredSongs])

  const body = (
    <>
      {!stripLayout ?
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {songs.length} Unique Songs
          </span>
        </div>
      : null}
      {stripLayout ?
        <input
          type="text"
          placeholder="Search songs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="personnel-archive-strip-songs-input"
        />
      : <input
          type="text"
          placeholder="Search songs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        />
      }
      {sortedSongs.length > 0 ?
        <ul className="group-count-list space-y-px">
          {sortedSongs.map((song) => (
            <li key={song.song}>
              <button
                type="button"
                onClick={() => onSongClick(song.song)}
                className={
                  stripLayout ?
                    `group-count-btn${selectedSong === song.song ? " active" : ""}`
                  : `w-full flex justify-between px-2 py-1 text-xs rounded transition-colors text-left ${
                      selectedSong === song.song
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted/60"
                    }`
                }
              >
                {stripLayout ?
                  <>
                    <span className="gn-name min-w-0">
                      <SongDisplayName
                        song={song.song}
                        songDisplayName={song.song_displayname ?? song.song}
                        className="truncate font-medium"
                      />
                    </span>
                    <span className="gn-count shrink-0">{song.play_count}</span>
                  </>
                : <>
                    <SongDisplayName
                      song={song.song}
                      songDisplayName={song.song_displayname ?? song.song}
                      className="truncate font-medium"
                    />
                    <span className="shrink-0 tabular-nums pl-2">
                      {song.play_count}
                    </span>
                  </>
                }
              </button>
            </li>
          ))}
        </ul>
      :
        <p
          className={
            stripLayout ? "text-xs text-white/55" : "text-xs text-muted-foreground"
          }
        >
          {searchTerm ? "No songs match your search." : "No songs found."}
        </p>
      }
    </>
  )

  if (stripLayout) {
    return (
      <div className="card min-h-0 max-h-[min(420px,50vh)] flex flex-col overflow-hidden">
        <div className="card-head">
          <h3>Songs Played</h3>
        </div>
        <div className="card-body flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto !pt-3">
          {body}
        </div>
      </div>
    )
  }

  return (
    <Card className="border-border/60 bg-card/80 overflow-hidden py-0 max-h-[400px] flex flex-col">
      <CardHeader className="bg-muted/60 py-2 shrink-0">
        <CardTitle className="text-sm font-semibold">Songs Played</CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3 flex-1 min-h-0 overflow-y-auto">
        {body}
      </CardContent>
    </Card>
  )
}
