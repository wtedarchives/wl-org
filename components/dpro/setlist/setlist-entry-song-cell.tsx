"use client"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import { getJotyBadgeStyle } from "@/components/dpro/setlist/display-setlist-table.constants"
import type { SetlistEntry } from "@/types/setlist"

interface SetlistEntrySongCellProps {
  entry: SetlistEntry
  onSongClick?: (entry: SetlistEntry) => void
  onJotyClick?: (entry: SetlistEntry) => void
}

export function SetlistEntrySongCell({
  entry,
  onSongClick,
  onJotyClick,
}: SetlistEntrySongCellProps) {
  const songContent = (
    <div className="flex w-full flex-nowrap items-center gap-2">
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1 content-start font-medium">
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
        {entry.entry_short && (
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

  return (
    <div className="flex flex-col gap-0.5">
      {songContent}
      {entry.entry_coachnotes?.trim() && (
        <div
          className="min-w-[300px] max-w-[470px] break-words whitespace-normal text-[10px] leading-2.5 text-muted-foreground [&_a]:font-semibold [&_a]:text-wl-orange [&_a]:hover:underline"
          dangerouslySetInnerHTML={{ __html: entry.entry_coachnotes.trim() }}
        />
      )}
    </div>
  )
}
