"use client"

import Link from "next/link"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
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
import { cn } from "@/lib/utils"

type SongItem = {
  song_id: string
  song?: string
  song_name?: string
  song_displayname?: string | null
  play_count?: number
  times_played?: number
  category_artwork?: string
}

interface StatCardProps {
  title: string
  headerClassName?: string
  items: SongItem[]
  getDisplayName: (item: SongItem) => string
  /** When provided with getSongDisplayName, uses SongDisplayName with hover-to-canonical. */
  getSong?: (item: SongItem) => string
  getSongDisplayName?: (item: SongItem) => string | null
  getCount: (item: SongItem) => number | string
  showEmptyState?: boolean
  /** Match `TopSlotsCarousel` wlHomeV2 widget-panel + table chrome (archive stats). */
  wlHomeV2?: boolean
}

export function StatCard({
  title,
  headerClassName,
  items,
  getDisplayName,
  getSong,
  getSongDisplayName,
  getCount,
  showEmptyState = false,
  wlHomeV2 = false,
}: StatCardProps) {
  return (
    <Card className="overflow-hidden py-0">
      <CardHeader
        className={headerClassName ?? "bg-muted/60 py-2"}
      >
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
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
        ) : (
          <Table
            className={cn(
              "caption-bottom w-full",
              wlHomeV2 ?
                "min-w-max border-collapse text-[11px] leading-3 wl-home-v2-years-table wl-home-v2-top-slots-stats-table"
              : "text-xs",
            )}
          >
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.song_id}
                  className={
                    wlHomeV2 ? "wl-home-v2-top-slots-stats-row" : undefined
                  }
                >
                  <TableCell
                    className={cn(
                      wlHomeV2 ?
                        "wl-home-v2-top-slots-stats-cell"
                      : "py-0.5 pl-3",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={getSongArchiveUrl(item.song_id)}
                        className={cn(
                          "font-medium hover:underline",
                          wlHomeV2 ?
                            "text-left text-white/88"
                          : "text-xs text-foreground",
                        )}
                      >
                        {getSong && getSongDisplayName ? (
                          <SongDisplayName
                            song={getSong(item)}
                            songDisplayName={getSongDisplayName(item)}
                          />
                        ) : (
                          getDisplayName(item)
                        )}
                      </Link>
                      {item.category_artwork && (
                        <span className="inline-flex shrink-0 items-center !pr-2">
                          <Image
                            src={item.category_artwork}
                            alt=""
                            width={16}
                            height={16}
                            className={cn(
                              "size-5 shrink-0 rounded object-cover",
                              wlHomeV2 ?
                                "border border-[rgb(63,65,64)]"
                              : "border border-border",
                            )}
                            unoptimized
                            onError={(e) => {
                              const el = e.target as HTMLImageElement
                              if (el) el.style.display = "none"
                            }}
                          />
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "w-[30px] text-center font-medium tabular-nums",
                      wlHomeV2 ?
                        "wl-home-v2-top-slots-stats-cell text-white/88"
                      : "py-1.5 text-xs",
                    )}
                  >
                    {getCount(item)}
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
