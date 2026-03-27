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

interface LiberatedSongsCardProps {
  items: LiberatedSong[]
  showEmptyState?: boolean
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
}: LiberatedSongsCardProps) {
  return (
    <Card className="overflow-hidden py-0">
      <CardHeader className="bg-yellow-600 py-2">
        <CardTitle className="text-sm font-medium">
          Top Returning Songs
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 && showEmptyState ? (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">
            No data to display for this year.
          </div>
        ) : (
          <Table className="min-w-max w-max">
            <TableBody>
              {items.map((song, index) => (
                <TableRow key={`${song.song}-${index}`}>
                  <TableCell className="w-min shrink-0 py-1.5 pl-3">
                    <Link
                      href={getSongArchiveUrl(song.song_id)}
                      className="text-xs font-medium text-foreground hover:underline whitespace-nowrap"
                    >
                      <SongDisplayName
                        song={song.song}
                        songDisplayName={song.song_displayname}
                      />
                    </Link>
                  </TableCell>
                  <TableCell className="w-min shrink-0 py-0.5 pl-0 pr-2 text-center">
                    {song.last_count &&
                    song.last_count.toUpperCase().includes("LIB") ? (
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
                    ) : (
                      <span className="inline-block size-0" aria-hidden />
                    )}
                  </TableCell>
                  <TableCell className="w-min shrink-0 py-0.5 pl-0 pr-2">
                    {song.category_artwork ? (
                      <Image
                        src={song.category_artwork}
                        alt=""
                        width={16}
                        height={16}
                        className="size-5 shrink-0 rounded object-cover border border-border"
                        unoptimized
                        onError={(e) => {
                          const el = e.target as HTMLImageElement
                          if (el) el.style.display = "none"
                        }}
                      />
                    ) : (
                      <span className="inline-block size-4" aria-hidden />
                    )}
                  </TableCell>
                  <TableCell className="py-1.5 pl-2 text-xs text-muted-foreground">
                    {song.show_date && (
                      <>
                        <span className="font-normal">Returned </span>
                        {song.show_id ? (
                          <Link
                            href={getSetlistArchiveUrl(song.show_id)}
                            className="font-medium text-foreground hover:underline"
                          >
                            {formatDate(song.show_date)}
                          </Link>
                        ) : (
                          <span className="font-medium">
                            {formatDate(song.show_date)}
                          </span>
                        )}
                        {song.venue_location && (
                          <span className="text-muted-foreground/70">
                            {" "}
                            {formatVenueLocationWithBrackets(song.venue_location)}
                          </span>
                        )}
                      </>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-1.5 pl-2 text-xs text-muted-foreground">
                    {song.last_show_date && (
                      <>
                        <span className="font-normal">LTP </span>
                        {song.last_show_id ? (
                          <Link
                            href={getSetlistArchiveUrl(song.last_show_id)}
                            className="font-medium text-foreground hover:underline"
                          >
                            {song.last_show_date}
                          </Link>
                        ) : (
                          <span className="font-medium">
                            {song.last_show_date}
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
