"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import type { NotPlayedSong } from "@/hooks/use-not-played-in-tour"

interface NotPlayedInTourProps {
  tourId: string
  tourName: string
  showIds: string[]
  songIdMap?: Record<string, string>
  /** When provided, use pre-fetched data instead of fetching */
  notPlayedSongs?: NotPlayedSong[]
  /** When notPlayedSongs is provided, whether the parent is still loading */
  loading?: boolean
}

export function NotPlayedInTour({
  tourId,
  tourName,
  showIds,
  notPlayedSongs: notPlayedSongsProp,
  loading: loadingProp,
}: NotPlayedInTourProps) {
  const [notPlayedSongsLocal, setNotPlayedSongsLocal] = useState<
    NotPlayedSong[]
  >([])
  const [loadingLocal, setLoadingLocal] = useState(true)

  const usePreFetched = notPlayedSongsProp !== undefined
  const notPlayedSongs = usePreFetched ? notPlayedSongsProp : notPlayedSongsLocal
  const loading = usePreFetched ? (loadingProp ?? false) : loadingLocal

  useEffect(() => {
    if (usePreFetched) return
    if (!tourId || !showIds.length) {
      setLoadingLocal(false)
      return
    }

    async function fetchNotPlayedSongs() {
      try {
        const { supabase } = await import("@/lib/supabase")
        if (!supabase) {
          setLoadingLocal(false)
          return
        }

        const { data: tourFirstShowData, error: firstShowError } = await supabase
          .from("shows")
          .select("show_date")
          .eq("show_tour", tourName)
          .eq("show_group", "Goose")
          .not("show_canonid", "is", null)
          .order("show_date", { ascending: true })
          .limit(1)
          .single()

        if (firstShowError || !tourFirstShowData?.show_date) {
          setLoadingLocal(false)
          return
        }

        const firstShowDate = tourFirstShowData.show_date

        const { data: playedInTourData, error: playedError } = await supabase
          .from("setlist_entries")
          .select("songs!inner(song_id)")
          .in("entry_show", showIds)

        if (playedError) throw playedError

        const songsPlayedInTour = new Set(
          (playedInTourData ?? []).map((e: any) => e.songs?.song_id).filter(Boolean),
        )

        const allData: any[] = []
        let from = 0
        const batchSize = 1000
        let hasMore = true

        while (hasMore) {
          const { data, error } = await supabase
            .from("setlist_entries")
            .select(
              `
              entry_song,
              songs!inner(
                song_id,
                song_category,
                categories!inner(
                  category_canonid,
                  category_artwork
                )
              ),
              entry_show,
              shows!inner(
                show_date,
                show_group,
                show_canonid
              )
            `,
            )
            .eq("shows.show_group", "Goose")
            .not("shows.show_canonid", "is", null)
            .lt("shows.show_date", firstShowDate)
            .range(from, from + batchSize - 1)

          if (error) throw error
          allData.push(...(data ?? []))
          if (!data || data.length < batchSize) hasMore = false
          else from += batchSize
        }

        const songShowCounts: Record<
          string,
          { song: string; song_id: string; shows: Set<string>; category_canonid: number; category_artwork?: string }
        > = {}

        for (const entry of allData) {
          const songId = entry.songs?.song_id
          const showId = entry.entry_show
          if (!songId) continue
          if (!songShowCounts[songId]) {
            songShowCounts[songId] = {
              song: entry.entry_song,
              song_id: songId,
              shows: new Set([showId]),
              category_canonid: entry.songs?.categories?.category_canonid ?? 0,
              category_artwork: entry.songs?.categories?.category_artwork,
            }
          } else {
            songShowCounts[songId].shows.add(showId)
          }
        }

        const processed = Object.values(songShowCounts)
          .filter((item) => !songsPlayedInTour.has(item.song_id))
          .map((item) => ({
            song: item.song,
            song_id: item.song_id,
            play_count: item.shows.size,
            category_canonid: item.category_canonid,
            category_artwork: item.category_artwork,
          }))
          .sort((a, b) => {
            if (b.play_count !== a.play_count)
              return b.play_count - a.play_count
            if (a.category_canonid !== b.category_canonid)
              return a.category_canonid - b.category_canonid
            return a.song.localeCompare(b.song)
          })
          .slice(0, 8)

        setNotPlayedSongsLocal(processed)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching not played songs:", err)
      } finally {
        setLoadingLocal(false)
      }
    }

    fetchNotPlayedSongs()
  }, [tourId, tourName, showIds, usePreFetched])

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
      <div className="px-3 py-1.5 bg-muted/60">
        <h2 className="text-sm font-semibold">Most Common Not Played</h2>
      </div>
      <CardContent className="p-0">
        <div
          className={
            loading ? "opacity-50 transition-opacity duration-300" : ""
          }
        >
          {notPlayedSongs.length === 0 && !loading ? (
            <div className="py-2 text-center text-muted-foreground text-xs">
              No historical songs to display.
            </div>
          ) : (
            <div>
              <table className="w-full border-collapse text-xs">
                <tbody>
                  {notPlayedSongs.map((song) => (
                    <tr
                      key={song.song_id}
                      className="bg-background/70 hover:bg-muted/40 transition-colors"
                    >
                      <td className="pl-3 py-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            href={`/archive/song/${song.song_id}`}
                            className="font-medium text-foreground hover:underline"
                          >
                            <SongDisplayName
                              song={song.song}
                              songDisplayName={song.song_displayname}
                            />
                          </Link>
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
                      </td>
                      <td className="w-[40px] py-1.5 text-center font-medium tabular-nums text-foreground">
                        {song.play_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
