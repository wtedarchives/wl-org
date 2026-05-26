"use client"

import { shouldShowSetlistEntryShort } from "@/components/dpro/setlist/display-setlist-table.constants"
import type { SetlistEntry } from "@/types/setlist"

const statHtmlClass =
  "break-words leading-tight [&_a]:font-semibold [&_a]:text-wl-orange [&_a]:hover:underline [&_*]:leading-tight"

export function entryHasSongStatsLines(entry: SetlistEntry): boolean {
  const nonempty = (s: string | null | undefined) => !!(s?.trim())
  return (
    nonempty(entry.times_played) ||
    nonempty(entry.shows_since_debut) ||
    nonempty(entry.song_rarity_percentage)
  )
}

export function entriesHaveSongStatsLines(entries: SetlistEntry[]): boolean {
  return entries.some(entryHasSongStatsLines)
}

function SetlistEntryStatsTooltipSongBlock({ entry }: { entry: SetlistEntry }) {
  return (
    <div className="space-y-1 text-left leading-tight">
      <div className="font-medium leading-tight">
        <span>{entry.entry_song}</span>
        {shouldShowSetlistEntryShort(entry.entry_song, entry.entry_short) ? (
          <span className="ml-2 text-destructive">[{entry.entry_short}]</span>
        ) : null}
        {entry.entry_segue ?
          <span className="ml-2 inline font-bold text-[oklch(0.6_0.14_12)]">
            → {entry.entry_segue.replace(/^>\s*/, "").trim()}
          </span>
        : null}
      </div>
      {entry.times_played?.trim() ? (
        <div
          className={statHtmlClass}
          dangerouslySetInnerHTML={{ __html: entry.times_played.trim() }}
        />
      ) : null}
      {entry.shows_since_debut?.trim() ? (
        <div
          className={statHtmlClass}
          dangerouslySetInnerHTML={{
            __html: entry.shows_since_debut.trim(),
          }}
        />
      ) : null}
      {entry.song_rarity_percentage?.trim() ? (
        <div
          className={statHtmlClass}
          dangerouslySetInnerHTML={{
            __html: entry.song_rarity_percentage.trim(),
          }}
        />
      ) : null}
    </div>
  )
}

export function SetlistEntryStatsTooltipContent({
  entry,
  entries,
}: {
  entry?: SetlistEntry
  entries?: SetlistEntry[]
}) {
  const list = entries?.length ? entries : entry ? [entry] : []
  if (list.length <= 1) {
    const single = list[0]
    if (!single) return null
    return <SetlistEntryStatsTooltipSongBlock entry={single} />
  }

  return (
    <div className="space-y-3 text-left leading-tight">
      {list.map((sectionEntry, index) => (
        <div key={sectionEntry.entry_id}>
          {index > 0 ?
            <div
              className="mb-3 border-t border-white/15"
              aria-hidden={true}
            />
          : null}
          <SetlistEntryStatsTooltipSongBlock entry={sectionEntry} />
        </div>
      ))}
    </div>
  )
}
