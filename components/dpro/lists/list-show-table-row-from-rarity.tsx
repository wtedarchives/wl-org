"use client"

import Link from "next/link"
import Image from "next/image"
import { Broadcast, FileAudio } from "@phosphor-icons/react"
import { FileMusic, AudioLines } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { TableCell } from "@/components/ui/table"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import { getRarityColor as getLegacyRarityBg, getGapColor as getLegacyGapBg } from "@/lib/stats/tour-utils"
import {
  getGapColor,
  getGapPillBackground,
  getRarityColor,
  getRarityPillBackground,
} from "@/lib/setlist-utils"
import type { ListShow } from "@/hooks/use-list-show-data"
import { ListShowRatingStars } from "@/components/dpro/lists/list-show-rating-stars"
import { TourShowRowRatingStars } from "@/components/dpro/tours/tour-show-row-rating-stars"
import { TourShowsStatPill } from "@/components/dpro/tours/tour-shows-stat-pill"
import { cn } from "@/lib/utils"

export function ListShowTableRowFromRarity({
  show,
  rating,
  showsWithSetlists,
  showsWithReleases,
  attendeeCounts,
  showRarityColumn,
  showGapColumn,
  wlHomeV2,
  px,
  pxt,
  textSize,
  iconCol,
  rarityPctStr,
  gapNumeric,
}: {
  show: ListShow
  rating: number
  showsWithSetlists: Set<string>
  showsWithReleases: Set<string>
  attendeeCounts: Record<string, number>
  showRarityColumn?: boolean
  showGapColumn?: boolean
  wlHomeV2?: boolean
  px: string
  pxt: string
  textSize: string
  iconCol: string
  rarityPctStr: string | null
  gapNumeric: number
}) {
  return (
    <>
      {showRarityColumn ?
        <TableCell className={cn("text-center", px)}>
          {wlHomeV2 && rarityPctStr != null ?
            <TourShowsStatPill
              fill={getRarityPillBackground(rarityPctStr)}
              border={getRarityColor(rarityPctStr)}
            >
              {rarityPctStr}
            </TourShowsStatPill>
          : show.show_rarity ?
            <span
              className="inline-block rounded px-1.5 py-[1px] text-xs font-medium text-white"
              style={{
                backgroundColor: getLegacyRarityBg(show.show_rarity),
              }}
            >
              {show.show_rarity}
            </span>
          : null}
        </TableCell>
      : null}
      {showGapColumn ?
        <TableCell className={cn("text-center", px)}>
          {wlHomeV2 && Number.isFinite(gapNumeric) ?
            <TourShowsStatPill
              fill={getGapPillBackground(gapNumeric)}
              border={getGapColor(gapNumeric)}
            >
              {gapNumeric.toFixed(2)}
            </TourShowsStatPill>
          : show.show_gap ?
            <span
              className="inline-block rounded px-1.5 py-[1px] text-xs font-medium text-white"
              style={{
                backgroundColor: getLegacyGapBg(show.show_gap),
              }}
            >
              {show.show_gap}
            </span>
          : null}
        </TableCell>
      : null}
      <TableCell className={cn("text-left", textSize, px)}>
        {show.venue_id ?
          <Link
            href={getVenueArchiveUrl(show.venue_id)}
            className="hover:underline"
          >
            {show.show_subvenue}
          </Link>
        : (show as { show_subvenue_venue?: string }).show_subvenue_venue ?
          <Link
            href={getVenueArchiveUrl(
              (show as { show_subvenue_venue: string }).show_subvenue_venue,
            )}
            className="hover:underline"
          >
            {show.show_subvenue}
          </Link>
        : <span>{show.show_subvenue}</span>}
      </TableCell>
      <TableCell
        className={cn(
          "text-left text-muted-foreground",
          textSize,
          px,
        )}
      >
        {show.show_venue_location}
      </TableCell>
      <TableCell
        className={cn(
          "group text-center align-middle leading-none",
          px,
        )}
      >
        <div className="inline-flex items-center justify-center">
          {wlHomeV2 ?
            <TourShowRowRatingStars rating={rating} />
          : <ListShowRatingStars rating={rating} />}
        </div>
      </TableCell>
      <TableCell
        className={cn(iconCol, "text-center align-middle leading-none", pxt)}
      >
        <div className="inline-flex items-center justify-center">
          {showsWithSetlists.has(show.show_id) ?
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={getSetlistArchiveUrl(show.show_id)}
                    className={cn(
                      "inline-flex items-center justify-center rounded p-0.5",
                      wlHomeV2 ?
                        "!text-emerald-600 hover:!text-emerald-500"
                      : "text-emerald-600 hover:text-emerald-500",
                    )}
                    aria-label="View setlist"
                  >
                    {wlHomeV2 ?
                      <FileAudio className="size-3.5 shrink-0" aria-hidden />
                    : <FileMusic className="size-3.5" />}
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <span className={cn(wlHomeV2 && "text-[11px]")}>Setlist scan</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          : <span className="inline-block size-3.5" aria-hidden />}
        </div>
      </TableCell>
      <TableCell
        className={cn(iconCol, "text-center align-middle leading-none", pxt)}
      >
        <div className="inline-flex items-center justify-center">
          {showsWithReleases.has(show.show_id) ?
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={getSetlistArchiveUrl(show.show_id)}
                    className={cn(
                      "inline-flex items-center justify-center rounded p-0.5",
                      wlHomeV2 ?
                        "!text-rose-600 hover:!text-rose-500"
                      : "text-rose-600 hover:text-rose-500",
                    )}
                    aria-label="View releases"
                  >
                    {wlHomeV2 ?
                      <Broadcast className="size-3.5 shrink-0" aria-hidden />
                    : <AudioLines className="size-3.5" />}
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <span className={cn(wlHomeV2 && "text-[11px]")}>
                    Media available
                  </span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          : <span className="inline-block size-3.5" aria-hidden />}
        </div>
      </TableCell>
      <TableCell
        className={cn(
          "text-center tabular-nums align-middle",
          textSize,
          px,
        )}
      >
        {attendeeCounts[show.show_id] > 0
          ? attendeeCounts[show.show_id]
          : null}
      </TableCell>
      <TableCell
        className={cn(iconCol, "text-center align-middle leading-none", pxt)}
      >
        {show.show_wl_link ?
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
                <span className={cn("text-xs", wlHomeV2 && "text-[11px]")}>
                  Chat in the Wysteria Lane Community
                </span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        : <span className="inline-block size-3.5" aria-hidden />}
      </TableCell>
      <TableCell className={cn("text-left text-muted-foreground", textSize, px)}>
        {show.show_detail}
        {show.show_detail && show.show_alert && " "}
        {show.show_alert && (
          <span
            className={cn(
              "font-medium",
              wlHomeV2 ? "text-red-500" : "text-destructive",
            )}
          >
            [{show.show_alert}]
          </span>
        )}
      </TableCell>
    </>
  )
}
