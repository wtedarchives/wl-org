"use client"

import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { formatEntryLength } from "@/lib/setlist-utils"

interface LiberatedSong {
  entry_song: string
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
}

function formatTourDate(dateStr?: string): string {
  if (!dateStr) return ""
  const parts = dateStr.split("-")
  if (parts.length >= 3) {
    return `${parts[1]}.${parts[2]}.${parts[0].slice(2)}`
  }
  return dateStr
}

function extractShowCount(lastCount: string): string {
  if (!lastCount) return ""
  if (lastCount.trim().toLowerCase() === "debut") return ""
  const match = lastCount.match(/^(\d+)/)
  return match ? match[1] : ""
}

export function LiberatedSongs({
  showIds,
  onDataLoaded,
  onSongClick,
}: LiberatedSongsProps) {
  const [liberatedSongs, setLiberatedSongs] = useState<LiberatedSong[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredLibBadge, setHoveredLibBadge] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number
    y: number
  } | null>(null)
  const badgeRefs = useRef<Record<string, HTMLSpanElement | null>>({})

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

  useEffect(() => {
    if (!hoveredLibBadge || !tooltipPosition) return
    const update = () => {
      const badge = badgeRefs.current[hoveredLibBadge]
      if (badge) {
        const rect = badge.getBoundingClientRect()
        setTooltipPosition({ x: rect.right + 4, y: rect.top })
      }
    }
    window.addEventListener("scroll", update, true)
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update, true)
      window.removeEventListener("resize", update)
    }
  }, [hoveredLibBadge, tooltipPosition])

  if (!loading && liberatedSongs.length === 0) return null

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
      <div className="px-3 py-1.5 flex justify-between items-center bg-muted/60">
        <h2 className="text-sm font-semibold">Top Returning Songs</h2>
      </div>
      <CardContent className="p-0">
        {loading ? (
          <div className="py-2 text-center text-muted-foreground text-xs">
            Loading…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-max text-xs">
              <tbody>
                {liberatedSongs.map((song, i) => (
                  <tr
                    key={`${song.entry_song}-${i}`}
                    className="bg-background/70 hover:bg-muted/40 transition-colors"
                  >
                    <td className="pl-3 py-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onSongClick?.(song.entry_song)}
                          className="font-medium text-foreground hover:underline cursor-pointer"
                        >
                          {song.entry_song}
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          {song.last_count?.toUpperCase().includes("LIB") && (
                            <span
                              ref={(el) => {
                                badgeRefs.current[song.entry_song] = el
                              }}
                              className="inline-flex items-center justify-center font-medium rounded-full text-[10px] px-1.5 py-0.5 shadow-sm bg-yellow-600 text-white cursor-help"
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect()
                                setTooltipPosition({
                                  x: rect.right + 4,
                                  y: rect.top,
                                })
                                setHoveredLibBadge(song.entry_song)
                              }}
                              onMouseLeave={() => {
                                setHoveredLibBadge(null)
                                setTooltipPosition(null)
                              }}
                            >
                              LIB
                            </span>
                          )}
                          {song.category_artwork && (
                            <img
                              src={song.category_artwork}
                              alt=""
                              className="size-5 shrink-0 rounded object-cover border border-border"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).style.display =
                                  "none"
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="w-[50px] py-1.5 text-center font-medium tabular-nums text-foreground">
                      {formatEntryLength(song.entry_length ?? null)}
                    </td>
                    <td className="py-1.5 pl-2 text-muted-foreground text-xs">
                      {song.show_date && (
                        <>
                          <span className="text-muted-foreground">Returned </span>
                          {song.show_id ? (
                            <Link
                              href={`/archive/setlist/${song.show_id}`}
                              className="font-medium hover:underline text-white/80"
                            >
                              {formatTourDate(song.show_date)}
                            </Link>
                          ) : (
                            <span>{formatTourDate(song.show_date)}</span>
                          )}
                          {song.venue_location && (
                            <span className="text-muted-foreground/70">
                              {" "}
                              [{song.venue_location}]
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="py-1.5 pl-2 text-muted-foreground text-xs whitespace-nowrap">
                      {song.last_show_date && (
                        <>
                          <span className="text-muted-foreground">LTP </span>
                          {song.last_show_id ? (
                            <Link
                              href={`/archive/setlist/${song.last_show_id}`}
                              className="font-medium hover:underline text-white/80"
                            >
                              {formatTourDate(song.last_show_date)}
                            </Link>
                          ) : (
                            <span>{formatTourDate(song.last_show_date)}</span>
                          )}
                          {extractShowCount(song.last_count) && (
                            <span className="text-muted-foreground/70">
                              {" "}
                              ({extractShowCount(song.last_count)} shows)
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
        )}
      </CardContent>

      {hoveredLibBadge && tooltipPosition &&
        createPortal(
          <div
            className="fixed text-xs leading-tight font-medium bg-card text-foreground px-1.5 py-1 rounded border border-border shadow-lg whitespace-normal pointer-events-none max-w-[150px] z-[99999]"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
            }}
          >
            LIB <span className="font-normal">(Song Liberation)</span>
            <br />
            <span className="font-light">
              Song returned after a full calendar year of not being played.
            </span>
          </div>,
          document.body,
        )}
    </Card>
  )
}
