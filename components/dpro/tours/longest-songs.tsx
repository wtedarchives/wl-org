"use client"


import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { formatVenueLocationWithBrackets } from "@/lib/format-venue-location-brackets"
import { INDEX_SKIP_SONG_IMPROV_JAM } from "@/components/dpro/setlist/display-setlist-table.constants"
import { formatEntryLength } from "@/lib/setlist-utils"
import { cn } from "@/lib/utils"

import { toursStatsDurationTdClassnames } from "./tours-stats-table-classes"

interface LongestSongsProps {
  showIds: string[]
  songIdMap?: Record<string, string>
  tourId?: string
  onSongClick?: (songName: string, songDisplayName?: string | null) => void
  /** WL Home archive tour stats: chrome matches slots (`widget-panel` + `wp-head`). */
  wlHomeV2?: boolean
}

interface LongestSong {
  entry_song: string
  song_displayname?: string | null
  entry_length: string
  song_id?: string
  show_date?: string
  show_id?: string
  venue_location?: string
  category_artwork?: string
}

function formatTourDate(dateStr?: string): string {
  if (!dateStr) return ""
  const parts = dateStr.split("-")
  if (parts.length >= 3) {
    return `${parts[1]}.${parts[2]}.${parts[0].slice(2)}`
  }
  return dateStr
}

export function LongestSongs({
  showIds,
  onSongClick,
  wlHomeV2 = false,
}: LongestSongsProps) {
  const [longestSongs, setLongestSongs] = useState<LongestSong[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!showIds?.length) {
      setLoading(false)
      return
    }

    async function fetchLongestSongs() {
      try {
        const { supabase } = await import("@/lib/supabase")
        if (!supabase) {
          setLoading(false)
          return
        }
        const { data, error } = await supabase
          .from("setlist_entries")
          .select(
            `
            entry_song,
            entry_length,
            entry_show,
            songs!inner(
              song_displayname,
              song_category,
              categories!inner(
                category_artwork
              )
            ),
            shows (
              show_date,
              show_venue_location
            )
          `,
          )
          .in("entry_show", showIds)
          .neq("entry_song", INDEX_SKIP_SONG_IMPROV_JAM)
          .not("entry_length", "is", null)
          .order("entry_length", { ascending: false })
          .limit(8)

        if (error) throw error

        const formatted: LongestSong[] = (data ?? []).map((entry: any) => {
          const showsRel = entry.shows
          const show = Array.isArray(showsRel) ? showsRel[0] : showsRel
          const songsRel = entry.songs
          const song = Array.isArray(songsRel) ? songsRel[0] : songsRel
          const cats = song?.categories
          const cat = Array.isArray(cats) ? cats[0] : cats
          return {
            entry_song: entry.entry_song,
            song_displayname: song?.song_displayname ?? null,
            entry_length: entry.entry_length,
            show_date: show?.show_date,
            show_id: entry.entry_show,
            venue_location: show?.show_venue_location,
            category_artwork: cat?.category_artwork,
          }
        })
        setLongestSongs(formatted)
      } catch (err) {
        console.error("Error fetching longest songs:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchLongestSongs()
  }, [showIds])

  const mutedRow = wlHomeV2 ? "text-white/88" : "text-foreground"

  const tableBlock =
    longestSongs.length === 0 ? null : (
      <div className="min-w-0 overflow-x-auto">
        <table
          className={cn(
            "w-full border-collapse min-w-max text-[11px] leading-3",
            wlHomeV2 && "wl-home-v2-tours-stats-table",
          )}
        >
          <tbody>
            {longestSongs.map((song, i) => (
              <tr
                key={`${song.entry_song}-${i}`}
                className={cn(
                  "transition-colors",
                  wlHomeV2 ?
                    "border-b border-[rgb(34,37,35)] bg-transparent hover:bg-[rgba(88,200,174,0.11)] [&:last-child]:border-b-0"
                  : "bg-background/70 hover:bg-muted/40",
                )}
              >
                <td
                  className={cn(
                    wlHomeV2 ?
                      "wl-home-v2-tours-stats-cell wl-home-v2-tours-stats-cell--song"
                    : "py-0.5 pr-1.5 pl-3",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onSongClick?.(song.entry_song, song.song_displayname)}
                      className={cn(
                        "font-medium hover:underline cursor-pointer text-left",
                        wlHomeV2 ?
                          "text-white/88"
                        : "text-foreground",
                      )}
                    >
                      <SongDisplayName
                        song={song.entry_song}
                        songDisplayName={song.song_displayname}
                      />
                    </button>
                    {song.category_artwork && (
                      <img
                        src={song.category_artwork}
                        alt=""
                        className={cn(
                          "size-5 shrink-0 rounded object-cover",
                          wlHomeV2 ?
                            "border border-[rgb(63,65,64)]"
                          : "border border-border",
                        )}
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display =
                            "none"
                        }}
                      />
                    )}
                  </div>
                </td>
                <td
                  className={toursStatsDurationTdClassnames(
                    wlHomeV2,
                    mutedRow,
                  )}
                >
                  {formatEntryLength(song.entry_length)}
                </td>
                <td
                  className={cn(
                    "text-muted-foreground",
                    wlHomeV2 ?
                      "wl-home-v2-tours-stats-cell wl-home-v2-tours-stats-cell--meta"
                    : "py-1.5 pl-2",
                  )}
                >
                  {song.show_date && (
                    <>
                      {song.show_id ?
                        <Link
                          href={getSetlistArchiveUrl(song.show_id)}
                          className="font-medium hover:underline text-white/80"
                        >
                          {formatTourDate(song.show_date)}
                        </Link>
                      : <span className={wlHomeV2 ? "text-white/88" : ""}>
                          {formatTourDate(song.show_date)}
                        </span>
                      }
                      {song.venue_location && (
                        <span
                          className={cn(
                            wlHomeV2 ?
                              "text-white/46"
                            : "text-muted-foreground/70",
                          )}
                        >
                          {" "}
                          {formatVenueLocationWithBrackets(song.venue_location)}
                        </span>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )

  if (wlHomeV2) {
    return (
      <div className="widget-panel w-full min-w-0 shrink-0">
        <div className="wp-head wl-home-v2-years-shows-wp-head">
          <span>Longest Songs</span>
        </div>
        {loading ?
          <div className="py-2 text-center text-xs text-white/55">Loading…</div>
        : longestSongs.length === 0 ?
          <div className="py-2 text-center text-xs text-white/55">
            Song times for this tour are unknown.
          </div>
        : tableBlock}
      </div>
    )
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
      <div className="px-3 py-1.5 flex justify-between items-center bg-muted/60">
        <h2 className="text-sm font-semibold">Longest Songs</h2>
      </div>
      <CardContent className="p-0">
        {loading ?
          <div className="py-2 text-center text-muted-foreground text-xs">
            Loading…
          </div>
        : longestSongs.length === 0 ?
          <div className="py-2 text-center text-muted-foreground text-xs">
            Song times for this tour are unknown.
          </div>
        : tableBlock}
      </CardContent>
    </Card>
  )
}
