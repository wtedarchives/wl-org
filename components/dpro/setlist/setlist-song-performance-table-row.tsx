"use client"

import Link from "next/link"

import {
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { shouldShowSetlistEntryShort } from "@/components/dpro/setlist/display-setlist-table.constants"
import { getPlacementBarCssToken } from "@/lib/placement-bar-color"
import { formatEntryLength, formatSetlistDate } from "@/lib/setlist-utils"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import { cn } from "@/lib/utils"
import { useInternalLinkInterceptor } from "@/hooks/use-internal-link-interceptor"
import type { SongPerformance } from "@/hooks/use-song-tour-performances"

const SETLIST_SONG_PERF_COLUMN_COUNT = 6

export function SetlistSongPerformanceTableRow({
  perf,
  onDismiss,
  wlHomeV2YearsTable,
}: {
  perf: SongPerformance
  onDismiss: () => void
  wlHomeV2YearsTable: boolean
}) {
  const onLinkClick = useInternalLinkInterceptor()
  return (
    <TableRow className={cn("align-middle", wlHomeV2YearsTable && "song-row")}>
      <TableCell
        className={cn(
          wlHomeV2YearsTable ?
            "center whitespace-nowrap align-middle"
          : cn(
              "whitespace-nowrap text-center align-middle text-[11px]",
              "px-2 py-1",
            ),
        )}
      >
        <Link
          href={getSetlistArchiveUrl(perf.show_id)}
          className={cn(
            "hover:underline",
            wlHomeV2YearsTable && "text-inherit",
          )}
          onClick={() => onDismiss()}
        >
          {formatSetlistDate(perf.show_date)}
        </Link>
      </TableCell>
      <TableCell
        className={cn(
          wlHomeV2YearsTable ?
            "set-table-perf-rail relative shrink-0 align-middle"
          : "relative shrink-0 w-2 align-middle p-0",
        )}
        aria-hidden
      >
        {perf.entry_placement ?
          <span
            className="set-table-perf-bar"
            data-placement-bar={getPlacementBarCssToken(perf.entry_placement)}
            aria-hidden
          />
        : null}
      </TableCell>
      <TableCell
        className={cn(
          wlHomeV2YearsTable ?
            "align-middle"
          : "align-middle px-2 py-1 text-[11px]",
        )}
      >
        {perf.venue_id ?
          <Link
            href={getVenueArchiveUrl(perf.venue_id)}
            className={cn(
              "hover:underline",
              wlHomeV2YearsTable && "text-inherit",
            )}
            onClick={() => onDismiss()}
          >
            {perf.show_venue_location || perf.show_subvenue || "—"}
          </Link>
        : <span>{perf.show_venue_location || "—"}</span>}
      </TableCell>
      <TableCell
        className={cn(
          wlHomeV2YearsTable ?
            "align-middle text-left"
          : cn("align-middle text-left text-[11px]", "px-2 py-1"),
        )}
      >
        <div className="inline-flex items-center gap-1">
          {shouldShowSetlistEntryShort(perf.entry_song, perf.entry_short) && (
            <span
              className={cn(
                wlHomeV2YearsTable ? "short" : "text-[0.625rem] text-red-400",
              )}
            >
              {wlHomeV2YearsTable ?
                perf.entry_short
              : `[${perf.entry_short}]`}
            </span>
          )}
          {perf.entry_segue && (
            <span
              className={cn(
                wlHomeV2YearsTable ? "segue" : "text-[0.625rem] text-red-400",
              )}
            >
              →
              {perf.entry_segue.replace(/^>\s*/, "").trim()}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell
        className={cn(
          wlHomeV2YearsTable ?
            "center whitespace-nowrap align-middle"
          : cn(
              "whitespace-nowrap text-center align-middle text-[11px]",
              "px-2 py-1",
            ),
        )}
      >
        {formatEntryLength(perf.entry_length) || ""}
      </TableCell>
      <TableCell
        className={cn(
          wlHomeV2YearsTable ?
            "notes-cell max-w-[400px] min-w-0 whitespace-normal align-middle"
          : "max-w-[400px] min-w-0 whitespace-normal align-top px-2 py-1 text-[11px]",
        )}
      >
        {perf.entry_coachnotes ?
          <div
            onClick={onLinkClick}
            className={cn(
              "w-fit max-w-full min-w-0 break-words [&_p]:my-0",
              wlHomeV2YearsTable ?
                "setlist-v2-notes-html"
              : cn(
                  "text-[11px] leading-tight text-muted-foreground",
                  "[&_a]:font-semibold [&_a]:text-wl-orange [&_a]:hover:underline [&_p]:my-0",
                ),
            )}
          >
            <span
              dangerouslySetInnerHTML={{
                __html: perf.entry_coachnotes.trim(),
              }}
            />
          </div>
        : null}
      </TableCell>
    </TableRow>
  )
}

export function SetlistSongPerformanceSectionHeaderRow({
  songDisplayName,
  songId,
  songName,
  showTopBorder,
  onDismiss,
  wlHomeV2YearsTable,
}: {
  songDisplayName: string | null | undefined
  songId: string | null | undefined
  songName: string
  showTopBorder: boolean
  onDismiss?: () => void
  wlHomeV2YearsTable: boolean
}) {
  const label = (
    <SongDisplayName
      as="span"
      song={songName}
      songDisplayName={songDisplayName}
    />
  )

  return (
    <TableRow
      className={cn(
        "modal-setlist-song-section-head",
        wlHomeV2YearsTable &&
          "border-b border-[rgb(43,46,44)] bg-black/25 hover:bg-black/25",
        showTopBorder && wlHomeV2YearsTable && "border-t border-[rgb(49,51,49)]",
      )}
    >
      <TableCell
        colSpan={SETLIST_SONG_PERF_COLUMN_COUNT}
        className={cn(
          wlHomeV2YearsTable ?
            "modal-setlist-song-section-head-cell"
          : "py-2 pl-3 pr-2",
        )}
      >
        {songId ?
          <Link
            href={getSongArchiveUrl(songId)}
            className="modal-setlist-song-section-head-link"
            onClick={() => onDismiss?.()}
          >
            {label}
          </Link>
        : <span className="modal-setlist-song-section-head-label">{label}</span>}
      </TableCell>
    </TableRow>
  )
}

export { SETLIST_SONG_PERF_COLUMN_COUNT }
