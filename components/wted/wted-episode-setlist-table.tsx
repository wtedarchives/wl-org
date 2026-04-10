"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { MoveRight } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import type { WtedEpisodeTableRow } from "@/types/wted-episode"
import { shouldShowSetlistEntryShort } from "@/components/dpro/setlist/display-setlist-table.constants"
import {
  formatEntryLength,
  formatSetlistDate,
  getEncoreLabel,
  getGuestColor,
  getPlacementColor,
  shouldShowSetBreak,
} from "@/lib/setlist-utils"
import type { GuestGroup } from "@/types/setlist"
import { getPersonnelArchiveUrl } from "@/lib/personnel-archive-url"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import { cn } from "@/lib/utils"

function WtedEpisodeSetlistTableHead({
  showGroupColumn,
}: {
  showGroupColumn: boolean
}) {
  return (
    <TableRow className="h-8 border-border/60 hover:bg-transparent">
      <TableHead className="h-8 w-10 text-center text-xs text-muted-foreground">
        #
      </TableHead>
      <TableHead className="h-8 min-w-[8rem] text-left text-xs text-muted-foreground">
        Song
      </TableHead>
      <TableHead className="h-8 text-center text-xs text-muted-foreground whitespace-nowrap">
        Date
      </TableHead>
      <TableHead className="h-8 text-left text-xs text-muted-foreground">
        Location
      </TableHead>
      <TableHead className="h-8 text-center text-xs text-muted-foreground whitespace-nowrap">
        Time
      </TableHead>
      {showGroupColumn && (
        <TableHead className="h-8 text-center text-xs text-muted-foreground whitespace-nowrap">
          Group
        </TableHead>
      )}
      <TableHead className="h-8 text-left text-xs text-muted-foreground">
        Personnel
      </TableHead>
    </TableRow>
  )
}

export function WtedEpisodeSetlistTable({
  rows,
  guestGroups,
}: {
  rows: WtedEpisodeTableRow[]
  guestGroups: GuestGroup[]
}) {
  const showGroupColumn = rows.some(
    (r) => r.showGroup != null && r.showGroup !== "Goose",
  )

  const placements = new Set(
    rows.map((r) => r.wtedPlacement).filter((p): p is string => !!p?.length),
  )
  const hasSinglePlacementType = placements.size <= 1
  const colSpan = showGroupColumn ? 7 : 6

  let displayNum = 0

  const body: ReactNode[] = []

  rows.forEach((row, index) => {
    const prev = index > 0 ? rows[index - 1] : null
    const sl = row.setlistEntry

    if (!hasSinglePlacementType && row.wtedSet) {
      if (prev && row.wtedSet.startsWith("E")) {
        if (
          !prev.wtedSet ||
          !prev.wtedSet.startsWith("E") ||
          prev.wtedSet !== row.wtedSet
        ) {
          body.push(
            <TableRow
              key={`encore-${row.refId}-${index}`}
              className="bg-destructive/15"
            >
              <TableCell
                colSpan={colSpan}
                className="py-1 text-center text-xs font-medium text-foreground"
              >
                {getEncoreLabel(row.wtedSet)}
              </TableCell>
            </TableRow>,
          )
        }
      }

      if (
        prev?.wtedSet &&
        row.wtedSet &&
        shouldShowSetBreak(prev.wtedSet, row.wtedSet)
      ) {
        body.push(
          <TableRow
            key={`setbreak-${row.refId}-${index}`}
            className="bg-muted/80"
          >
            <TableCell
              colSpan={colSpan}
              className="py-1 text-center text-xs font-medium text-muted-foreground"
            >
              Set Break
            </TableCell>
          </TableRow>,
        )
      }
    }

    displayNum += 1
    const placementColor = getPlacementColor(row.wtedPlacement ?? "")

    body.push(
      <TableRow
        key={row.refId}
        className="bg-background/70 hover:bg-muted/40 transition-colors"
      >
        <TableCell className="relative w-10 py-0.5 text-center text-xs font-medium tabular-nums">
          <span
            className="absolute inset-0 z-0"
            style={{ backgroundColor: placementColor }}
            aria-hidden
          />
          <span
            className={cn(
              "relative z-[1]",
              placementColor !== "transparent" ? "text-white" : "",
            )}
          >
            {displayNum}
          </span>
        </TableCell>
        <TableCell className="py-0.5 align-middle">
          <div className="flex min-w-0 items-center gap-1.5">
            {sl.songs?.categories?.category_artwork?.trim() ? (
              <span className="relative size-5 shrink-0 overflow-hidden rounded border border-border">
                <Image
                  src={sl.songs.categories.category_artwork}
                  alt=""
                  width={20}
                  height={20}
                  className="size-5 object-cover"
                  unoptimized
                />
              </span>
            ) : null}
            <div className="min-w-0 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs font-medium">
              <Link
                href={getSongArchiveUrl(sl.song_id)}
                className="text-foreground hover:underline"
              >
                <SongDisplayName
                  song={sl.entry_song}
                  songDisplayName={sl.songs?.song_displayname ?? null}
                />
              </Link>
              {shouldShowSetlistEntryShort(sl.entry_song, sl.entry_short) && (
                <span className="text-destructive">
                  [{String(sl.entry_short)}]
                </span>
              )}
              {sl.entry_segue ? (
                <MoveRight
                  className="inline size-3.5 shrink-0 text-destructive"
                  aria-hidden
                />
              ) : null}
            </div>
          </div>
        </TableCell>
        <TableCell className="py-0.5 text-center text-xs whitespace-nowrap">
          {row.showDate && row.showId ? (
            <Link
              href={getSetlistArchiveUrl(row.showId)}
              className="font-medium hover:underline"
            >
              {formatSetlistDate(row.showDate)}
            </Link>
          ) : row.showDate ? (
            formatSetlistDate(row.showDate)
          ) : (
            ""
          )}
        </TableCell>
        <TableCell className="py-0.5 text-xs text-muted-foreground whitespace-nowrap">
          {row.venueLocation ? (
            row.venueId ? (
              <Link
                href={getVenueArchiveUrl(row.venueId)}
                className="hover:underline text-foreground"
              >
                {row.venueLocation}
              </Link>
            ) : (
              row.venueLocation
            )
          ) : (
            ""
          )}
        </TableCell>
        <TableCell className="py-0.5 text-center text-xs text-muted-foreground tabular-nums whitespace-nowrap">
          {formatEntryLength(sl.entry_length) || ""}
        </TableCell>
        {showGroupColumn && (
          <TableCell className="py-0.5 text-center text-xs whitespace-nowrap">
            {row.showGroup ?? ""}
          </TableCell>
        )}
        <TableCell className="py-0.5 text-xs">
          {sl.guests?.length ? (
            <span className="flex flex-wrap gap-1">
              {sl.guests.map((g) => (
                <Link
                  key={g.guest_id}
                  href={getPersonnelArchiveUrl(g.guest_id)}
                  className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium hover:underline"
                  style={{
                    borderColor: getGuestColor(sl, guestGroups),
                  }}
                >
                  {g.guest_display_name}
                </Link>
              ))}
            </span>
          ) : (
            ""
          )}
        </TableCell>
      </TableRow>,
    )
  })

  return (
    <div className="w-full min-w-0 overflow-x-auto rounded-lg border border-border/60">
      <Table className="[&_td]:px-2 [&_th]:px-2 min-w-max">
        <TableHeader>
          <WtedEpisodeSetlistTableHead showGroupColumn={showGroupColumn} />
        </TableHeader>
        <TableBody>{body}</TableBody>
      </Table>
    </div>
  )
}
