"use client"

import { Fragment } from "react"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import {
  jotyRoundDataAttr,
  shouldShowSetlistEntryShort,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import { SetlistEntryStatsTooltip } from "@/components/dpro/setlist/setlist-entry-stats-tooltip"
import { entriesHaveSongStatsLines } from "@/components/dpro/setlist/setlist-entry-stats-tooltip-content"
import { SetlistExpandButton } from "@/components/dpro/setlist/setlist-expand-button"
import { splitPairRowTrailingRepriseEntries } from "@/lib/song-pairs"
import { cn } from "@/lib/utils"
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
  const { trailingRepriseEntries } = splitPairRowTrailingRepriseEntries(entries)
  const jotyEntries = entries.filter((e) => e.joty_round)

  const altNameHit =
    altName ?
      onSongClick ?
        <button
          type="button"
          className="song-cell-song-hit"
          onClick={() => onSongClick(entries)}
        >
          <SongDisplayName song={altName} />
        </button>
      : <SongDisplayName song={altName} />
    : null

  const songMainInner =
    altName && trailingRepriseEntries.length > 0 ?
      <>
        {altNameHit}
        <span className="segue" aria-hidden>
          →
        </span>
        <PairSongSequence
          entries={trailingRepriseEntries}
          onSongClick={onSongClick}
        />
      </>
    : altName ?
      altNameHit
    : <PairSongSequence entries={entries} onSongClick={onSongClick} />

  const songMain = (
    <div
      className={cn(
        "song-cell-main",
        showTooltips &&
          entriesHaveSongStatsLines(entries) &&
          "cursor-default",
      )}
    >
      {songMainInner}
    </div>
  )

  const jotyBlock =
    jotyEntries.length > 0 ?
      <div className="song-cell-joty song-cell-joty--pair">
        {jotyEntries.map((entry, index) => {
          const jotyAttr = jotyRoundDataAttr(entry.joty_round!)
          return (
            <Fragment key={entry.entry_id}>
              {index > 0 ?
                <>
                  {"\u00A0"}
                  {"\u00A0"}
                </>
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
            </Fragment>
          )
        })}
      </div>
    : null

  return (
    <div className="song-cell-inner song-cell-inner--pair">
      {showTooltips ?
        <SetlistEntryStatsTooltip entries={entries} wlV2Chrome>
          {songMain}
        </SetlistEntryStatsTooltip>
      : songMain}
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
