"use client"

import Link from "next/link"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { cn } from "@/lib/utils"
import {
  POPULAR_PLACEMENT_SECTIONS,
  type PopularPlacementsDataSlice,
} from "@/components/dpro/lists/popular-placements-list.constants"
import { PopularPlacementsLegacyCardCategoryThumb } from "@/components/dpro/lists/popular-placements-category-thumbs"

export function PopularPlacementsLegacyGrid({
  data,
}: {
  data: PopularPlacementsDataSlice
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {POPULAR_PLACEMENT_SECTIONS.map((section) => {
        const items = section.getItems(data)
        return (
          <Card
            key={section.title}
            className="border-border/60 bg-card/80 overflow-hidden py-0"
          >
            <CardHeader
              className={cn(
                "px-3 py-2 text-sm font-medium text-white",
                section.slotTitle === "Show Openers" && "bg-[#047857]",
                section.slotTitle === "Set Openers" && "bg-[#10b981]",
                section.slotTitle === "Set Closers" && "bg-[#3b82f6]",
                section.slotTitle === "Encores" && "bg-[#be123c]",
              )}
            >
              {section.title}
            </CardHeader>
            <CardContent className="p-0">
              {items.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No data
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-8 px-2 py-0.5 text-center text-xs font-medium">
                        #
                      </TableHead>
                      <TableHead className="px-2 py-0.5 text-left text-xs font-medium">
                        Song
                      </TableHead>
                      <TableHead className="min-w-16 w-16 px-2 py-0.5 text-center text-xs font-medium">
                        Cat.
                      </TableHead>
                      <TableHead className="w-16 px-2 py-0.5 text-center text-xs font-medium">
                        Count
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((row, i) => {
                      const displayRank =
                        i === 0 ||
                        items[i].times_played !== items[i - 1].times_played
                          ? i + 1
                          : null
                      return (
                        <TableRow
                          key={row.song_id}
                          className={
                            i % 2 === 0 ? "bg-background/70" : "bg-background"
                          }
                        >
                          <TableCell className="px-2 py-0.5 text-center text-xs tabular-nums">
                            {displayRank ?? ""}
                          </TableCell>
                          <TableCell className="px-2 py-0.5">
                            <Link
                              href={getSongArchiveUrl(row.song_id)}
                              className="font-medium hover:underline"
                            >
                              <SongDisplayName
                                song={row.song_name}
                                songDisplayName={row.song_displayname}
                              />
                            </Link>
                          </TableCell>
                          <TableCell className="min-w-16 w-16 px-2 py-0.5 text-center align-middle">
                            {row.category_artwork ?
                              <PopularPlacementsLegacyCardCategoryThumb
                                src={row.category_artwork}
                              />
                            : null}
                          </TableCell>
                          <TableCell className="px-2 py-0.5 text-center text-xs tabular-nums">
                            {row.times_played}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
