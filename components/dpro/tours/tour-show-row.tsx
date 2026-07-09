"use client"

import { formatTourShowDate } from "@/components/dpro/tours/tour-show-format"
import { TourShowsStatPill } from "@/components/dpro/tours/tour-shows-stat-pill"
import { TourShowRowRatingStars } from "@/components/dpro/tours/tour-show-row-rating-stars"
import {
  Broadcast,
  Check,
  FileAudio,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-context"
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
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
import Image from "next/image"
import Link from "next/link"

export interface TourShowRowProps {
  show: TourShow
  index: number
  attendeeCounts: Record<string, number>
  showRatings: Record<string, number>
  showsWithSetlists: Set<string>
  showsWithReleases: Set<string>
  showsWithRadioIds: Set<string>
  showRarityColumn?: boolean
  showGapColumn?: boolean
  wlHomeV2?: boolean
}

export function TourShowRow({
  show,
  index,
  attendeeCounts,
  showRatings,
  showsWithSetlists,
  showsWithReleases,
  showsWithRadioIds,
  showRarityColumn = true,
  showGapColumn = true,
  wlHomeV2 = false,
}: TourShowRowProps) {
  const { session } = useAuth()
  const rating = showRatings[show.show_id] ?? 0
  const attendeeCount = attendeeCounts[show.show_id] ?? 0

  const rarityNumeric =
    show.show_rarity != null && String(show.show_rarity).trim() !== ""
      ? Number.parseFloat(
          String(show.show_rarity).replace(/%/g, "").trim(),
        )
      : NaN
  const gapNumeric =
    show.show_gap != null && String(show.show_gap).trim() !== ""
      ? Number.parseFloat(String(show.show_gap).trim())
      : NaN

  const rarityPctStr = Number.isFinite(rarityNumeric)
    ? `${rarityNumeric.toFixed(2)}%`
    : null

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
      <TableCell
        className={cn(
          "w-[32px] text-center align-middle leading-none",
          wlHomeV2 ? "!px-1 !py-0.5" : "px-1 py-1",
        )}
      >
        <div className="inline-flex items-center justify-center">
          {showsWithSetlists.has(show.show_id) ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ArchivePrefetchLink
                    href={getSetlistArchiveUrl(show.show_id)}
                    aria-label="View setlist"
                    className="inline-flex items-center justify-center rounded p-0.5 text-emerald-600 hover:text-emerald-500"
                  >
                    <FileAudio className="size-3.5" aria-hidden />
                  </ArchivePrefetchLink>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <span className="text-[11px]">Setlist scan</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="inline-block size-3.5" aria-hidden />
          )}
        </div>
      </TableCell>
      <TableCell
        className={cn(
          "w-[32px] text-center align-middle leading-none",
          wlHomeV2 ? "!px-1 !py-0.5" : "px-1 py-1",
        )}
      >
        <div className="inline-flex items-center justify-center">
          {showsWithReleases.has(show.show_id) ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ArchivePrefetchLink
                    href={getSetlistArchiveUrl(show.show_id)}
                    aria-label="View releases"
                    className="inline-flex items-center justify-center rounded p-0.5 text-rose-600 hover:text-rose-500"
                  >
                    <Broadcast className="size-3.5" aria-hidden />
                  </ArchivePrefetchLink>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <span className="text-[11px]">Media available</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="inline-block size-3.5" aria-hidden />
          )}
        </div>
      </TableCell>
      <TableCell
        className={cn(
          "w-[32px] text-center align-middle text-[11px] font-medium leading-none",
          wlHomeV2 ? "!px-1 !py-0.5" : "px-1 py-1",
        )}
      >
        <div className="inline-flex items-center justify-center">
          {attendeeCount > 0 ? attendeeCount : ""}
        </div>
      </TableCell>
      <TableCell
        className={cn(
          "w-[32px] text-center align-middle leading-none",
          wlHomeV2 ? "!px-1 !py-0.5" : "px-1 py-1",
        )}
      >
        <div className="inline-flex items-center justify-center">
          {show.show_wl_link ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={show.show_wl_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Wysteria Lane article"
                    className="inline-flex items-center justify-center rounded hover:opacity-90"
                  >
                    <Image
                      src="/WL.png"
                      alt="Wysteria Lane"
                      width={14}
                      height={14}
                      className="h-3.5 w-auto block"
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <span className="text-[11px]">
                    Chat in the Wysteria Lane Community
                  </span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="inline-block size-3.5" aria-hidden />
          )}
        </div>
      </TableCell>
      <TableCell
        className={cn(
          "w-[32px] text-center align-middle leading-none",
          wlHomeV2 ? "!px-1 !py-0.5" : "px-1 py-1",
        )}
      >
        <div className="inline-flex items-center justify-center">
          {showsWithRadioIds.has(show.show_id) ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ArchivePrefetchLink
                    href={getSetlistArchiveUrl(show.show_id)}
                    aria-label="WTED Goose Radio"
                    className="inline-flex items-center justify-center rounded hover:opacity-90"
                  >
                    <Image
                      src="/WTED2.png"
                      alt="WTED Goose Radio"
                      width={14}
                      height={14}
                      className="h-3.5 w-auto block"
                    />
                  </ArchivePrefetchLink>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <span className="text-[11px]">WTED Goose Radio</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="inline-block size-3.5" aria-hidden />
          )}
        </div>
      </TableCell>
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
