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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import type { LiberatedSong } from "@/lib/types/stats"
import { formatDate, extractShowCount } from "@/lib/stats/stats-formatting"
import { formatVenueLocationWithBrackets } from "@/lib/format-venue-location-brackets"
import { formatEntryLength } from "@/lib/setlist-utils"
import { getLastCountPillStyle } from "@/components/dpro/setlist/display-setlist-table.constants"
import { LiberatedSongLibTooltip } from "@/components/dpro/tours/liberated-songs"
import { toursStatsDurationTdClassnames } from "@/components/dpro/tours/tours-stats-table-classes"
import { cn } from "@/lib/utils"

function formatStatsRowDate(dateStr?: string | null): string {
  if (!dateStr) return ""
  return dateStr.includes("-") ? formatDate(dateStr) : dateStr
}

interface LiberatedSongsCardProps {
  items: LiberatedSong[]
  showEmptyState?: boolean
  /** Match tour `LiberatedSongs` wlHomeV2 (`wl-home-v2-tours-stats-table` + `.last-pill` LIB). */
  wlHomeV2?: boolean
}

const LIB_TOOLTIP = (
  <>
    LIB <span className="font-normal">(Song Liberation)</span>
    <br />
    <span className="font-normal opacity-90">
      Song returned after a full calendar year of not being played.
    </span>
  </>
)

