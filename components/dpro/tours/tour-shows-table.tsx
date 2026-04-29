"use client"

import Image from "next/image"
import type { ReactNode } from "react"
import { Broadcast, Check, FileAudio, Users } from "@phosphor-icons/react"
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
import { useTourShowsSort } from "@/hooks/use-tour-shows-sort"
import { cn } from "@/lib/utils"
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
  wlHomeV2?: boolean
  /** WL tour: optional right-aligned control (e.g. compact “Tours” selector). */
  wlHeaderTrailing?: ReactNode
  /**
   * WL tour: on compact view (&lt; xl), omit “▪ N shows” in the header when the tour has
   * no show-field data (`tour_showfields` false).
   */
  wlCompactHideShowCount?: boolean
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
  wlHomeV2 = false,
  wlHeaderTrailing,
  wlCompactHideShowCount = false,
}: TourShowsTableProps) {
  const { user } = useAuth()
  const hasRarity = shows.some((s) => s.show_rarity != null && s.show_rarity !== "")
  const hasGap = shows.some((s) => s.show_gap != null && s.show_gap !== "")
  const { sortedShows, handleSort, sortIndicator } = useTourShowsSort(
    shows,
    attendeeCounts,
    showRatings,
  )

  const wlTourShowsHead = (showCount: number | "loading") => (
    <div
      className={cn(
        "wp-head wl-home-v2-years-shows-wp-head wl-home-v2-tours-shows-wp-head",
        "flex w-full min-w-0 shrink-0 flex-row flex-wrap items-center gap-x-3 gap-y-1",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-x-2">
        <span className="wp-head-date min-w-0 truncate">
          {currentTour || "Tour"}
        </span>
        {!wlCompactHideShowCount ?
          <>
            <span
              className="shrink-0 text-[10px] leading-none text-white/40"
              aria-hidden
            >
              ▪
            </span>
            <span className="shrink-0 tabular-nums">
              {showCount === "loading" ?
                "…"
              : `${showCount} ${showCount === 1 ? "show" : "shows"}`}
            </span>
          </>
        : null}
      </div>
      {wlHeaderTrailing ?
        <div className="shrink-0">{wlHeaderTrailing}</div>
      : null}
    </div>
  )

  if (loading) {
    const inner = (
      <div
        className={cn(
          "flex items-center justify-center px-4 py-8 text-xs",
          wlHomeV2 ? "text-white/55" : "text-muted-foreground",
        )}
      >
        Loading tour…
      </div>
    )
    if (wlHomeV2) {
      return (
        <div className="widget-panel wl-home-v2-years-shows-panel">
          {wlTourShowsHead("loading")}
          {inner}
        </div>
      )
    }
    return (
      <Card className="ring-0 border border-border/60 bg-card/80 py-0">
        <CardContent className="flex items-center justify-center px-4 py-8 text-xs text-muted-foreground">
          Loading tour…
        </CardContent>
      </Card>
    )
  }

  if (!loading && shows.length === 0) {
    const emptyBody = <>No shows found for {currentTour}.</>
    if (wlHomeV2) {
      return (
        <div className="widget-panel wl-home-v2-years-shows-panel">
          {wlTourShowsHead(0)}
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

  const headCell = wlHomeV2 ? "!px-2 !py-0.5" : "px-2 py-1"
  const headCellTight = wlHomeV2 ? "!px-1 !py-0.5" : "px-1 py-1"

  const table = (
    <div
      className={cn(wlHomeV2 && "wl-home-v2-years-table-scroll min-h-0 flex-1")}
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
            <TableHead
              className={cn(
                "w-[68px] cursor-pointer text-center text-[11px] font-medium",
                headCell,
              )}
              onClick={() => handleSort("show_date")}
            >
              <span>Date</span>{" "}
              <span className="text-[9px]">{sortIndicator("show_date")}</span>
            </TableHead>
            {user ? (
              <TableHead
                className={cn(
                  "w-[32px] text-center text-[11px] font-medium",
                  headCellTight,
                )}
              >
                <div className="flex w-full items-center justify-center">
                  <Check className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                </div>
              </TableHead>
            ) : null}
            <TableHead
              className={cn(
                "cursor-pointer text-left text-[11px] font-medium",
                headCell,
              )}
              onClick={() => handleSort("show_group")}
            >
              <span>Group</span>{" "}
              <span className="text-[9px]">{sortIndicator("show_group")}</span>
            </TableHead>
            <TableHead
              className={cn(
                "cursor-pointer text-center text-[11px] font-medium",
                headCell,
              )}
              onClick={() => handleSort("show_length")}
            >
              <span>Length</span>{" "}
              <span className="text-[9px]">{sortIndicator("show_length")}</span>
            </TableHead>
            {hasRarity ? (
              <TableHead
                className={cn(
                  "cursor-pointer text-center text-[11px] font-medium",
                  headCell,
                )}
                onClick={() => handleSort("show_rarity")}
              >
                <span>Rarity</span>{" "}
                <span className="text-[9px]">{sortIndicator("show_rarity")}</span>
              </TableHead>
            ) : null}
            {hasGap ? (
              <TableHead
                className={cn(
                  "cursor-pointer text-center text-[11px] font-medium",
                  headCell,
                )}
                onClick={() => handleSort("show_gap")}
              >
                <span>Gap</span>{" "}
                <span className="text-[9px]">{sortIndicator("show_gap")}</span>
              </TableHead>
            ) : null}
            <TableHead
              className={cn(
                "cursor-pointer text-left text-[11px] font-medium",
                headCell,
              )}
              onClick={() => handleSort("show_subvenue")}
            >
              <span>Venue</span>{" "}
              <span className="text-[9px]">{sortIndicator("show_subvenue")}</span>
            </TableHead>
            <TableHead
              className={cn(
                "cursor-pointer text-left text-[11px] font-medium",
                headCell,
              )}
              onClick={() => handleSort("show_venue_location")}
            >
              <span>Location</span>{" "}
              <span className="text-[9px]">
                {sortIndicator("show_venue_location")}
              </span>
            </TableHead>
            <TableHead
              className={cn(
                "cursor-pointer text-center text-[11px] font-medium",
                headCell,
              )}
              onClick={() => handleSort("rating")}
            >
              <span>Rating</span>{" "}
              <span className="text-[9px]">{sortIndicator("rating")}</span>
            </TableHead>
            <TableHead
              className={cn("w-[32px] text-center text-[11px] font-medium", headCellTight)}
            >
              <div className="flex w-full items-center justify-center">
                <FileAudio className="size-3 shrink-0 text-muted-foreground" aria-hidden />
              </div>
            </TableHead>
            <TableHead
              className={cn("w-[32px] text-center text-[11px] font-medium", headCellTight)}
            >
              <div className="flex w-full items-center justify-center">
                <Broadcast className="size-3 shrink-0 text-muted-foreground" aria-hidden />
              </div>
            </TableHead>
            <TableHead
              className={cn(
                "w-[32px] cursor-pointer text-center text-[11px] font-medium",
                headCellTight,
              )}
              onClick={() => handleSort("attendee_count")}
            >
              <div className="flex w-full items-center justify-center">
                <Users className="size-3 shrink-0 text-muted-foreground" aria-hidden />
              </div>
            </TableHead>
            <TableHead
              className={cn("w-[32px] text-center text-[11px] font-medium", headCellTight)}
            >
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
            <TableHead
              className={cn("w-[32px] text-center text-[11px] font-medium", headCellTight)}
            >
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
              className={cn(
                "cursor-pointer text-left text-[11px] font-medium",
                headCell,
              )}
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
              wlHomeV2={wlHomeV2}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )

  if (wlHomeV2) {
    return (
      <div className="widget-panel wl-home-v2-years-shows-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {wlTourShowsHead(shows.length)}
        {table}
      </div>
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
      <CardContent className="p-0">{table}</CardContent>
    </Card>
  )
}
