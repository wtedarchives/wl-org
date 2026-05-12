"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { cn } from "@/lib/utils"
import type { TourStats } from "@/hooks/use-past-tours"
import { useSetlistGameArchiveUrlShell } from "@/components/dpro/setlistgame/setlist-game-archive-url-shell-context"
import { getSetlistGameTourArchiveUrl } from "@/lib/setlist-game-archive-url"
import {
  SetlistGameWlV2Panel,
  sgWlV2,
  useSetlistGameWlV2Chrome,
} from "@/components/dpro/setlistgame/setlist-game-wl-v2-chrome"

interface PastToursProps {
  currentLeague: string
  loading: boolean
  pastTours: TourStats[]
}

export function PastTours({
  currentLeague,
  loading,
  pastTours,
}: PastToursProps) {
  const urlShell = useSetlistGameArchiveUrlShell()
  const wlV2 = useSetlistGameWlV2Chrome()

  if (loading) {
    return wlV2 ?
        <WlHomeV2PageLoading message="Loading past tours…" />
      : <LoadingPageCard message="Loading past tours…" />
  }

  const tableMarkup = (
    <Table className={cn(wlV2 && sgWlV2.table)}>
      <TableHeader>
        <TableRow className={cn(wlV2 ? sgWlV2.headRow : "bg-muted/60")}>
          <TableHead className={cn("text-xs", wlV2 && sgWlV2.th)}>Tour</TableHead>
          <TableHead className={cn("text-center text-xs", wlV2 && sgWlV2.th)}>
            Players
          </TableHead>
          <TableHead className={cn("text-center text-xs", wlV2 && sgWlV2.th)}>
            Shows
          </TableHead>
          <TableHead className={cn("text-xs", wlV2 && sgWlV2.th)}>
            Winner(s)
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pastTours.map((tour) => (
          <TableRow
            key={tour.tour}
            className={cn("text-[11px]", wlV2 && sgWlV2.bodyRow)}
          >
            <TableCell
              className={cn("font-medium", wlV2 ? sgWlV2.td : "px-2 py-0.5")}
            >
              <Link
                href={getSetlistGameTourArchiveUrl(tour.tour_id, urlShell)}
                className="no-underline hover:underline hover:text-foreground"
              >
                {tour.tour}
              </Link>
            </TableCell>
            <TableCell
              className={cn(
                "text-center",
                wlV2 ? cn(sgWlV2.td, "text-white/65") : "px-2 py-0.5 text-muted-foreground",
              )}
            >
              {tour.playerCount}
            </TableCell>
            <TableCell
              className={cn(
                "text-center",
                wlV2 ? cn(sgWlV2.td, "text-white/65") : "px-2 py-0.5 text-muted-foreground",
              )}
            >
              {tour.showCount}
            </TableCell>
            <TableCell className={cn(wlV2 ? sgWlV2.td : "px-2 py-0.5")}>
              {tour.winners.length > 0 ?
                <span className="font-medium">
                  {tour.winners.map((winner, idx) => (
                    <span key={winner.username}>
                      {winner.username}{" "}
                      <span
                        className={
                          wlV2 ?
                            "font-normal text-white/55"
                          : "font-normal text-muted-foreground"
                        }
                      >
                        ({winner.score})
                      </span>
                      {idx < tour.winners.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </span>
              : <span
                  className={
                    wlV2 ? "italic text-white/55" : "text-muted-foreground italic"
                  }
                >
                  No scores
                </span>
              }
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  const emptyBody = (
    <div className={wlV2 ? sgWlV2.emptyMsg : "py-6 text-center"}>
      <p className={wlV2 ? undefined : "text-xs text-muted-foreground"}>
        No past tours found.
      </p>
    </div>
  )

  const tableBody =
    pastTours.length === 0 ?
      emptyBody
    : wlV2 ?
      <div className={sgWlV2.tableScroll}>{tableMarkup}</div>
    : tableMarkup

  if (wlV2) {
    return (
      <SetlistGameWlV2Panel
        title="Past Tours"
        titleRight={
          <span className="text-[10px] font-medium text-white/55">
            {currentLeague}
          </span>
        }
      >
        {tableBody}
      </SetlistGameWlV2Panel>
    )
  }

  if (pastTours.length === 0) {
    return (
      <Card className="ring-0 border border-border/60 bg-card/80 py-0">
        <CardHeader className="py-2">
          <CardTitle className="text-sm">Past Tours</CardTitle>
        </CardHeader>
        <CardContent>{emptyBody}</CardContent>
      </Card>
    )
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 py-0">
      <CardHeader className="py-2">
        <CardTitle className="text-sm">Past Tours</CardTitle>
      </CardHeader>
      <CardContent className="p-0">{tableBody}</CardContent>
    </Card>
  )
}
