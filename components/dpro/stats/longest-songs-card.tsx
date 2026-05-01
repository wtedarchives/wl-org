"use client"

import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import Link from "next/link"
import Image from "next/image"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"
import type { LongestSong } from "@/lib/types/stats"
import { formatTime, formatDate } from "@/lib/stats/stats-formatting"
import { formatEntryLength } from "@/lib/setlist-utils"
import { formatVenueLocationWithBrackets } from "@/lib/format-venue-location-brackets"
import { cn } from "@/lib/utils"
import { toursStatsDurationTdClassnames } from "@/components/dpro/tours/tours-stats-table-classes"

interface LongestSongsCardProps {
  items: LongestSong[]
  showEmptyState?: boolean
  /** Match tour `LongestSongs` wlHomeV2 (`wl-home-v2-tours-stats-table` + cell layout). */
  wlHomeV2?: boolean
}

export function LongestSongsCard({
  items,
  showEmptyState = false,
  wlHomeV2 = false,
}: LongestSongsCardProps) {
  const mutedRow = "text-white/88"

  const tourStyleTable =
    items.length === 0 ? null : (
      <div className="min-w-0 overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-[11px] leading-3 wl-home-v2-tours-stats-table">
          <tbody>
            {items.map((song, index) => (
              <tr
                key={`${song.song}-${index}`}
                className={cn(
                  "transition-colors",
                  "border-b border-[rgb(34,37,35)] bg-transparent hover:bg-[rgba(88,200,174,0.11)] [&:last-child]:border-b-0",
                )}
              >
                <td
                  className={cn(
                    "wl-home-v2-tours-stats-cell wl-home-v2-tours-stats-cell--song",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={getSongArchiveUrl(song.song_id)}
                      className="cursor-pointer text-left font-medium text-white/88 hover:underline"
                    >
                      <SongDisplayName
                        song={song.song}
                        songDisplayName={song.song_displayname}
                      />
                    </Link>
                    {song.category_artwork ?
                      <img
                        src={song.category_artwork}
                        alt=""
                        className="size-5 shrink-0 rounded border border-[rgb(63,65,64)] object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display =
                            "none"
                        }}
                      />
                    : null}
                  </div>
                </td>
                <td
                  className={toursStatsDurationTdClassnames(true, mutedRow)}
                >
                  {formatEntryLength(song.entry_length)}
                </td>
                <td
                  className={cn(
                    "text-muted-foreground",
                    "wl-home-v2-tours-stats-cell wl-home-v2-tours-stats-cell--meta",
                  )}
                >
                  {song.show_date ?
                    <>
                      {song.show_id ?
                        <Link
                          href={getSetlistArchiveUrl(song.show_id)}
                          className="font-medium text-white/80 hover:underline"
                        >
                          {formatDate(song.show_date)}
                        </Link>
                      : <span className="text-white/88">
                          {formatDate(song.show_date)}
                        </span>
                      }
                      {song.venue_location ?
                        <span className="text-white/46">
                          {" "}
                          {formatVenueLocationWithBrackets(
                            song.venue_location,
                          )}
                        </span>
                      : null}
                    </>
                  : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )

  return (
    <Card className="overflow-hidden py-0">
      <CardHeader className="bg-gray-500 py-2">
        <CardTitle className="text-sm font-medium">Longest Songs</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 && showEmptyState ? (
          <div
            className={cn(
              "px-3 py-4 text-center text-xs",
              wlHomeV2 ?
                "text-white/55"
              : "text-muted-foreground",
            )}
          >
            No data to display for this year.
          </div>
        ) : wlHomeV2 ?
          tourStyleTable
        : (
          <Table
            className="min-w-full w-max max-w-none caption-bottom text-xs"
          >
            <TableBody>
              {items.map((song, index) => (
                <TableRow key={`${song.song}-${index}`}>
                  <TableCell className="whitespace-nowrap py-1.5 pl-3 pr-2 align-middle">
                    <Link
                      href={getSongArchiveUrl(song.song_id)}
                      className="inline-block max-w-none whitespace-nowrap text-xs font-medium text-foreground hover:underline"
                    >
                      <SongDisplayName
                        song={song.song}
                        songDisplayName={song.song_displayname}
                        className="max-w-none min-w-max whitespace-nowrap"
                      />
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-0.5 pr-1 text-center align-middle">
                    {song.category_artwork ?
                      <Image
                        src={song.category_artwork}
                        alt=""
                        width={16}
                        height={16}
                        className="mx-auto size-5 shrink-0 rounded border border-border object-cover"
                        unoptimized
                        onError={(e) => {
                          const el = e.target as HTMLImageElement
                          if (el) el.style.display = "none"
                        }}
                      />
                    : (
                      <span
                        className="mx-auto inline-block size-5"
                        aria-hidden
                      />
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-1.5 pl-1 pr-2 align-middle text-xs text-muted-foreground">
                    {song.show_date && (
                      <>
                        {song.show_id ?
                          <Link
                            href={getSetlistArchiveUrl(song.show_id)}
                            className="whitespace-nowrap font-medium text-foreground hover:underline"
                          >
                            {formatDate(song.show_date)}
                          </Link>
                        : (
                          <span className="whitespace-nowrap font-medium">
                            {formatDate(song.show_date)}
                          </span>
                        )}
                        {song.venue_location && (
                          <span className="whitespace-nowrap text-muted-foreground/70">
                            {" "}
                            {formatVenueLocationWithBrackets(
                              song.venue_location,
                            )}
                          </span>
                        )}
                      </>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-1.5 pr-3 text-right align-middle text-xs text-muted-foreground">
                    <span className="font-medium tabular-nums text-foreground">
                      {formatTime(song.entry_length)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
