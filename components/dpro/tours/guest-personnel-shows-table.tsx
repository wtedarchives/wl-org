"use client"

import Link from "next/link"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getTourArchiveUrl } from "@/lib/tour-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatSetlistDate } from "@/lib/setlist-utils"
import type { GuestPersonnelShowRow } from "@/lib/guest-appearance-detail-fetch"
import { cn } from "@/lib/utils"

interface GuestPersonnelShowsTableProps {
  shows: GuestPersonnelShowRow[]
  onNavigate?: () => void
  variant?: "drawer" | "wl-modal"
}

export function GuestPersonnelShowsTable({
  shows,
  onNavigate,
  variant = "wl-modal",
}: GuestPersonnelShowsTableProps) {
  const isWlModal = variant === "wl-modal"

  if (shows.length === 0) {
    return (
      <p
        className={cn(
          "py-6 text-center text-[11px]",
          isWlModal ? "text-white/55" : "text-muted-foreground",
        )}
      >
        No matching attended shows.
      </p>
    )
  }

  return (
    <Table
      className={cn(
        "min-w-max text-[11px]",
        isWlModal ?
          "set-table"
        : "min-w-full border-separate border-spacing-y-0.25",
      )}
    >
      <TableHeader>
        <TableRow
          className={cn(
            !isWlModal && "border-b border-border/60 hover:bg-transparent",
          )}
        >
          <TableHead
            className={cn(
              "whitespace-nowrap py-2 text-left font-medium text-[11px] pr-3",
              isWlModal && "align-middle",
            )}
          >
            Date
          </TableHead>
          <TableHead
            className={cn(
              "whitespace-nowrap py-2 px-2 text-left font-medium text-[11px]",
              isWlModal && "align-middle",
            )}
          >
            Venue
          </TableHead>
          <TableHead
            className={cn(
              "whitespace-nowrap py-2 px-2 text-left font-medium text-[11px]",
              isWlModal && "align-middle",
            )}
          >
            Location
          </TableHead>
          <TableHead
            className={cn(
              "whitespace-nowrap py-2 pl-2 text-left font-medium text-[11px]",
              isWlModal && "align-middle",
            )}
          >
            Tour
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shows.map((show) => (
          <TableRow
            key={show.show_id}
            className={cn("align-middle", isWlModal && "song-row")}
          >
            <TableCell
              className={cn(
                "align-middle py-1.5 pr-3 whitespace-nowrap text-[11px]",
                isWlModal && "align-middle text-[13px]",
              )}
            >
              <Link
                href={getSetlistArchiveUrl(show.show_id)}
                onClick={() => onNavigate?.()}
                className={cn(
                  "font-medium hover:underline",
                  isWlModal && "text-inherit",
                )}
              >
                {formatSetlistDate(show.show_date)}
              </Link>
            </TableCell>
            <TableCell
              className={cn(
                "align-middle px-2 py-1.5 text-[11px]",
                isWlModal ? "align-middle text-[13px]" : "text-muted-foreground",
              )}
            >
              {show.venue_id ? (
                <Link
                  href={getVenueArchiveUrl(show.venue_id)}
                  onClick={() => onNavigate?.()}
                  className={cn(
                    "hover:underline",
                    isWlModal && "text-inherit",
                  )}
                >
                  {show.show_subvenue}
                </Link>
              ) : show.show_subvenue_venue ? (
                <Link
                  href={getVenueArchiveUrl(show.show_subvenue_venue)}
                  onClick={() => onNavigate?.()}
                  className={cn(
                    "hover:underline",
                    isWlModal && "text-inherit",
                  )}
                >
                  {show.show_subvenue}
                </Link>
              ) : (
                <span>{show.show_subvenue}</span>
              )}
            </TableCell>
            <TableCell
              className={cn(
                "align-middle px-2 py-1.5 text-[11px]",
                isWlModal ? "align-middle text-[13px]" : "text-muted-foreground",
              )}
            >
              {show.show_venue_location}
            </TableCell>
            <TableCell
              className={cn(
                "align-middle py-1.5 pl-2 text-[11px]",
                isWlModal ? "align-middle text-[13px]" : "text-muted-foreground",
              )}
            >
              {show.tour_id ?
                <Link
                  href={getTourArchiveUrl(show.tour_id)}
                  onClick={() => onNavigate?.()}
                  className={cn(
                    "hover:underline",
                    isWlModal && "text-inherit",
                  )}
                >
                  {show.show_tour ?? ""}
                </Link>
              : (show.show_tour ?? "")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