export function LiberatedSongsCard({
  items,
  showEmptyState = false,
  wlHomeV2 = false,
}: LiberatedSongsCardProps) {
  const mutedRow = "text-white/88"
  const showDurationColumn = items.some(
    (s) => formatEntryLength(s.entry_length ?? null) !== "",
  )

  const tourStyleTable =
    items.length === 0 ? null : (
      <div className="min-w-0 overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-[11px] leading-3 wl-home-v2-tours-stats-table">
          <tbody>
            {items.map((song, index) => {
              const showLibBadge =
                !!song.last_count?.toUpperCase().includes("LIB")
              const wlLibPillStyles =
                showLibBadge ? getLastCountPillStyle("LIB") : null
              return (
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
                      <div className="flex shrink-0 items-center gap-1">
                        {showLibBadge && wlLibPillStyles ?
                          <LiberatedSongLibTooltip>
                            <span
                              className="last-pill cursor-help"
                              style={{
                                backgroundColor: wlLibPillStyles.background,
                                color: wlLibPillStyles.color,
                                border: `1px solid ${wlLibPillStyles.borderColor}`,
                              }}
                            >
                              LIB
                            </span>
                          </LiberatedSongLibTooltip>
                        : null}
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
                    </div>
                  </td>
                  {showDurationColumn ?
                    <td
                      className={toursStatsDurationTdClassnames(
                        true,
                        mutedRow,
                      )}
                    >
                      {formatEntryLength(song.entry_length ?? null)}
                    </td>
                  : null}
                  <td
                    className={cn(
                      "text-muted-foreground",
                      "wl-home-v2-tours-stats-cell wl-home-v2-tours-stats-cell--meta",
                    )}
                  >
                    {song.show_date ?
                      <>
                        <span className="text-muted-foreground">Returned </span>
                        {song.show_id ?
                          <Link
                            href={getSetlistArchiveUrl(song.show_id)}
                            className="font-medium text-white/80 hover:underline"
                          >
                            {formatStatsRowDate(song.show_date)}
                          </Link>
                        : <span className="text-white/88">
                            {formatStatsRowDate(song.show_date)}
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
                  <td
                    className={cn(
                      "whitespace-nowrap text-muted-foreground",
                      "wl-home-v2-tours-stats-cell wl-home-v2-tours-stats-cell--trail",
                    )}
                  >
                    {song.last_show_date ?
                      <>
                        <span className="text-muted-foreground">LTP </span>
                        {song.last_show_id ?
                          <Link
                            href={getSetlistArchiveUrl(song.last_show_id)}
                            className="font-medium text-white/80 hover:underline"
                          >
                            {formatStatsRowDate(song.last_show_date)}
                          </Link>
                        : <span className="text-white/88">
                            {formatStatsRowDate(song.last_show_date)}
                          </span>
                        }
                        {extractShowCount(song.last_count) ?
                          <span className="text-white/46">
                            {" "}
                            ({extractShowCount(song.last_count)} shows)
                          </span>
                        : null}
                      </>
                    : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )

  return (
    <Card className="overflow-hidden py-0">
      <CardHeader className="bg-yellow-600 py-2">
        <CardTitle className="text-sm font-medium">
          Top Returning Songs
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 && showEmptyState ?
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
        : wlHomeV2 ?
          tourStyleTable
        : (
          <Table
            className={cn(
              "min-w-max w-max caption-bottom",
              "text-xs",
            )}
          >
            <TableBody>
              {items.map((song, index) => (
                <TableRow key={`${song.song}-${index}`}>
                  <TableCell className="w-min shrink-0 py-1.5 pl-3">
                    <Link
                      href={getSongArchiveUrl(song.song_id)}
                      className="whitespace-nowrap text-xs font-medium text-foreground hover:underline"
                    >
                      <SongDisplayName
                        song={song.song}
                        songDisplayName={song.song_displayname}
                      />
                    </Link>
                  </TableCell>
                  <TableCell className="w-min shrink-0 py-0.5 pl-0 pr-2 text-center">
                    {song.last_count &&
                    song.last_count.toUpperCase().includes("LIB") ?
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex shrink-0 cursor-default items-center justify-center rounded-full bg-yellow-600 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm">
                              LIB
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="max-w-[180px] text-xs"
                          >
                            {LIB_TOOLTIP}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    : (
                      <span className="inline-block size-0" aria-hidden />
                    )}
                  </TableCell>
                  <TableCell className="w-min shrink-0 py-0.5 pl-0 pr-2">
                    {song.category_artwork ?
                      <Image
                        src={song.category_artwork}
                        alt=""
                        width={16}
                        height={16}
                        className="size-5 shrink-0 rounded border border-border object-cover"
                        unoptimized
                        onError={(e) => {
                          const el = e.target as HTMLImageElement
                          if (el) el.style.display = "none"
                        }}
                      />
                    : (
                      <span className="inline-block size-4" aria-hidden />
                    )}
                  </TableCell>
                  <TableCell className="py-1.5 pl-2 text-xs text-muted-foreground">
                    {song.show_date && (
                      <>
                        <span className="font-normal">Returned </span>
                        {song.show_id ?
                          <Link
                            href={getSetlistArchiveUrl(song.show_id)}
                            className="font-medium text-foreground hover:underline"
                          >
                            {formatDate(song.show_date)}
                          </Link>
                        : (
                          <span className="font-medium">
                            {formatDate(song.show_date)}
                          </span>
                        )}
                        {song.venue_location && (
                          <span className="text-muted-foreground/70">
                            {" "}
                            {formatVenueLocationWithBrackets(
                              song.venue_location,
                            )}
                          </span>
                        )}
                      </>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-1.5 pl-2 text-xs text-muted-foreground">
                    {song.last_show_date && (
                      <>
                        <span className="font-normal">LTP </span>
                        {song.last_show_id ?
                          <Link
                            href={getSetlistArchiveUrl(song.last_show_id)}
                            className="font-medium text-foreground hover:underline"
                          >
                            {formatStatsRowDate(song.last_show_date)}
                          </Link>
                        : (
                          <span className="font-medium">
                            {formatStatsRowDate(song.last_show_date)}
                          </span>
                        )}
                        {extractShowCount(song.last_count) && (
                          <span className="text-muted-foreground/70">
                            {" "}
                            ({extractShowCount(song.last_count)} shows)
                          </span>
                        )}
                      </>
                    )}
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
