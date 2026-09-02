"use client"

import Image from "next/image"
import { Broadcast, Check, FileAudio, Presentation, Trophy, Users } from "@phosphor-icons/react"
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
import { cn } from "@/lib/utils"
import { YearShowRow } from "./year-show-row"

interface YearShowsTableProps {
  shows: YearShow[]
  tours: TourCount[]
  attendeeCounts: Record<string, number>
  showRatings: Record<string, number>
  showsWithSetlists: Set<string>
  showsWithPosters: Set<string>
  showsWithReleases: Set<string>
  showsWithRadioIds: Set<string>
  currentYear: string
  selectedGroups: string[]
  onClearFilters: () => void
  loading: boolean
  /** WL Home v2: frosted panel + topic-style table (no Card chrome). */
  wlHomeV2?: boolean
}

export function YearShowsTable({
  shows,
  tours,
  attendeeCounts,
  showRatings,
  showsWithSetlists,
  showsWithPosters,
  showsWithReleases,
  showsWithRadioIds,
  currentYear,
  selectedGroups,
  onClearFilters,
  loading,
  wlHomeV2 = false,
}: YearShowsTableProps) {
  const { session } = useAuth()
  const hasSetlistGameShows = shows.some((show) => show.show_issetlistgame)
  const { sortedShows, handleSort } = useYearShowsSort(
    shows,
    attendeeCounts,
    showRatings,
  )

  if (loading) {
    const inner = (
      <div
        className={cn(
          "flex items-center justify-center px-4 py-8 text-xs",
          wlHomeV2
            ? "text-white/55"
            : "text-muted-foreground",
        )}
      >
        Loading shows…
      </div>
    )
    if (wlHomeV2) {
      return (
        <div className="widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural">
          <div className="wp-head wl-home-v2-years-shows-wp-head">
            <span className="inline-flex min-w-0 flex-wrap items-baseline gap-x-1.5">
              {currentYear ?
                <span className="wp-head-date">{currentYear}</span>
              : null}
              <span>Shows</span>
            </span>
          </div>
          {inner}
        </div>
      )
    }
    return (
      <Card className="ring-0 border border-border/60 bg-card/80 py-0">
        <CardContent className="flex items-center justify-center px-4 py-8 text-xs text-muted-foreground">
          Loading shows…
        </CardContent>
      </Card>
    )
  }

  if (!loading && shows.length === 0) {
    const emptyBody =
      selectedGroups.length === 0 ? (
        <>No shows found for {currentYear || "this year"}.</>
      ) : (
        <div className="space-y-2">
          <p>No shows match the selected filters.</p>
          <button
            type="button"
            onClick={onClearFilters}
            className={cn(
              "text-xs font-medium hover:underline",
              wlHomeV2 ? "text-[var(--wl-green)]" : "text-foreground",
            )}
          >
            Clear filters
          </button>
        </div>
      )
    if (wlHomeV2) {
      return (
        <div className="widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural">
          <div className="wp-head wl-home-v2-years-shows-wp-head">
            <span className="inline-flex min-w-0 flex-wrap items-baseline gap-x-1.5">
              {currentYear ?
                <span className="wp-head-date">{currentYear}</span>
              : null}
              <span>Shows</span>
            </span>
          </div>
          <div className="px-1 py-4 text-center text-xs text-white/65">
            {emptyBody}
          </div>
        </div>
      )
    }
    return (
      <Card className="ring-0 border border-border/60 bg-card/80 py-0">
        <CardContent className="px-4 py-6 text-center text-xs text-muted-foreground">
          {emptyBody}
        </CardContent>
      </Card>
    )
  }

  const table = (
    <div
      className={cn(wlHomeV2 && "wl-home-v2-years-table-scroll min-h-0")}
    >
      <Table
        className={cn(
          "min-w-max text-[11px]",
          wlHomeV2 && "wl-home-v2-years-table",
        )}
      >
          <TableHeader>
            <TableRow
              className={cn(
                wlHomeV2 ?
                  "border-b bg-black/25 hover:bg-black/25"
                : "bg-muted/60",
              )}
            >
              <TableHead className="w-[4px] p-0" />
              <TableHead
                className="w-[68px] cursor-pointer !px-2 !py-0.5 text-center text-[11px] font-medium"
                onClick={() => handleSort("show_date" as SortColumn)}
              >
                <span>Date</span>
              </TableHead>
              {session ? (
                <TableHead className="w-[32px] !px-1 !py-0.5 text-center text-[11px] font-medium">
                  <div className="flex w-full items-center justify-center">
                    <Check
                      className="size-3 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  </div>
                </TableHead>
              ) : null}
              <TableHead
                className="cursor-pointer !px-2 !py-0.5 text-left text-[11px] font-medium"
                onClick={() => handleSort("show_group")}
              >
                <span>Group</span>
              </TableHead>
              <TableHead
                className="cursor-pointer !px-2 !py-0.5 text-left text-[11px] font-medium"
                onClick={() => handleSort("show_subvenue")}
              >
                <span>Venue</span>
              </TableHead>
              <TableHead
                className="cursor-pointer !px-2 !py-0.5 text-left text-[11px] font-medium"
                onClick={() => handleSort("show_venue_location")}
              >
                <span>Location</span>
              </TableHead>
              <TableHead
                className="cursor-pointer !px-2 !py-0.5 text-center text-[11px] font-medium"
                onClick={() => handleSort("rating")}
              >
                <span>Rating</span>
              </TableHead>
              {hasSetlistGameShows ?
                <TableHead className="w-[32px] !px-1 !py-0.5 text-center text-[11px] font-medium">
                  <div className="flex w-full items-center justify-center">
                    <Trophy
                      className="size-3 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  </div>
                </TableHead>
              : null}
              <TableHead className="w-[32px] !px-1 !py-0.5 text-center text-[11px] font-medium">
                <div className="flex w-full items-center justify-center">
                  <FileAudio
                    className="size-3 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </div>
              </TableHead>
              <TableHead className="w-[32px] !px-1 !py-0.5 text-center text-[11px] font-medium">
                <div className="flex w-full items-center justify-center">
                  <Presentation
                    className="size-3 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </div>
              </TableHead>
              <TableHead className="w-[32px] !px-1 !py-0.5 text-center text-[11px] font-medium">
                <div className="flex w-full items-center justify-center">
                  <Broadcast
                    className="size-3 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </div>
              </TableHead>
              <TableHead
                className="w-[32px] cursor-pointer !px-1 !py-0.5 text-center text-[11px] font-medium"
                onClick={() => handleSort("attendee_count")}
              >
                <div className="flex w-full items-center justify-center">
                  <Users
                    className="size-3 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </div>
              </TableHead>
              <TableHead className="w-[32px] !px-1 !py-0.5 text-center text-[11px] font-medium">
                <div className="flex w-full items-center justify-center">
                  <Image
                    src="/WL.png"
                    alt="Wysteria Lane"
                    width={12}
                    height={12}
                    className="h-3 w-auto shrink-0"
                  />
                </div>
              </TableHead>
              <TableHead className="w-[32px] !px-1 !py-0.5 text-center text-[11px] font-medium">
                <div className="flex w-full items-center justify-center">
                  <Image
                    src="/WTED2.png"
                    alt="WTED Goose Radio"
                    width={12}
                    height={12}
                    className="h-3 w-auto shrink-0"
                  />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer !px-2 !py-0.5 text-left text-[11px] font-medium"
                onClick={() => handleSort("show_detail")}
              >
                <span>Detail</span>
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
                showsWithPosters={showsWithPosters}
                showsWithReleases={showsWithReleases}
                showsWithRadioIds={showsWithRadioIds}
                showEchoColumn={hasSetlistGameShows}
                wlHomeV2={wlHomeV2}
              />
            ))}
          </TableBody>
        </Table>
    </div>
  )

  if (wlHomeV2) {
    return (
      <div className="widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural flex min-h-0 min-w-0 flex-col">
        <div className="wp-head wl-home-v2-years-shows-wp-head shrink-0">
          <span className="inline-flex min-w-0 flex-wrap items-baseline gap-x-1.5">
            {currentYear ?
              <span className="wp-head-date">{currentYear}</span>
            : null}
            <span>Shows</span>
          </span>
        </div>
        {table}
      </div>
    )
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 py-0">
      <CardContent className="p-0">{table}</CardContent>
    </Card>
  )
}
