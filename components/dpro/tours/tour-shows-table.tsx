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
import type { TourShow } from "@/types/tour"
import { useTourShowsSort, type TourSortColumn } from "@/hooks/use-tour-shows-sort"
import { TourShowRow } from "./tour-show-row"

interface TourShowsTableProps {
  shows: TourShow[]
  currentTour: string
  attendeeCounts: Record<string, number>
  showRatings: Record<string, number>
  showsWithSetlists: Set<string>
  showsWithReleases: Set<string>
  showsWithRadioIds: Set<string>
  loading: boolean
}

export function TourShowsTable({
  shows,
  currentTour,
  attendeeCounts,
  showRatings,
  showsWithSetlists,
  showsWithReleases,
  showsWithRadioIds,
  loading,
}: TourShowsTableProps) {
  const { user } = useAuth()
  const hasRarity = shows.some((s) => s.show_rarity != null && s.show_rarity !== "")
  const hasGap = shows.some((s) => s.show_gap != null && s.show_gap !== "")
  const { sortedShows, handleSort, sortIndicator } = useTourShowsSort(
    shows,
    attendeeCounts,
    showRatings,
  )

  if (loading) {
    return (
      <Card className="ring-0 border border-border/60 bg-card/80 py-0">
        <CardContent className="flex items-center justify-center px-4 py-8 text-xs text-muted-foreground">
          Loading tour…
        </CardContent>
      </Card>
    )
  }

  if (!loading && shows.length === 0) {
    return (
      <Card className="ring-0 border border-border/60 bg-card/80 py-0">
        <CardContent className="px-4 py-6 text-center text-xs text-muted-foreground">
          No shows found for {currentTour}.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 py-0">
      <div className="border-b border-border/60 bg-muted/60 px-3 py-2 flex justify-between items-center">
        <h2 className="text-sm font-semibold">{currentTour}</h2>
        <span className="text-xs font-medium text-muted-foreground">
          {shows.length} {shows.length === 1 ? "Show" : "Shows"}
        </span>
      </div>
      <CardContent className="p-0">
        <Table className="min-w-max text-[11px]">
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead
                className="w-[68px] cursor-pointer px-2 py-1 text-center text-[11px] font-medium"
                onClick={() => handleSort("show_date")}
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
                <span className="text-[9px]">{sortIndicator("show_group")}</span>
              </TableHead>
              <TableHead
                className="cursor-pointer px-2 py-1 text-center text-[11px] font-medium"
                onClick={() => handleSort("show_length")}
              >
                <span>Length</span>{" "}
                <span className="text-[9px]">{sortIndicator("show_length")}</span>
              </TableHead>
              {hasRarity ? (
                <TableHead
                  className="cursor-pointer px-2 py-1 text-center text-[11px] font-medium"
                  onClick={() => handleSort("show_rarity")}
                >
                  <span>Rarity</span>{" "}
                  <span className="text-[9px]">{sortIndicator("show_rarity")}</span>
                </TableHead>
              ) : null}
              {hasGap ? (
                <TableHead
                  className="cursor-pointer px-2 py-1 text-center text-[11px] font-medium"
                  onClick={() => handleSort("show_gap")}
                >
                  <span>Gap</span>{" "}
                  <span className="text-[9px]">{sortIndicator("show_gap")}</span>
                </TableHead>
              ) : null}
              <TableHead
                className="cursor-pointer px-2 py-1 text-left text-[11px] font-medium"
                onClick={() => handleSort("show_subvenue")}
              >
                <span>Venue</span>{" "}
                <span className="text-[9px]">{sortIndicator("show_subvenue")}</span>
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
                <span className="text-[9px]">{sortIndicator("show_detail")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedShows.map((show, index) => (
              <TourShowRow
                key={show.show_id}
                show={show}
                index={index}
                attendeeCounts={attendeeCounts}
                showRatings={showRatings}
                showsWithSetlists={showsWithSetlists}
                showsWithReleases={showsWithReleases}
                showsWithRadioIds={showsWithRadioIds}
                showRarityColumn={hasRarity}
                showGapColumn={hasGap}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
