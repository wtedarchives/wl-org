"use client"


import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import Link from "next/link"
import { Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { VenueShow } from "@/hooks/use-venue-data"

function formatVenueShowDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-")
  return `${month}.${day}.${year.slice(2)}`
}

function RatingStars({ rating }: { rating: number }) {
  if (!rating || rating <= 0) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className="size-3 text-muted-foreground/30"
            strokeWidth={1.75}
          />
        ))}
      </div>
    )
  }
  return (
    <div className="relative flex items-center group">
      <div className="flex items-center gap-0.5 transition-opacity group-hover:opacity-30">
        {[1, 2, 3, 4, 5].map((starNumber) => {
          const fillPercentage = Math.min(
            Math.max(rating - starNumber + 1, 0),
            1,
          )
          return (
            <div key={starNumber} className="relative size-3">
              <Star
                className="size-3 text-yellow-400/40"
                strokeWidth={1.75}
              />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPercentage * 100}%` }}
              >
                <Star className="size-3 text-yellow-400" fill="currentColor" />
              </div>
            </div>
          )
        })}
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-semibold opacity-0 transition-opacity group-hover:opacity-100">
        {rating.toFixed(2)}
      </div>
    </div>
  )
}

interface VenueShowsTableProps {
  shows: VenueShow[]
  showRatings: Record<string, number>
}

export function VenueShowsTable({
  shows,
  showRatings,
}: VenueShowsTableProps) {
  return (
    <Card className="border-border/60 bg-card/80 overflow-hidden py-0">
      <div className="bg-muted/60 px-3 py-2 shrink-0">
        <h2 className="text-sm font-semibold">Shows</h2>
      </div>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-max text-[11px]">
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="px-2 py-1 text-center text-[11px] font-medium">
                  Date
                </TableHead>
                <TableHead className="px-2 py-1 text-left text-[11px] font-medium">
                  Group
                </TableHead>
                <TableHead className="px-2 py-1 text-left text-[11px] font-medium">
                  Venue
                </TableHead>
                <TableHead className="px-2 py-1 text-left text-[11px] font-medium">
                  Tour
                </TableHead>
                <TableHead className="px-2 py-1 text-center text-[11px] font-medium">
                  Rating
                </TableHead>
                <TableHead className="px-2 py-1 text-left text-[11px] font-medium">
                  Detail
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shows.map((show) => (
                <TableRow
                  key={show.show_id}
                  className="hover:bg-muted/40"
                >
                  <TableCell className="px-2 py-0.5 text-center whitespace-nowrap font-medium">
                    <Link
                      href={getSetlistArchiveUrl(show.show_id)}
                      className="hover:underline"
                    >
                      {formatVenueShowDate(show.show_date)}
                    </Link>
                  </TableCell>
                  <TableCell className="px-2 py-0.5 text-muted-foreground whitespace-nowrap">
                    {show.show_group}
                  </TableCell>
                  <TableCell className="px-2 py-0.5 text-muted-foreground whitespace-nowrap">
                    {show.show_subvenue}
                  </TableCell>
                  <TableCell className="px-2 py-0.5 whitespace-nowrap">
                    {show.show_tour ? (
                      show.tour_id ? (
                        <Link
                          href={`/archive/tours/${show.tour_id}`}
                          className="text-muted-foreground hover:underline"
                        >
                          {show.show_tour}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">
                          {show.show_tour}
                        </span>
                      )
                    ) : null}
                  </TableCell>
                  <TableCell className="px-2 py-0.5 text-center">
                    <div className="flex justify-center">
                      <RatingStars
                        rating={showRatings[show.show_id] ?? 0}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-0.5 text-muted-foreground whitespace-nowrap">
                    {show.show_detail}
                    {show.show_detail && show.show_alert && (
                      <>&nbsp;&nbsp;</>
                    )}
                    {show.show_alert && (
                      <span className="text-destructive font-medium">
                        [{show.show_alert}]
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
