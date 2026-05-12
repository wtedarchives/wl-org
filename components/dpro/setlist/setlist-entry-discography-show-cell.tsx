"use client"

import Link from "next/link"
import { TableCell } from "@/components/ui/table"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import {
  DISPLAY_SETLIST_TABLE_CELL_PAD,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import { cn } from "@/lib/utils"
import type { DiscographyShowColumnCell } from "@/types/setlist"
import { venueLocationAlreadyBracketed } from "@/lib/format-venue-location-brackets"

/** Verbatim stylesheet sets `a { text-decoration: none }`; WL discography restores hover underline in CSS */
const SHOW_COL_HIT = "discography-show-col-hit"

function DiscographyShowVenueInner({
  cell,
}: {
  cell: DiscographyShowColumnCell
}) {
  const label = cell.venueLabel!
  if (cell.venueId) {
    return (
      <Link
        href={getVenueArchiveUrl(cell.venueId)}
        className={cn(
          SHOW_COL_HIT,
          "font-normal text-foreground hover:underline focus-visible:underline",
        )}
      >
        {label}
      </Link>
    )
  }
  if (cell.venueSlug) {
    return (
      <Link
        href={getVenueArchiveUrl(cell.venueSlug)}
        className={cn(
          SHOW_COL_HIT,
          "font-normal text-foreground hover:underline focus-visible:underline",
        )}
      >
        {label}
      </Link>
    )
  }
  return <span className="font-normal text-foreground">{label}</span>
}

export function SetlistEntryDiscographyShowCell({
  discographySourceLabel,
  discographyShowCell,
  wlHomeV2RowChrome,
}: {
  discographySourceLabel?: string
  discographyShowCell?: DiscographyShowColumnCell | null
  wlHomeV2RowChrome: boolean
}) {
  const pxPad = DISPLAY_SETLIST_TABLE_CELL_PAD

  return (
    <TableCell
      className={cn(
        pxPad,
        "min-w-[9rem] whitespace-nowrap text-left",
        !wlHomeV2RowChrome && "text-[11px]",
      )}
    >
      {discographyShowCell !== undefined ? (
        discographyShowCell ? (
          <span className="inline-flex flex-nowrap items-baseline gap-x-1.5 text-foreground">
            <Link
              href={getSetlistArchiveUrl(discographyShowCell.showId)}
              className={cn(
                SHOW_COL_HIT,
                "font-medium text-foreground hover:underline focus-visible:underline",
              )}
            >
              {discographyShowCell.dateLabel}
            </Link>
            {discographyShowCell.venueLabel ?
              venueLocationAlreadyBracketed(discographyShowCell.venueLabel) ?
                <DiscographyShowVenueInner cell={discographyShowCell} />
              : (
                <span>
                  {"["}
                  <DiscographyShowVenueInner cell={discographyShowCell} />
                  {"]"}
                </span>
              )
            : null}
          </span>
        ) : null
      ) : (
        <span className="text-muted-foreground">{discographySourceLabel}</span>
      )}
    </TableCell>
  )
}
