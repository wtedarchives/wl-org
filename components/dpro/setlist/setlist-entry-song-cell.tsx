"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { getJotyBadgeStyle } from "@/components/dpro/setlist/display-setlist-table.constants"
import type { SetlistEntry } from "@/types/setlist"

interface SetlistEntrySongCellProps {
  entry: SetlistEntry
  onSongClick?: (entry: SetlistEntry) => void
  onJotyClick?: (entry: SetlistEntry) => void
  showTooltips?: boolean
}

export function SetlistEntrySongCell({
  entry,
  onSongClick,
  onJotyClick,
  showTooltips = true,
}: SetlistEntrySongCellProps) {
  const songContent = (
    <div className="flex flex-nowrap items-center gap-2">
      <span className="font-medium">
        {onSongClick ? (
          <button
            type="button"
            onClick={() => onSongClick(entry)}
            className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 rounded pr-1"
          >
            <SongDisplayName
              song={entry.entry_song}
              songDisplayName={entry.songs?.song_displayname}
            />
          </button>
        ) : (
          <SongDisplayName
            song={entry.entry_song}
            songDisplayName={entry.songs?.song_displayname}
          />
        )}
        {entry.entry_short && (
          <span className="ml-1 text-red-400 text-[0.625rem] pr-1">
            [{entry.entry_short}]
          </span>
        )}
        {entry.entry_segue && (
          <span className="ml-1 text-red-400">
            → {entry.entry_segue.replace(/^>\s*/, "").trim()}
          </span>
        )}
      </span>
      {entry.joty_round && (() => {
        const jotyStyle = getJotyBadgeStyle(entry.joty_round!)
        return onJotyClick ? (
          <button
            type="button"
            onClick={() => onJotyClick(entry)}
            className="cursor-pointer transition-transform hover:scale-110"
          >
            <span
              style={jotyStyle.style}
              className={`${jotyStyle.className} cursor-pointer`}
            >
              {entry.joty_round}
            </span>
          </button>
        ) : (
          <span
            style={jotyStyle.style}
            className={jotyStyle.className}
          >
            {entry.joty_round}
          </span>
        )
      })()}
    </div>
  )

  return (
    <div className="flex flex-col gap-0.5">
      {showTooltips ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{songContent}</div>
          </TooltipTrigger>
          <TooltipContent className="max-w-[280px] text-xs text-background">
            <div className="space-y-1.5">
              <div className="font-medium text-background">
                {entry.songs?.song_displayname || entry.entry_song}
                {entry.entry_short && (
                  <span className="ml-1 text-[0.625rem] text-red-400 pr-1">
                    [{entry.entry_short}]
                  </span>
                )}
                {entry.entry_segue && (
                  <span className="ml-1 text-red-400">
                    → {entry.entry_segue.replace(/^>\s*/, "").trim()}
                  </span>
                )}
              </div>
              {entry.times_played && (
                <div
                  className="text-background/80 [&_a]:underline [&_a]:text-background"
                  dangerouslySetInnerHTML={{ __html: entry.times_played }}
                />
              )}
              {entry.shows_since_debut && (
                <div
                  className="text-background/80 [&_a]:underline [&_a]:text-background"
                  dangerouslySetInnerHTML={{ __html: entry.shows_since_debut }}
                />
              )}
              {entry.song_rarity_percentage && (
                <div
                  className="text-background/80 [&_a]:underline [&_a]:text-background"
                  dangerouslySetInnerHTML={{ __html: entry.song_rarity_percentage }}
                />
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      ) : (
        songContent
      )}
      {entry.entry_coachnotes?.trim() && (
        <div
          className="min-w-[300px] max-w-[470px] break-words whitespace-normal text-[10px] leading-2.5 text-muted-foreground [&_a]:font-semibold [&_a]:text-wl-orange [&_a]:hover:underline"
          dangerouslySetInnerHTML={{ __html: entry.entry_coachnotes.trim() }}
        />
      )}
    </div>
  )
}
