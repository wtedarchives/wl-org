"use client"

import { MoveRight } from "lucide-react"
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

export function SetlistEntryStatsTooltipContent({
  entry,
}: {
  entry: SetlistEntry
}) {
  return (
    <div className="space-y-1 text-left leading-tight">
      <div className="font-medium leading-tight">
        <span>{entry.entry_song}</span>
        {shouldShowSetlistEntryShort(entry.entry_song, entry.entry_short) ? (
          <span className="ml-2 text-destructive">[{entry.entry_short}]</span>
        ) : null}
        {entry.entry_segue ? (
          <MoveRight
            className="ml-2 inline size-4 shrink-0 text-destructive"
            aria-hidden
          />
        ) : null}
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
