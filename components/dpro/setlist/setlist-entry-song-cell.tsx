"use client"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import {
  getJotyBadgeStyle,
  jotyRoundDataAttr,
  shouldShowSetlistEntryShort,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import { SetlistEntryStatsTooltip } from "@/components/dpro/setlist/setlist-entry-stats-tooltip"
import { WlHomeV2SetlistAltNameDisplay } from "@/components/wl-home-v2/wl-home-v2-setlist-alt-name-display"
import { cn } from "@/lib/utils"
import type { SetlistEntry } from "@/types/setlist"

interface SetlistEntrySongCellProps {
  entry: SetlistEntry
  onSongClick?: (entry: SetlistEntry) => void
  onJotyClick?: (entry: SetlistEntry) => void
  /** Desktop layout: show per-row stats tooltip when API fields are present. */
  showStatsTooltip?: boolean
  /** Match WL Home v2 setlist row (markup, pills, header tooltip panel when stats tooltip is on). */
  statsTooltipWlV2Chrome?: boolean
  /** WL Home v2: alt_name-style song label from coach-note intro fragments. */
  songAltName?: string | null
}

export function SetlistEntrySongCell({
  entry,
  onSongClick,
  onJotyClick,
  showStatsTooltip = false,
  statsTooltipWlV2Chrome = false,
  songAltName = null,
}: SetlistEntrySongCellProps) {
  const jotyAttr = entry.joty_round ? jotyRoundDataAttr(entry.joty_round) : null
  const shortShown = shouldShowSetlistEntryShort(
    entry.entry_song,
    entry.entry_short,
  )
  const segueText = entry.entry_segue ?
    entry.entry_segue.replace(/^>\s*/, "").trim()
  : ""

  const jotyBlock =
    entry.joty_round && jotyAttr ?
      statsTooltipWlV2Chrome ?
        <div className="song-cell-joty">
          {onJotyClick ?
            <button
              type="button"
              className="joty-pill"
              data-joty-round={jotyAttr}
              onClick={() => onJotyClick(entry)}
              aria-label={`Jam of the Year: ${entry.joty_round}`}
            >
              {entry.joty_round}
            </button>
          : <span className="joty-pill" data-joty-round={jotyAttr}>
              {entry.joty_round}
            </span>}
        </div>
      : <span className="ml-auto ml-3 shrink-0">
          {(() => {
            const jotyStyle = getJotyBadgeStyle(entry.joty_round!)
            return onJotyClick ?
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
              : <span style={jotyStyle.style} className={jotyStyle.className}>
                  {entry.joty_round}
                </span>
          })()}
        </span>
    : null

  const wlV2SongName =
    songAltName ?
      <WlHomeV2SetlistAltNameDisplay
        altName={songAltName}
        onClick={onSongClick ? () => onSongClick(entry) : undefined}
      />
    : onSongClick ?
      <button
        type="button"
        className="song-cell-song-hit"
        onClick={() => onSongClick(entry)}
      >
        <SongDisplayName
          song={entry.entry_song}
          songDisplayName={entry.songs?.song_displayname}
        />
      </button>
    : <SongDisplayName
        song={entry.entry_song}
        songDisplayName={entry.songs?.song_displayname}
      />

  const songContent =
    statsTooltipWlV2Chrome ?
      <div className="song-cell-inner">
        <div className="song-cell-main">
          {wlV2SongName}
          {shortShown && entry.entry_short ?
            <span className="short">{entry.entry_short}</span>
          : null}
          {entry.entry_segue ?
            <span className="segue">→ {segueText}</span>
          : null}
        </div>
        {jotyBlock}
      </div>
    : <div className="flex w-full flex-nowrap items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-x-2 font-medium">
          {onSongClick ?
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
          : <SongDisplayName
              song={entry.entry_song}
              songDisplayName={entry.songs?.song_displayname}
            />}
          {shortShown && (
            <span className="text-[0.625rem] text-red-400">
              [{entry.entry_short}]
            </span>
          )}
          {entry.entry_segue && (
            <span className="text-red-400">→ {segueText}</span>
          )}
        </div>
        {jotyBlock}
      </div>

  const body = songContent

  if (showStatsTooltip) {
    return (
      <SetlistEntryStatsTooltip
        entry={entry}
        wlV2Chrome={statsTooltipWlV2Chrome}
      >
        <div className="flex w-full cursor-default flex-col gap-0.5 text-left">
          {body}
        </div>
      </SetlistEntryStatsTooltip>
    )
  }

  return (
    <div
      className={cn(
        "text-left",
        statsTooltipWlV2Chrome ?
          "flex w-full min-w-0 flex-col"
        : "flex flex-col gap-0.5",
      )}
    >
      {body}
    </div>
  )
}
