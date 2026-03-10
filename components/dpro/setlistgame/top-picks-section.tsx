"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { SongStat } from "@/hooks/use-setlist-game-show-data"

interface TopPicksSectionProps {
  topSongs: SongStat[]
  topOpeners: SongStat[]
  topClosers: SongStat[]
}

function SongRow({ song, index }: { song: SongStat; index: number }) {
  return (
    <div className="flex items-center justify-between rounded-md py-0.5 px-2 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-xs text-muted-foreground font-medium min-w-[20px] text-center shrink-0">
          {index + 1}
        </span>
        {song.category_artwork && (
          <img
            src={song.category_artwork}
            alt=""
            className="size-4 rounded object-cover border border-border shrink-0"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = "none"
            }}
          />
        )}
        <Link
          href={song.song_id ? `/dpro/song/${song.song_id}` : "#"}
          className={cn(
            "text-xs font-medium truncate",
            song.song_id
              ? "text-foreground no-underline hover:underline"
              : "text-muted-foreground cursor-default"
          )}
        >
          {song.song}
        </Link>
      </div>
      <span className="text-xs text-white bg-white/10 px-1.5 py-0.5 rounded font-medium min-w-[24px] text-center shrink-0">
        {song.count}
      </span>
    </div>
  )
}

function SongList({
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
    <div className="space-y-0.5">
      {songs.map((song, index) => (
        <SongRow key={song.song} song={song} index={index} />
      ))}
    </div>
  )
}

export function TopPicksSection({
  topSongs,
  topOpeners,
  topClosers,
}: TopPicksSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card className="border-border/60 bg-card/80 py-0 overflow-hidden">
        <CardHeader className="py-2 bg-muted">
          <CardTitle className="text-sm">Top Songs Picked</CardTitle>
        </CardHeader>
        <CardContent className="px-3 py-2">
          <SongList songs={topSongs} emptyMessage="No song data available yet." />
        </CardContent>
      </Card>
      <Card className="border-border/60 bg-card/80 py-0 overflow-hidden">
        <CardHeader className="py-2 bg-[#047857] text-white">
          <CardTitle className="text-sm">Top Show Openers</CardTitle>
        </CardHeader>
        <CardContent className="px-3 py-2">
          <SongList songs={topOpeners} emptyMessage="No opener data available yet." />
        </CardContent>
      </Card>
      <Card className="border-border/60 bg-card/80 py-0 overflow-hidden">
        <CardHeader className="py-2 bg-[#3b82f6] text-white">
          <CardTitle className="text-sm">Top Show Closers</CardTitle>
        </CardHeader>
        <CardContent className="px-3 py-2">
          <SongList songs={topClosers} emptyMessage="No closer data available yet." />
        </CardContent>
      </Card>
    </div>
  )
}
