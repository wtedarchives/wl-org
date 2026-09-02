"use client"

import { formatTourShowDate } from "@/components/dpro/tours/tour-show-format"
import {
  TourShowRowAttendeeCountCell,
  TourShowRowEchoCell,
  TourShowRowPosterCell,
  TourShowRowRadioCell,
  TourShowRowReleasesCell,
  TourShowRowSetlistScanCell,
  TourShowRowWlLinkCell,
} from "@/components/dpro/tours/tour-show-row-action-cells"
import { TourShowRowRatingStars } from "@/components/dpro/tours/tour-show-row-rating-stars"
import {
  parseTourShowGap,
  parseTourShowRarity,
} from "@/components/dpro/tours/tour-show-row-stats"
import { TourShowsStatPill } from "@/components/dpro/tours/tour-shows-stat-pill"
import { Check } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-context"
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"
import type { TourShow } from "@/types/tour"
import {
  formatLengthAsHmmss,
  getGapColor,
  getGapPillBackground,
  getRarityColor,
  getRarityPillBackground,
} from "@/lib/setlist-utils"
import { ArchivePrefetchLink } from "@/components/archive/archive-prefetch-link"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import Link from "next/link"

export interface TourShowRowProps {
  show: TourShow
  index: number
  attendeeCounts: Record<string, number>
  showRatings: Record<string, number>
  showsWithSetlists: Set<string>
  showsWithPosters: Set<string>
  showsWithReleases: Set<string>
  showsWithRadioIds: Set<string>
  showRarityColumn?: boolean
  showGapColumn?: boolean
  showEchoColumn?: boolean
  wlHomeV2?: boolean
}

