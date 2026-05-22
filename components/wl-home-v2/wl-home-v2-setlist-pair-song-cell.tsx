"use client"

import { Fragment } from "react"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import {
  jotyRoundDataAttr,
  shouldShowSetlistEntryShort,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import { SetlistExpandButton } from "@/components/dpro/setlist/setlist-expand-button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SETLIST_V2_ROW_TOOLTIP_CONTENT } from "@/components/wl-home-v2/wl-home-v2-setlist-table.constants"
import type { SetlistEntry } from "@/types/setlist"
import type { SongPair } from "@/types/song-pair"

type WlHomeV2SetlistPairSongCellProps = {
  pair: SongPair
  entries: SetlistEntry[]
  onExpand: () => void
  onSongClick?: (entries: SetlistEntry[]) => void
  onJotyClick?: (entry: SetlistEntry) => void
  showTooltips?: boolean
}

function PairSongSequence({
  entries,
  onSongClick,
}: {
  entries: SetlistEntry[]
  onSongClick?: (entries: SetlistEntry[]) => void
}) {
  return entries.map((entry, index) => {
    const prevEntry = index > 0 ? entries[index - 1] : null
    const showManualArrow = index > 0 && !prevEntry?.entry_segue?.trim()
    const shortShown = shouldShowSetlistEntryShort(
      entry.entry_song,
      entry.entry_short,
    )
    const segueText = entry.entry_segue ?
      entry.entry_segue.replace(/^>\s*/, "").trim()
    : ""

    return (
      <Fragment key={entry.entry_id}>
        {showManualArrow ?
          <span className="segue" aria-hidden>
            →
          </span>
        : null}
        {onSongClick ?
          <button
            type="button"
            className="song-cell-song-hit"
            onClick={() => onSongClick(entries)}
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
        }
        {shortShown && entry.entry_short ?
          <span className="short">{entry.entry_short}</span>
        : null}
        {entry.entry_segue ?
          <span className="segue">→ {segueText}</span>
        : null}
      </Fragment>
    )
  })
}

export function WlHomeV2SetlistPairSongCell({
  pair,
  entries,
  onExpand,
  onSongClick,
  onJotyClick,
  showTooltips = false,
}: WlHomeV2SetlistPairSongCellProps) {
  const altName = pair.alt_name?.trim()
  const jotyEntries = entries.filter((e) => e.joty_round)

  const jotyBlock =
    jotyEntries.length > 0 ?
      <div className="song-cell-joty song-cell-joty--pair">
        {jotyEntries.map((entry, index) => {
          const jotyAttr = jotyRoundDataAttr(entry.joty_round!)
          return (
            <span key={entry.entry_id} className="inline-flex items-center">
              {index > 0 ?
                <span className="song-cell-joty-sep" aria-hidden>
                  {" "}
                  •{" "}
                </span>
              : null}
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
            </span>
          )
        })}
      </div>
    : null

  const songMain =
    altName ?
      showTooltips ?
        <Tooltip>
          <TooltipTrigger asChild>
            {onSongClick ?
              <button
                type="button"
                className="song-cell-song-hit"
                onClick={() => onSongClick(entries)}
              >
                <SongDisplayName song={altName} />
              </button>
            : <span className="song-cell-song-hit song-cell-song-hit--tooltip-only">
                <SongDisplayName song={altName} />
              </span>
            }
          </TooltipTrigger>
          <TooltipContent {...SETLIST_V2_ROW_TOOLTIP_CONTENT}>
            <div className="setlist-pair-alt-tooltip-songs">
              <PairSongSequence entries={entries} />
            </div>
          </TooltipContent>
        </Tooltip>
      : onSongClick ?
        <button
          type="button"
          className="song-cell-song-hit"
          onClick={() => onSongClick(entries)}
        >
          <SongDisplayName song={altName} />
        </button>
      : <SongDisplayName song={altName} />
    : <PairSongSequence entries={entries} onSongClick={onSongClick} />

  return (
    <div className="song-cell-inner song-cell-inner--pair">
      <div className="song-cell-main">
        {songMain}
      </div>
      <div className="song-cell-pair-trailing">
        {jotyBlock}
        <SetlistExpandButton
          onClick={onExpand}
          ariaLabel="Show individual songs in this pair"
        />
      </div>
    </div>
  )
}
