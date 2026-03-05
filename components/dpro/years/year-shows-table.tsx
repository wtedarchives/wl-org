"use client"

import Image from "next/image"
import { Check, FileMusic, Users, AudioLines } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { YearShow } from "@/hooks/use-shows-data-by-year"
import type { TourCount } from "@/hooks/use-tours-data"
import { useYearShowsSort, type SortColumn } from "@/hooks/use-year-shows-sort"
import { YearShowRow } from "./year-show-row"

interface YearShowsTableProps {
  shows: YearShow[]
  tours: TourCount[]
  attendeeCounts: Record<string, number>
  showRatings: Record<string, number>
  showsWithSetlists: Set<string>
  showsWithReleases: Set<string>
  showsWithRadioIds: Set<string>
  currentYear: string
  selectedGroups: string[]
  onClearFilters: () => void
  loading: boolean
}

export function YearShowsTable({
  shows,
  tours,
  attendeeCounts,
  showRatings,
  showsWithSetlists,
  showsWithReleases,
  showsWithRadioIds,
  currentYear,
  selectedGroups,
  onClearFilters,
  loading,
}: YearShowsTableProps) {
  const { user } = useAuth()
  const { sortedShows, handleSort, sortIndicator } = useYearShowsSort(
    shows,
    attendeeCounts,
    showRatings,
  )

  if (loading) {
    return (
      <Card className="ring-0 border border-border/60 bg-card/80 py-0">
        <CardContent className="flex items-center justify-center px-4 py-8 text-xs text-muted-foreground">
          Loading shows…
        </CardContent>
      </Card>
    )
  }

  if (!loading && shows.length === 0) {
    return (
      <Card className="ring-0 border border-border/60 bg-card/80 py-0">
        <CardContent className="px-4 py-6 text-center text-xs text-muted-foreground">
          {selectedGroups.length === 0 ? (
            <>No shows found for {currentYear || "this year"}.</>
          ) : (
            <div className="space-y-2">
              <p>No shows match the selected filters.</p>
              <button
                type="button"
                onClick={onClearFilters}
                className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 py-0">
      <CardContent className="p-0">
        <Table className="min-w-max text-[11px]">
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="w-[4px] p-0" />
              <TableHead
                className="w-[68px] cursor-pointer px-2 py-1 text-center text-[11px] font-medium"
                onClick={() => handleSort("show_date" as SortColumn)}
              >
                <span>Date</span>{" "}
                <span className="text-[9px]">{sortIndicator("show_date")}</span>
              </TableHead>
              {user ? (
                <TableHead className="w-[28px] px-1 py-1 text-center text-[11px] font-medium">
                  <Check className="mx-auto size-3 text-muted-foreground" />
                </TableHead>
              ) : null}
              <TableHead
                className="cursor-pointer px-2 py-1 text-left text-[11px] font-medium"
                onClick={() => handleSort("show_group")}
              >
                <span>Group</span>{" "}
                <span className="text-[9px]">
                  {sortIndicator("show_group")}
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer px-2 py-1 text-left text-[11px] font-medium"
                onClick={() => handleSort("show_subvenue")}
              >
                <span>Venue</span>{" "}
                <span className="text-[9px]">
                  {sortIndicator("show_subvenue")}
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer px-2 py-1 text-left text-[11px] font-medium"
                onClick={() => handleSort("show_venue_location")}
              >
                <span>Location</span>{" "}
                <span className="text-[9px]">
                  {sortIndicator("show_venue_location")}
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer px-2 py-1 text-center text-[11px] font-medium"
                onClick={() => handleSort("rating")}
              >
                <span>Rating</span>{" "}
                <span className="text-[9px]">{sortIndicator("rating")}</span>
              </TableHead>
              <TableHead className="w-[28px] px-1 py-1 text-center text-[11px] font-medium">
                <FileMusic className="mx-auto size-3 text-muted-foreground" />
              </TableHead>
              <TableHead className="w-[28px] px-1 py-1 text-center text-[11px] font-medium">
                <AudioLines className="mx-auto size-3 text-muted-foreground" />
              </TableHead>
              <TableHead
                className="w-[32px] cursor-pointer px-1 py-1 text-center text-[11px] font-medium"
                onClick={() => handleSort("attendee_count")}
              >
                <Users className="mx-auto mb-0.5 size-3 text-muted-foreground" />
                <span className="text-[9px]">
                  {sortIndicator("attendee_count")}
                </span>
              </TableHead>
              <TableHead className="w-[28px] px-1 py-1 text-center text-[11px] font-medium">
                <Image
                  src="/WL.png"
                  alt="Wysteria Lane"
                  width={12}
                  height={12}
                  className="mx-auto h-3 w-auto"
                />
              </TableHead>
              <TableHead className="w-[28px] px-1 py-1 text-center text-[11px] font-medium">
                <Image
                  src="/WTED2.png"
                  alt="WTED Goose Radio"
                  width={12}
                  height={12}
                  className="mx-auto h-3 w-auto"
                />
              </TableHead>
              <TableHead
                className="cursor-pointer px-2 py-1 text-left text-[11px] font-medium"
                onClick={() => handleSort("show_detail")}
              >
                <span>Detail</span>{" "}
                <span className="text-[9px]">
                  {sortIndicator("show_detail")}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedShows.map((show, index) => (
              <YearShowRow
                key={show.show_id}
                show={show}
                index={index}
                tours={tours}
                attendeeCounts={attendeeCounts}
                showRatings={showRatings}
                showsWithSetlists={showsWithSetlists}
                showsWithReleases={showsWithReleases}
                showsWithRadioIds={showsWithRadioIds}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