export function TourShowRow({
  show,
  index,
  attendeeCounts,
  showRatings,
  showsWithSetlists,
  showsWithPosters,
  showsWithReleases,
  showsWithRadioIds,
  showRarityColumn = true,
  showGapColumn = true,
  showEchoColumn = false,
  wlHomeV2 = false,
}: TourShowRowProps) {
  const { session } = useAuth()
  const rating = showRatings[show.show_id] ?? 0
  const attendeeCount = attendeeCounts[show.show_id] ?? 0

  const { pctStr: rarityPctStr } = parseTourShowRarity(show.show_rarity)
  const gapNumeric = parseTourShowGap(show.show_gap)

  return (
    <TableRow
      className={cn(
        wlHomeV2 ?
          "border-b bg-transparent transition-colors hover:bg-[rgba(88,200,174,0.11)]"
        : index % 2 === 0 ?
          "bg-background/70"
        : "bg-background",
      )}
    >
      <TableCell
        className={cn(
          "whitespace-nowrap text-center text-[11px] font-medium tabular-nums",
          wlHomeV2 ? "!px-2 !py-0.5" : "px-2 py-1",
        )}
      >
        <ArchivePrefetchLink
          href={getSetlistArchiveUrl(show.show_id)}
          className="hover:underline"
        >
          {formatTourShowDate(show.show_date)}
        </ArchivePrefetchLink>
      </TableCell>
      {session ? (
        <TableCell
          className={cn(
            "w-[32px] text-center align-middle leading-none",
            wlHomeV2 ? "!px-1 !py-0.5" : "px-1 py-1",
          )}
        >
          <div className="inline-flex items-center justify-center">
            {show.attended ? (
              <div
                className={cn(
                  "inline-flex items-center justify-center rounded-full bg-emerald-600",
                  wlHomeV2 ? "size-4" : "p-0.5",
                )}
              >
                <Check
                  className={cn("text-white", wlHomeV2 ? "size-3" : "size-3")}
                  weight="bold"
                  aria-hidden
                />
              </div>
            ) : (
              <span
                className={cn("inline-block", wlHomeV2 ? "size-4" : "size-3")}
                aria-hidden
              />
            )}
          </div>
        </TableCell>
      ) : null}
      <TableCell
        className={cn(
          "text-[11px] text-muted-foreground",
          wlHomeV2 ? "!px-2 !py-0.5" : "px-2 py-1",
        )}
      >
        {show.show_group}
      </TableCell>
      <TableCell
        className={cn(
          "text-center text-[11px] tabular-nums",
          wlHomeV2 ? "!px-2 !py-0.5" : "px-2 py-1",
        )}
      >
        {formatLengthAsHmmss(show.show_length ?? null) ?? ""}
      </TableCell>
      {showRarityColumn ? (
        <TableCell
          className={cn("text-center", wlHomeV2 ? "!px-2 !py-0.5" : "px-2 py-1")}
        >
          {rarityPctStr != null ?
            <TourShowsStatPill
              fill={getRarityPillBackground(rarityPctStr)}
              border={getRarityColor(rarityPctStr)}
            >
              {rarityPctStr}
            </TourShowsStatPill>
          : null}
        </TableCell>
      ) : null}
      {showGapColumn ? (
        <TableCell
          className={cn("text-center", wlHomeV2 ? "!px-2 !py-0.5" : "px-2 py-1")}
        >
          {Number.isFinite(gapNumeric) ?
            <TourShowsStatPill
              fill={getGapPillBackground(gapNumeric)}
              border={getGapColor(gapNumeric)}
            >
              {gapNumeric.toFixed(2)}
            </TourShowsStatPill>
          : null}
        </TableCell>
      ) : null}
      <TableCell
        className={cn("text-[11px]", wlHomeV2 ? "!px-2 !py-0.5" : "px-2 py-1")}
      >
        {show.venue_id ? (
          <Link
            href={getVenueArchiveUrl(show.venue_id)}
            className="hover:underline"
          >
            {show.show_subvenue}
          </Link>
        ) : show.show_subvenue_venue ? (
          <Link
            href={getVenueArchiveUrl(show.show_subvenue_venue)}
            className="hover:underline"
          >
            {show.show_subvenue}
          </Link>
        ) : (
          <span>{show.show_subvenue}</span>
        )}
      </TableCell>
      <TableCell
        className={cn(
          "text-[11px] text-muted-foreground",
          wlHomeV2 ? "!px-2 !py-0.5" : "px-2 py-1",
        )}
      >
        {show.show_venue_location}
      </TableCell>
      <TableCell
        className={cn(
          "group text-center align-middle leading-none",
          wlHomeV2 ? "!px-2 !py-0.5" : "px-2 py-1",
        )}
      >
        <div className="inline-flex items-center justify-center">
          <TourShowRowRatingStars rating={rating} />
        </div>
      </TableCell>
      {showEchoColumn ?
        <TourShowRowEchoCell
          showId={show.show_id}
          hasSetlistGame={Boolean(show.show_issetlistgame)}
          wlHomeV2={wlHomeV2}
        />
      : null}
      <TourShowRowSetlistScanCell
        showId={show.show_id}
        hasSetlist={showsWithSetlists.has(show.show_id)}
        wlHomeV2={wlHomeV2}
      />
      <TourShowRowPosterCell
        showId={show.show_id}
        hasPoster={showsWithPosters.has(show.show_id)}
        wlHomeV2={wlHomeV2}
      />
      <TourShowRowReleasesCell
        showId={show.show_id}
        hasReleases={showsWithReleases.has(show.show_id)}
        wlHomeV2={wlHomeV2}
      />
      <TourShowRowAttendeeCountCell
        attendeeCount={attendeeCount}
        wlHomeV2={wlHomeV2}
      />
      <TourShowRowWlLinkCell wlLink={show.show_wl_link} wlHomeV2={wlHomeV2} />
      <TourShowRowRadioCell
        showId={show.show_id}
        hasRadio={showsWithRadioIds.has(show.show_id)}
        wlHomeV2={wlHomeV2}
      />
      <TableCell
        className={cn(
          "text-[11px] text-muted-foreground",
          wlHomeV2 ? "!px-2 !py-0.5" : "px-2 py-1",
        )}
      >
        {show.show_detail}
        {show.show_detail && show.show_alert ? <>&nbsp;&nbsp;</> : null}
        {show.show_alert ? (
          <span className="font-medium text-red-500">
            [{show.show_alert}]
          </span>
        ) : null}
      </TableCell>
    </TableRow>
  )
}
