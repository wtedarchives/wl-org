"use client"

import React from "react"
import Link from "next/link"
import { ArrowRight } from "@phosphor-icons/react"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { getPlacementBarColor } from "@/lib/placement-bar-color"

interface SetlistEntry {
  entry_song: string
  entry_short: string | null
  entry_segue: string | null
  entry_placement: string
  entry_setorder: number
  entry_set: string
  entry_setnum: number
  averageLength?: string | null
  songs: {
    song_id: string
    song_displayname?: string | null
    category_artwork?: string | null
  }
}

interface SetlistDisplayProps {
  setlist: SetlistEntry[]
  horizontalMargin?: string
}

export function SetlistDisplay({
  setlist,
  horizontalMargin = "mx-2",
}: SetlistDisplayProps) {
  return (
    <div className={horizontalMargin}>
      {setlist.map((entry, index) => {
        const prevEntry = index > 0 ? setlist[index - 1] : null
        const isNewSet =
          prevEntry && prevEntry.entry_set !== entry.entry_set

        const placement = entry.entry_placement
        const isOpener = /^Set \d+ Opener$/.test(placement)
        const isCloser = /^Set \d+ Closer$/.test(placement)
        const isEncore =
          placement === "Encore 1" ||
          placement === "Encore 2" ||
          placement === "Encore 3"

        const isSpecial = isOpener || isCloser || isEncore
        const barColor = getPlacementBarColor(placement)

        return (
          <React.Fragment key={`${entry.entry_song}-${index}`}>
            {isNewSet && <hr className="!my-1 border-border/70" />}
            <div className="flex items-center px-0 py-0 text-xs text-foreground">
              <div
                className={`w-1 rounded-sm shrink-0 ${
                  isSpecial ? "text-white" : "text-muted-foreground"
                }`}
                style={{ backgroundColor: barColor }}
              >
                {"\u00A0"}
              </div>
              <div className="flex flex-1 items-center justify-between !pl-2">
                <span className="flex items-center gap-1">
                  <Link
                    href={getSongArchiveUrl(entry.songs.song_id)}
                    className="text-[11px] font-medium hover:underline"
                  >
                    <SongDisplayName
                      song={entry.entry_song}
                      songDisplayName={entry.songs.song_displayname}
                    />
                  </Link>
                  {entry.entry_short && (
                    <span className="text-[10px] font-medium text-destructive">
                      [{entry.entry_short}]
                    </span>
                  )}
                  {entry.entry_segue && (
                    <ArrowRight className="h-3 w-3 text-destructive" aria-hidden />
                  )}
                </span>
                <div className="flex items-center gap-2">
                  {entry.averageLength && (
                    <span className="text-[10px] text-muted-foreground">
                      {entry.averageLength}
                    </span>
                  )}
                  {entry.songs.category_artwork && (
                    <img
                      src={entry.songs.category_artwork}
                      alt={`${entry.entry_song} artwork`}
                      className="h-4 w-4 rounded border border-border object-cover"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement
                        if (el) el.style.display = "none"
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

