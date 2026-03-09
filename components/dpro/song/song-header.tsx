"use client"

import { SongSearch } from "@/components/dpro/songs/song-search"
import { Card, CardContent } from "@/components/ui/card"

interface SongHeaderProps {
  songName: string
}

export function SongHeader({ songName }: SongHeaderProps) {
  return (
    <Card className="border-border/60 bg-card/80 py-0 overflow-hidden">
      <CardContent className="flex flex-row items-center justify-between gap-2 px-3 py-2">
        <h1 className="text-base font-semibold truncate">{songName}</h1>
        <SongSearch />
      </CardContent>
    </Card>
  )
}
