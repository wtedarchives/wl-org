"use client"

import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import Link from "next/link"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatEntryLength } from "@/lib/setlist-utils"
import type { SongWithGuest } from "@/hooks/use-guest-appearances"
import { cn } from "@/lib/utils"

export function formatGuestAppearanceShowDate(dateStr: string): string {
  if (!dateStr) return ""
  const parts = dateStr.split("-")
  if (parts.length >= 3) {
    return `${parts[1]}.${parts[2]}.${parts[0].slice(2)}`
  }
  return dateStr
}

interface GuestAppearancesDetailTableProps {
  songs: SongWithGuest[]
  onNavigate?: () => void
  /** WL setlist-song modal: `set-table` + inherited modal CSS. */
  variant?: "drawer" | "wl-modal"
}

export function GuestAppearancesDetailTable({
  songs,
  onNavigate,
  variant = "drawer",
}: GuestAppearancesDetailTableProps) {
  const isWlModal = variant === "wl-modal"

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
              "whitespace-nowrap py-2 text-left font-medium text-[11px] pr-4",
              isWlModal && "align-middle",
            )}
          >
            Song
          </TableHead>
          <TableHead
            className={cn(
              "whitespace-nowrap py-2 px-2 text-center font-medium text-[11px]",
              isWlModal ? "center align-middle" : "",
            )}
          >
            Show
          </TableHead>
          <TableHead
            className={cn(
              "whitespace-nowrap py-2 px-2 text-left font-medium text-[11px]",
              isWlModal ? "align-middle" : "",
            )}
          >
            Location
          </TableHead>
          <TableHead
            className={cn(
              "w-[4.5rem] shrink-0 py-2 px-2 text-left font-medium text-[11px]",
              isWlModal ? "align-middle" : "",
            )}
          >
            &nbsp;
          </TableHead>
          <TableHead
            className={cn(
              "whitespace-nowrap py-2 pl-2 text-center font-medium tabular-nums text-[11px]",
              isWlModal ? "center align-middle" : "",
            )}
          >
            Length
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {songs.map((song) => (
          <TableRow
            key={`${song.show_id}-${song.entry_song}`}
            className={cn(
              "align-middle",
              isWlModal && "song-row",
            )}
          >
            <TableCell
              className={cn(
                "align-middle py-1.5 pr-4 font-medium text-[11px]",
                isWlModal ?
                  "align-middle text-[13px]"
                : "",
              )}
            >
              <SongDisplayName
                song={song.entry_song}
                songDisplayName={song.song_displayname}
              />
            </TableCell>
            <TableCell
              className={cn(
                "align-middle px-2 py-1.5 text-center whitespace-nowrap text-[11px]",
                isWlModal ? "center align-middle text-[13px]" : "",
              )}
            >
              <Link
                href={getSetlistArchiveUrl(song.show_id)}
                onClick={() => onNavigate?.()}
                className={cn(
                  "font-medium hover:underline",
                  isWlModal && "text-inherit",
                )}
              >
                {formatGuestAppearanceShowDate(song.show_date)}
              </Link>
            </TableCell>
            <TableCell
              className={cn(
                "align-middle px-2 py-1.5 whitespace-nowrap text-[11px] text-muted-foreground",
                isWlModal ? "align-middle text-[13px]" : "",
              )}
            >
              {song.show_venue_location}
            </TableCell>
            <TableCell
              className={cn(
                "w-[4.5rem] shrink-0 align-middle px-2 py-1.5 text-left text-[11px]",
                isWlModal ? "align-middle text-[13px]" : "",
              )}
            >
              <span className="inline-flex items-center gap-2">
                {song.entry_short && (
                  <span className="font-medium text-red-400">
                    [{song.entry_short}]
                  </span>
                )}
                {song.entry_segue && (
                  <span className="text-red-400">→</span>
                )}
              </span>
            </TableCell>
            <TableCell
              className={cn(
                "align-middle py-1.5 pl-2 text-center whitespace-nowrap tabular-nums text-[11px] text-muted-foreground",
                isWlModal ? "center align-middle text-[13px]" : "",
              )}
            >
              {formatEntryLength(song.entry_length) || ""}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
