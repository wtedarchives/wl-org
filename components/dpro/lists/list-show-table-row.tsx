"use client"

import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getTourArchiveUrl } from "@/lib/tour-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import Link from "next/link"
import Image from "next/image"
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
import { getRarityColor, getGapColor } from "@/lib/stats/tour-utils"
import { formatLengthAsHmmss } from "@/lib/setlist-utils"
import type { User } from "@supabase/supabase-js"
import type { ListShow } from "@/hooks/use-list-show-data"
import { formatListShowTableDate } from "@/components/dpro/lists/list-show-table-utils"
import { ListShowRatingStars } from "@/components/dpro/lists/list-show-rating-stars"

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
  user: User | null
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
  user,
}: ListShowTableRowProps) {
  const displayRank = (show as { displayRank?: number }).displayRank

  return (
    <TableRow
      className={index % 2 === 0 ? "bg-background/70" : "bg-background"}
    >
      {showRanking && (
        <TableCell className="px-2 py-1 text-center text-xs font-medium tabular-nums">
          {displayRank ?? ""}
        </TableCell>
      )}
      <TableCell className="whitespace-nowrap px-2 py-1 text-center text-xs font-medium tabular-nums">
        <Link
          href={getSetlistArchiveUrl(show.show_id)}
          className="hover:underline"
        >
          {formatListShowTableDate(show.show_date)}
        </Link>
      </TableCell>
      {user && (
        <TableCell className="w-[28px] px-1 py-1 text-center align-middle">
          {attendedShowIds.includes(show.show_id) ? (
            <div className="inline-flex rounded-full bg-emerald-600 p-0.5">
              <Check className="size-3 text-white" strokeWidth={3} />
            </div>
          ) : (
            <span className="inline-block size-3" aria-hidden />
          )}
        </TableCell>
      )}
      {showCategoryColumn && categoryArtwork && show.show_listcategorycomplete && (
        <TableCell className="min-w-12 w-12 px-1 py-1 text-center align-middle">
          {categoryArtwork[show.show_listcategorycomplete] ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <img
                      src={categoryArtwork[show.show_listcategorycomplete]}
                      alt={show.show_listcategorycomplete}
                      className="mx-auto size-5 rounded object-cover border border-border"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display =
                          "none"
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
          ) : null}
        </TableCell>
      )}
      <TableCell className="px-2 py-1 text-xs">
        {show.tour_id ? (
          <Link
            href={getTourArchiveUrl(show.tour_id)}
            className="hover:underline"
          >
            {show.show_tour}
          </Link>
        ) : (
          <span>{show.show_tour}</span>
        )}
      </TableCell>
      <TableCell className="px-2 py-1 text-center text-xs tabular-nums">
        {show.show_length && show.show_length !== "-"
          ? formatLengthAsHmmss(show.show_length) ?? ""
          : ""}
      </TableCell>
      <TableCell className="px-2 py-1 text-center">
        {show.show_rarity ? (
          <span
            className="inline-block rounded px-1.5 py-[1px] text-xs font-medium text-white"
            style={{
              backgroundColor: getRarityColor(show.show_rarity),
            }}
          >
            {show.show_rarity}
          </span>
        ) : null}
      </TableCell>
      <TableCell className="px-2 py-1 text-center">
        {show.show_gap ? (
          <span
            className="inline-block rounded px-1.5 py-[1px] text-xs font-medium text-white"
            style={{
              backgroundColor: getGapColor(show.show_gap),
            }}
          >
            {show.show_gap}
          </span>
        ) : null}
      </TableCell>
      <TableCell className="px-2 py-1 text-xs">
        {show.venue_id ? (
          <Link
            href={getVenueArchiveUrl(show.venue_id)}
            className="hover:underline"
          >
            {show.show_subvenue}
          </Link>
        ) : (show as { show_subvenue_venue?: string }).show_subvenue_venue ? (
          <Link
            href={getVenueArchiveUrl(
              (show as { show_subvenue_venue: string }).show_subvenue_venue,
            )}
            className="hover:underline"
          >
            {show.show_subvenue}
          </Link>
        ) : (
          <span>{show.show_subvenue}</span>
        )}
      </TableCell>
      <TableCell className="px-2 py-1 text-xs text-muted-foreground">
        {show.show_venue_location}
      </TableCell>
      <TableCell className="group px-2 py-1 text-center align-middle">
        <div className="flex justify-center">
          <ListShowRatingStars rating={rating} />
        </div>
      </TableCell>
      <TableCell className="w-[28px] px-1 py-1 text-center align-middle">
        {showsWithSetlists.has(show.show_id) ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={getSetlistArchiveUrl(show.show_id)}
                  className="inline-flex rounded p-0.5 text-emerald-600 hover:text-emerald-500"
                >
                  <FileMusic className="size-3.5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>Setlist scan</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </TableCell>
      <TableCell className="w-[28px] px-1 py-1 text-center align-middle">
        {showsWithReleases.has(show.show_id) ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={getSetlistArchiveUrl(show.show_id)}
                  className="inline-flex rounded p-0.5 text-rose-600 hover:text-rose-500"
                >
                  <AudioLines className="size-3.5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>Media available</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </TableCell>
      <TableCell className="px-2 py-1 text-center text-xs align-middle">
        {attendeeCounts[show.show_id] > 0
          ? attendeeCounts[show.show_id]
          : null}
      </TableCell>
      <TableCell className="w-[28px] px-1 py-1 text-center align-middle">
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
      </TableCell>
      <TableCell className="px-2 py-1 text-xs">
        {show.show_detail}
        {show.show_detail && show.show_alert && " "}
        {show.show_alert && (
          <span className="font-medium text-destructive">
            [{show.show_alert}]
          </span>
        )}
      </TableCell>
    </TableRow>
  )
}
