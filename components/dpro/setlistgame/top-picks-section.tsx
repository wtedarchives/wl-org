"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import type { SongStat } from "@/hooks/use-setlist-game-show-data"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { WlTopSlotsCategorySwatch } from "@/components/dpro/tours/top-slots-carousel"
import { useSetlistGameWlV2Chrome } from "@/components/dpro/setlistgame/setlist-game-wl-v2-chrome"
import { cn } from "@/lib/utils"

import "@/components/dpro/setlistgame/setlist-game-wl-v2.css"

function TopPickArtwork({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  if (failed || !src) return null
  return (
    <span className="inline-flex shrink-0 items-center pr-2">
      <img
        src={src}
        alt=""
        className="setlist-game-top-pick-art size-5 shrink-0 rounded object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  )
}

function TopPicksWlTable({
  songs,
  emptyMessage,
}: {
  songs: SongStat[]
  emptyMessage: string
}) {
  if (songs.length === 0) {
    return (
      <div className="px-2 py-4 text-center text-xs text-white/65">
        <p>{emptyMessage}</p>
      </div>
    )
  }
  return (
    <div className="setlist-game-top-picks-table-wrap">
      <table className="wl-home-v2-years-table wl-home-v2-top-slots-stats-table w-full min-w-max border-collapse text-[11px] leading-3">
        <tbody>
          {songs.map((song, i) => (
            <tr
              key={`${song.song}-${i}`}
              className="border-b border-[rgb(34,37,35)] bg-transparent transition-colors hover:bg-[rgba(88,200,174,0.11)] last:border-b-0"
            >
              <td className="wl-home-v2-top-slots-stats-cell">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={song.song_id ? getSongArchiveUrl(song.song_id) : "#"}
                    className={cn(
                      "min-w-0 flex-1 cursor-pointer text-left font-medium hover:underline",
                      song.song_id ?
                        "text-white/88"
                      : "cursor-default text-white/45",
                    )}
                  >
                    <SongDisplayName
                      song={song.song}
                      songDisplayName={song.song_displayname}
                    />
                  </Link>
                  {song.category_artwork ?
                    <TopPickArtwork src={song.category_artwork} />
                  : null}
                </div>
              </td>
              <td className="wl-home-v2-top-slots-stats-cell w-[30px] text-center font-medium tabular-nums text-white/88">
                {song.count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TopPicksWlPanel({
  title,
  swatchTitle,
  swatchIndex,
  songs,
  emptyMessage,
}: {
  title: string
  swatchTitle: string | null
  swatchIndex: number
  songs: SongStat[]
  emptyMessage: string
}) {
  return (
    <div className="widget-panel min-w-0 w-full flex-1 overflow-hidden">
      <div className="wp-head wl-home-v2-years-shows-wp-head">
        <span className="min-w-0 truncate">{title}</span>
        {swatchTitle ?
          <div className="wp-head-right">
            <WlTopSlotsCategorySwatch title={swatchTitle} index={swatchIndex} />
          </div>
        : null}
      </div>
      <TopPicksWlTable songs={songs} emptyMessage={emptyMessage} />
    </div>
  )
}

interface TopPicksSectionProps {
  topSongs: SongStat[]
  topOpeners: SongStat[]
  topClosers: SongStat[]
}

export function TopPicksSection({
  topSongs,
  topOpeners,
  topClosers,
}: TopPicksSectionProps) {
  const wlV2 = useSetlistGameWlV2Chrome()

  if (wlV2) {
    return (
      <div className="setlist-game-top-picks-row">
        <TopPicksWlPanel
          title="Top Songs Picked"
          swatchTitle={null}
          swatchIndex={0}
          songs={topSongs}
          emptyMessage="No song data available yet."
        />
        <TopPicksWlPanel
          title="Top Show Openers"
          swatchTitle="Show Openers"
          swatchIndex={0}
          songs={topOpeners}
          emptyMessage="No opener data available yet."
        />
        <TopPicksWlPanel
          title="Top Show Closers"
          swatchTitle="Show Closers"
          swatchIndex={2}
          songs={topClosers}
          emptyMessage="No closer data available yet."
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card className="border-border/60 bg-card/80 py-0 overflow-hidden">
        <CardHeader className="py-2 bg-muted">
          <CardTitle className="text-sm">Top Songs Picked</CardTitle>
        </CardHeader>
        <CardContent className="px-3 py-2">
          <LegacySongList
            songs={topSongs}
            emptyMessage="No song data available yet."
          />
        </CardContent>
      </Card>
      <Card className="border-border/60 bg-card/80 py-0 overflow-hidden">
        <CardHeader className="py-2 bg-[#047857] text-white">
          <CardTitle className="text-sm">Top Show Openers</CardTitle>
        </CardHeader>
        <CardContent className="px-3 py-2">
          <LegacySongList
            songs={topOpeners}
            emptyMessage="No opener data available yet."
          />
        </CardContent>
      </Card>
      <Card className="border-border/60 bg-card/80 py-0 overflow-hidden">
        <CardHeader className="py-2 bg-[#3b82f6] text-white">
          <CardTitle className="text-sm">Top Show Closers</CardTitle>
        </CardHeader>
        <CardContent className="px-3 py-2">
          <LegacySongList
            songs={topClosers}
            emptyMessage="No closer data available yet."
          />
        </CardContent>
      </Card>
    </div>
  )
}

function LegacySongList({
  songs,
  emptyMessage,
}: {
  songs: SongStat[]
  emptyMessage: string
}) {
  if (songs.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-xs text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }
  return (
    <div className="space-y-0.5 py-1">
      {songs.map((song, index) => (
        <div
          key={song.song}
          className="flex items-center justify-between rounded-md py-0.5 px-2 transition-colors hover:bg-muted/50"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="min-w-[20px] shrink-0 text-center text-xs font-medium text-muted-foreground">
              {index + 1}
            </span>
            {song.category_artwork ?
              <LegacyTopPickArtwork src={song.category_artwork} />
            : null}
            <Link
              href={song.song_id ? getSongArchiveUrl(song.song_id) : "#"}
              className={cn(
                "min-w-0 truncate text-xs font-medium",
                song.song_id ?
                  "text-foreground no-underline hover:underline"
                : "cursor-default text-muted-foreground",
              )}
            >
              <SongDisplayName
                song={song.song}
                songDisplayName={song.song_displayname}
              />
            </Link>
          </div>
          <span className="min-w-[24px] shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-center text-xs font-medium text-white">
            {song.count}
          </span>
        </div>
      ))}
    </div>
  )
}

function LegacyTopPickArtwork({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  if (failed || !src) return null
  return (
    <img
      src={src}
      alt=""
      className="size-4 shrink-0 rounded border border-border object-cover"
      onError={() => setFailed(true)}
    />
  )
}
