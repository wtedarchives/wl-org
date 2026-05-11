"use client"

import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getTourArchiveUrl } from "@/lib/tour-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import Link from "next/link"
import Image from "next/image"
import { Broadcast, Check as PhosphorCheck, FileAudio } from "@phosphor-icons/react"
import { Check, FileMusic, AudioLines } from "lucide-react"
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
import { getRarityColor as getLegacyRarityBg, getGapColor as getLegacyGapBg } from "@/lib/stats/tour-utils"
import {
  formatLengthAsHmmss,
  getGapColor,
  getGapPillBackground,
  getRarityColor,
  getRarityPillBackground,
} from "@/lib/setlist-utils"
import type { WysteriaSession } from "@/lib/jwt"
import type { ListShow } from "@/hooks/use-list-show-data"
import { formatListShowTableDate } from "@/components/dpro/lists/list-show-table-utils"
import { ListShowRatingStars } from "@/components/dpro/lists/list-show-rating-stars"
import { TourShowRowRatingStars } from "@/components/dpro/tours/tour-show-row-rating-stars"
import { TourShowsStatPill } from "@/components/dpro/tours/tour-shows-stat-pill"
import { cn } from "@/lib/utils"

export interface ListShowTableRowProps {
  show: ListShow
  index: number
  rating: number
  attendedShowIds: string[]
  showsWithSetlists: Set<string>
  showsWithReleases: Set<string>
  attendeeCounts: Record<string, number>
  categoryArtwork?: Record<string, string>
  showCategoryColumn?: boolean
  showRanking?: boolean
  showRarityColumn?: boolean
  showGapColumn?: boolean
  wlHomeV2?: boolean
  user: WysteriaSession | null
}

export function ListShowTableRow({
  show,
  index,
  rating,
  attendedShowIds,
  showsWithSetlists,
  showsWithReleases,
  attendeeCounts,
  categoryArtwork,
  showCategoryColumn,
  showRanking,
  showRarityColumn = true,
  showGapColumn = true,
  wlHomeV2 = false,
  user,
}: ListShowTableRowProps) {
  const displayRank = (show as { displayRank?: number }).displayRank

  const px = wlHomeV2 ? "!px-2 !py-0.5" : "px-2 py-1"
  const pxt = wlHomeV2 ? "!px-1 !py-0.5" : "px-1 py-1"
  const textSize = wlHomeV2 ? "text-[11px]" : "text-xs"

  const rarityPctStr =
    show.show_rarity != null && String(show.show_rarity).trim() !== "" ?
      String(show.show_rarity).trim()
    : null

  const gapNumeric =
    show.show_gap != null && String(show.show_gap).trim() !== "" ?
      Number.parseFloat(String(show.show_gap).trim())
    : NaN

  const iconCol = wlHomeV2 ? "w-[32px]" : "w-[28px]"

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
      {showRanking && (
        <TableCell
          className={cn(
            "text-center font-medium tabular-nums",
            textSize,
            px,
          )}
        >
          {displayRank ?? ""}
        </TableCell>
      )}
      <TableCell
        className={cn(
          "whitespace-nowrap text-center font-medium tabular-nums",
          textSize,
          px,
        )}
      >
        <Link href={getSetlistArchiveUrl(show.show_id)} className="hover:underline">
          {formatListShowTableDate(show.show_date)}
        </Link>
      </TableCell>
      {user && (
        <TableCell
          className={cn(
            "w-[32px] text-center align-middle leading-none",
            pxt,
          )}
        >
          <div className="inline-flex items-center justify-center">
            {attendedShowIds.includes(show.show_id) ?
              <div
                className={cn(
                  "inline-flex items-center justify-center rounded-full bg-emerald-600",
                  wlHomeV2 ? "size-4" : "p-0.5",
                )}
              >
                {wlHomeV2 ?
                  <PhosphorCheck
                    className="size-3 text-white"
                    weight="bold"
                    aria-hidden
                  />
                : <Check className="size-3 text-white" strokeWidth={3} />}
              </div>
            : <span
                className={cn("inline-block", wlHomeV2 ? "size-4" : "size-3")}
                aria-hidden
              />
            }
          </div>
        </TableCell>
      )}
      {showCategoryColumn && categoryArtwork && show.show_listcategorycomplete && (
        <TableCell
          className={cn(
            "list-show-table__art-cell min-w-12 w-12",
            pxt,
          )}
        >
          <div className="list-show-table__art-cell-inner">
            {categoryArtwork[show.show_listcategorycomplete] ?
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center justify-center">
                      <img
                        src={categoryArtwork[show.show_listcategorycomplete]}
                        alt={show.show_listcategorycomplete}
                        className="list-show-table__category-thumb mx-auto size-5 rounded object-cover border border-border"
                        onError={(e) => {
                          e.currentTarget.classList.add(
                            "list-show-table__category-thumb--failed",
                          )
                        }}
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    sideOffset={4}
                    className="max-w-[200px]"
                  >
                    <span className="text-xs">
                      {show.show_listcategorycomplete}
                    </span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            : null}
          </div>
        </TableCell>
      )}
      <TableCell className={cn("text-left", textSize, px)}>
        {show.tour_id ?
          <Link
            href={getTourArchiveUrl(show.tour_id)}
            className="hover:underline"
          >
            {show.show_tour}
          </Link>
        : <span>{show.show_tour}</span>}
      </TableCell>
      <TableCell
        className={cn("text-center tabular-nums", textSize, px)}
      >
        {show.show_length && show.show_length !== "-" ?
          formatLengthAsHmmss(show.show_length) ?? ""
        : ""}
      </TableCell>
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
    </TableRow>
  )
}
