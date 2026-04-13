"use client"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import {
  getJotyBadgeStyle,
  shouldShowSetlistEntryShort,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { SetlistEntry } from "@/types/setlist"
import {
  entryHasSongStatsLines,
  SetlistEntryStatsTooltipContent,
} from "@/components/dpro/setlist/setlist-entry-stats-tooltip-content"

interface SetlistEntrySongCellProps {
  entry: SetlistEntry
  onSongClick?: (entry: SetlistEntry) => void
  onJotyClick?: (entry: SetlistEntry) => void
  /** Desktop layout: show per-row stats tooltip when API fields are present. */
  showStatsTooltip?: boolean
}

export function SetlistEntrySongCell({
  entry,
  onSongClick,
  onJotyClick,
  showStatsTooltip = false,
}: SetlistEntrySongCellProps) {
  const songContent = (
    <div className="flex w-full flex-nowrap items-center gap-2">
      <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-x-2 font-medium">
        {onSongClick ? (
          <button
            type="button"
            onClick={() => onSongClick(entry)}
            className="max-w-full rounded text-left focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1"
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
        {shouldShowSetlistEntryShort(entry.entry_song, entry.entry_short) && (
          <span className="text-[0.625rem] text-red-400">
            [{entry.entry_short}]
          </span>
        )}
        {entry.entry_segue && (
          <span className="text-red-400">
            → {entry.entry_segue.replace(/^>\s*/, "").trim()}
          </span>
        )}
      </div>
      {entry.joty_round && (
        <span className="ml-auto shrink-0">
          {(() => {
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
              <span style={jotyStyle.style} className={jotyStyle.className}>
                {entry.joty_round}
              </span>
            )
          })()}
        </span>
      )}
    </div>
  )

  const body = songContent

  if (showStatsTooltip && entryHasSongStatsLines(entry)) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex w-full cursor-default flex-col gap-0.5 text-left">
            {body}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-[280px] leading-tight" side="top">
          <SetlistEntryStatsTooltipContent entry={entry} />
        </TooltipContent>
      </Tooltip>
    )
  }

  return <div className="flex flex-col gap-0.5 text-left">{body}</div>
}
