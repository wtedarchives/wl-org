"use client"

import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatVenueLocationWithBrackets } from "@/lib/format-venue-location-brackets"
import { formatEntryLength } from "@/lib/setlist-utils"
import {
  getLastCountBadgeStyle,
  getLastCountPillStyle,
  INDEX_SKIP_SONG_IMPROV_JAM,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { cn } from "@/lib/utils"

import {
  extractShowCount,
  formatTourDate,
  LiberatedSongLibTooltip,
} from "@/components/dpro/tours/liberated-songs-helpers"
import { toursStatsDurationTdClassnames } from "./tours-stats-table-classes"

export { LiberatedSongLibTooltip } from "@/components/dpro/tours/liberated-songs-helpers"

interface LiberatedSong {
  entry_song: string
  song_displayname?: string | null
  last_count: string
  last_show_date: string | null
  last_show_id: string | null
  entry_length?: string
  show_date?: string
  show_id?: string
  venue_location?: string
  category_artwork?: string
}

interface LiberatedSongsProps {
  showIds: string[]
  songIdMap?: Record<string, string>
  tourId?: string
  onDataLoaded?: (hasData: boolean) => void
  onSongClick?: (songName: string, songDisplayName?: string | null) => void
  /** WL Home archive tour stats: chrome matches slots (`widget-panel` + `wp-head`). */
  wlHomeV2?: boolean
}

export function LiberatedSongs({
  showIds,
  onDataLoaded,
  onSongClick,
  wlHomeV2 = false,
}: LiberatedSongsProps) {
  const [liberatedSongs, setLiberatedSongs] = useState<LiberatedSong[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!showIds?.length) {
      setLoading(false)
      onDataLoaded?.(false)
      return
    }

    async function fetchLiberatedSongs() {
      try {
        const { supabase } = await import("@/lib/supabase")
        if (!supabase) {
          setLoading(false)
          onDataLoaded?.(false)
          return
        }

        const { data, error } = await supabase
          .from("setlist_entries")
          .select(
            `
            entry_song,
            last_count,
            last_show_date,
            last_show_id,
            entry_show,
            entry_length,
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

        if (error) throw error

        const extractNumber = (lastCount: string | null): number => {
          if (!lastCount) return 0
          if (lastCount.trim().toLowerCase() === "debut") return 0
          const m = lastCount.match(/^(\d+)/)
          return m ? parseInt(m[1], 10) : 0
        }

        const formatted: LiberatedSong[] = (data ?? [])
          .map((entry: any) => {
            const showsRel = entry.shows
            const show = Array.isArray(showsRel) ? showsRel[0] : showsRel
            const songsRel = entry.songs
            const song = Array.isArray(songsRel) ? songsRel[0] : songsRel
            const cats = song?.categories
            const cat = Array.isArray(cats) ? cats[0] : cats
            return {
              entry_song: entry.entry_song,
              song_displayname: song?.song_displayname ?? null,
              last_count: entry.last_count,
              last_show_date: entry.last_show_date,
              last_show_id: entry.last_show_id,
              entry_length: entry.entry_length,
              show_date: show?.show_date,
              show_id: entry.entry_show,
              venue_location: show?.show_venue_location,
              category_artwork: cat?.category_artwork,
            }
          })
          .map((e) => ({ ...e, _n: extractNumber(e.last_count) }))
          .sort((a, b) => b._n - a._n)
          .slice(0, 8)
          .map(({ _n, ...e }) => e)

        setLiberatedSongs(formatted)
        onDataLoaded?.(formatted.length > 0)
      } catch (err) {
        console.error("Error fetching liberated songs:", err)
        onDataLoaded?.(false)
      } finally {
        setLoading(false)
      }
    }

    fetchLiberatedSongs()
  }, [showIds, onDataLoaded])

  if (!loading && liberatedSongs.length === 0) return null

  const showDurationColumn = liberatedSongs.some(
    (s) => formatEntryLength(s.entry_length ?? null) !== "",
  )

  const mutedRow = wlHomeV2 ? "text-white/88" : "text-foreground"

  const liberatedTable = (
    <div className="min-w-0 overflow-x-auto">
      <table
        className={cn(
          "w-full border-collapse min-w-max text-[11px] leading-3",
          wlHomeV2 && "wl-home-v2-tours-stats-table",
        )}
      >
        <tbody>
          {liberatedSongs.map((song, i) => {
            const showLibBadge =
              !!song.last_count?.toUpperCase().includes("LIB")
            /* Chip label is always LIB; palette matches setlist Last-column LIB pill. */
            const wlLibPillStyles =
              wlHomeV2 && showLibBadge ?
                getLastCountPillStyle("LIB")
              : null
            const legacyLibBadgeStyles =
              !wlHomeV2 && showLibBadge ?
                getLastCountBadgeStyle("LIB")
              : null
            return (
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
                      "text-left font-medium",
                      wlHomeV2 ?
                        "cursor-pointer text-white/88 hover:underline"
                      : "cursor-pointer text-foreground hover:underline",
                    )}
                  >
                    <SongDisplayName
                      song={song.entry_song}
                      songDisplayName={song.song_displayname}
                    />
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    {wlHomeV2 &&
                    showLibBadge &&
                    wlLibPillStyles ?
                      <LiberatedSongLibTooltip>
                        <span
                          className="last-pill cursor-help"
                          style={{
                            backgroundColor: wlLibPillStyles.background,
                            color: wlLibPillStyles.color,
                            border: `1px solid ${wlLibPillStyles.borderColor}`,
                          }}
                        >
                          LIB
                        </span>
                      </LiberatedSongLibTooltip>
                    : null}
                    {!wlHomeV2 && showLibBadge && legacyLibBadgeStyles ?
                      <LiberatedSongLibTooltip>
                        <span
                          className={cn(
                            legacyLibBadgeStyles.className,
                            "cursor-help",
                          )}
                        >
                          LIB
                        </span>
                      </LiberatedSongLibTooltip>
                    : null}
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
                </div>
              </td>
              {showDurationColumn ?
                <td
                  className={toursStatsDurationTdClassnames(
                    wlHomeV2,
                    mutedRow,
                  )}
                >
                  {formatEntryLength(song.entry_length ?? null)}
                </td>
              : null}
              <td
                className={cn(
                  "text-muted-foreground",
                  wlHomeV2 ?
                    "wl-home-v2-tours-stats-cell wl-home-v2-tours-stats-cell--meta"
                  : "px-2 py-1.5",
                )}
              >
                {song.show_date && (
                  <>
                    <span className="text-muted-foreground">Returned </span>
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
              <td
                className={cn(
                  "whitespace-nowrap text-muted-foreground",
                  wlHomeV2 ?
                    "wl-home-v2-tours-stats-cell wl-home-v2-tours-stats-cell--trail"
                  : "px-2 py-1.5",
                )}
              >
                {song.last_show_date && (
                  <>
                    <span className="text-muted-foreground">LTP </span>
                    {song.last_show_id ?
                      <Link
                        href={getSetlistArchiveUrl(song.last_show_id)}
                        className="font-medium hover:underline text-white/80"
                      >
                        {formatTourDate(song.last_show_date)}
                      </Link>
                    : <span className={wlHomeV2 ? "text-white/88" : ""}>
                        {formatTourDate(song.last_show_date)}
                      </span>
                    }
                    {extractShowCount(song.last_count) && (
                      <span
                        className={cn(
                          wlHomeV2 ?
                            "text-white/46"
                          : "text-muted-foreground/70",
                        )}
                      >
                        {" "}
                        ({extractShowCount(song.last_count)} shows)
                      </span>
                    )}
                  </>
                )}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )

  if (wlHomeV2) {
    return (
      <>
        <div className="widget-panel w-full min-w-0 shrink-0">
          <div className="wp-head wl-home-v2-years-shows-wp-head">
            <span>Top Returning Songs</span>
          </div>
          {loading ?
            <div className="py-2 text-center text-xs text-white/55">Loading…</div>
          : liberatedTable}
        </div>
      </>
    )
  }

  return (
    <>
      <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
        <div className="flex items-center justify-between bg-muted/60 px-3 py-1.5">
          <h2 className="text-sm font-semibold">Top Returning Songs</h2>
        </div>
        <CardContent className="p-0">
          {loading ?
            <div className="py-2 text-center text-xs text-muted-foreground">
              Loading…
            </div>
          : liberatedTable}
        </CardContent>
      </Card>
    </>
  )
}
