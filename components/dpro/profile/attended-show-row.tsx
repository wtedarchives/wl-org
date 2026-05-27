"use client"

import Link from "next/link"

import { formatTourShowDate } from "@/components/dpro/tours/tour-show-format"
import { TourShowsStatPill } from "@/components/dpro/tours/tour-shows-stat-pill"
import { TableCell, TableRow } from "@/components/ui/table"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getTourArchiveUrl } from "@/lib/tour-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import {
  formatLengthAsHmmss,
  getGapColor,
  getGapPillBackground,
  getRarityColor,
  getRarityPillBackground,
} from "@/lib/setlist-utils"
import type { AttendedShow } from "@/lib/utils/fetch-attended-shows"
import { cn } from "@/lib/utils"

const headCell = "!px-2 !py-0.5"
const headCellTight = "!px-1 !py-0.5"

export function AttendedShowRow({
  attendedShow,
  index,
  allShows,
  hasRarity,
  hasGap,
}: {
  attendedShow: AttendedShow
  index: number
  allShows: AttendedShow[]
  hasRarity: boolean
  hasGap: boolean
}) {
  const show = attendedShow.show
  const isGooseCanon =
    show?.show_group === "Goose" && show?.show_canonid
  const gooseNumber =
    isGooseCanon ?
      allShows
        .slice(0, index + 1)
        .filter(
          (s) => s.show?.show_group === "Goose" && s.show?.show_canonid,
        ).length
    : null

  const tourId =
    show?.tours && !Array.isArray(show.tours) ?
      (show.tours as { tour_id: string }).tour_id
    : Array.isArray(show?.tours) ?
      show.tours[0]?.tour_id
    : null

  const rarityNumeric =
    show?.show_rarity != null && String(show.show_rarity).trim() !== "" ?
      Number.parseFloat(
        String(show.show_rarity).replace(/%/g, "").trim(),
      )
    : NaN
  const rarityPctStr =
    Number.isFinite(rarityNumeric) ? `${rarityNumeric.toFixed(2)}%` : null

  const gapNumeric =
    show?.show_gap != null && String(show.show_gap).trim() !== "" ?
      Number.parseFloat(String(show.show_gap).trim())
    : NaN

  return (
    <TableRow
      className={cn(
        "border-b bg-transparent transition-colors hover:bg-[rgba(88,200,174,0.11)]",
      )}
    >
      <TableCell
        className={cn(
          "wl-home-v2-profile-shows-td-goose text-[11px]",
          headCellTight,
          isGooseCanon && "wl-home-v2-profile-shows-td-goose--canon",
        )}
      >
        {gooseNumber ?? ""}
      </TableCell>
      <TableCell
        className={cn(
          "whitespace-nowrap text-center text-[11px] font-medium tabular-nums",
          headCell,
        )}
      >
        <Link
          href={getSetlistArchiveUrl(attendedShow.show_id)}
          className="hover:underline"
        >
          {show?.show_date ? formatTourShowDate(show.show_date) : ""}
        </Link>
      </TableCell>
      <TableCell className={cn("text-[11px] text-muted-foreground", headCell)}>
        {show?.show_group}
      </TableCell>
      <TableCell className={cn("text-[11px] text-muted-foreground", headCell)}>
        {show?.show_tour ?
          tourId ?
            <Link href={getTourArchiveUrl(tourId)} className="hover:underline">
              {show.show_tour}
            </Link>
          : <span>{show.show_tour}</span>
        : null}
      </TableCell>
      <TableCell
        className={cn("text-center text-[11px] tabular-nums", headCell)}
      >
        {formatLengthAsHmmss(show?.show_length ?? null) ?? ""}
      </TableCell>
      {hasRarity ?
        <TableCell className={cn("text-center", headCell)}>
          {rarityPctStr != null ?
            <TourShowsStatPill
              fill={getRarityPillBackground(rarityPctStr)}
              border={getRarityColor(rarityPctStr)}
            >
              {rarityPctStr}
            </TourShowsStatPill>
          : null}
        </TableCell>
      : null}
      {hasGap ?
        <TableCell className={cn("text-center", headCell)}>
          {Number.isFinite(gapNumeric) ?
            <TourShowsStatPill
              fill={getGapPillBackground(gapNumeric)}
              border={getGapColor(gapNumeric)}
            >
              {gapNumeric.toFixed(2)}
            </TourShowsStatPill>
          : null}
        </TableCell>
      : null}
      <TableCell className={cn("text-[11px]", headCell)}>
        {show?.venue_id ?
          <Link href={getVenueArchiveUrl(show.venue_id)} className="hover:underline">
            {show.show_subvenue}
          </Link>
        : show?.show_subvenue_venue ?
          <Link
            href={getVenueArchiveUrl(show.show_subvenue_venue)}
            className="hover:underline"
          >
            {show.show_subvenue}
          </Link>
        : <span>{show?.show_subvenue}</span>}
      </TableCell>
      <TableCell
        className={cn("text-[11px] text-muted-foreground", headCell)}
      >
        {show?.show_venue_location}
      </TableCell>
      <TableCell
        className={cn("text-[11px] text-muted-foreground", headCell)}
      >
        {show?.show_detail}
        {show?.show_detail && show?.show_alert ? <>&nbsp;&nbsp;</> : null}
        {show?.show_alert ?
          <span className="font-medium text-red-500">
            [{show.show_alert}]
          </span>
        : null}
      </TableCell>
    </TableRow>
  )
}
