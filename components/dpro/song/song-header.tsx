"use client"

import { SongSearch } from "@/components/dpro/songs/song-search"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { Card, CardContent } from "@/components/ui/card"

interface SongHeaderProps {
  songName: string
  songDisplayName?: string | null
}

export function SongHeader({ songName, songDisplayName }: SongHeaderProps) {
  return (
    <Card className="border-border/60 bg-card/80 py-0 overflow-hidden">
      <CardContent className="flex flex-row items-center justify-between gap-4 px-3 py-2">
        <h1 className="min-w-0 flex-1 text-base font-semibold leading-4.5 break-words [overflow-wrap:anywhere]">
          <SongDisplayName
            song={songName}
            songDisplayName={songDisplayName}
            underlineOnHover={false}
          />
        </h1>
        <SongSearch className="shrink-0" />
      </CardContent>
    </Card>
  )
}
