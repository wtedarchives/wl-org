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
import type { TourStats } from "@/hooks/use-past-tours"

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
  if (loading) {
    return <LoadingPageCard message="Loading past tours…" />
  }

  if (pastTours.length === 0) {
    return (
      <Card className="ring-0 border border-border/60 bg-card/80 py-0">
        <CardHeader className="py-2">
          <CardTitle className="text-sm">Past Tours</CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-center">
          <p className="text-xs text-muted-foreground">No past tours found.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 py-0">
      <CardHeader className="py-2">
        <CardTitle className="text-sm">Past Tours</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="text-xs">Tour</TableHead>
              <TableHead className="text-center text-xs">Players</TableHead>
              <TableHead className="text-center text-xs">Shows</TableHead>
              <TableHead className="text-xs">Winner(s)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pastTours.map((tour) => (
              <TableRow key={tour.tour} className="text-[11px]">
                <TableCell className="px-2 py-0.5 font-medium">
                  <Link
                    href={`/dpro/setlistgame/tour/${tour.tour_id}`}
                    className="no-underline hover:underline underline-offset-2 hover:text-foreground"
                  >
                    {tour.tour}
                  </Link>
                </TableCell>
                <TableCell className="px-2 py-0.5 text-center text-muted-foreground">
                  {tour.playerCount}
                </TableCell>
                <TableCell className="px-2 py-0.5 text-center text-muted-foreground">
                  {tour.showCount}
                </TableCell>
                <TableCell className="px-2 py-0.5">
                  {tour.winners.length > 0 ? (
                    <span className="font-medium">
                      {tour.winners.map((winner, idx) => (
                        <span key={winner.username}>
                          {winner.username}{" "}
                          <span className="font-normal text-muted-foreground">
                            ({winner.score})
                          </span>
                          {idx < tour.winners.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">
                      No scores
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
