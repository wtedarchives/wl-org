"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"

import { Check, FileMusic, Users, Star, AudioLines } from "lucide-react"

import { useAuth } from "@/components/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import type { YearShow } from "@/hooks/use-shows-data-by-year"
import type { TourCount } from "@/hooks/use-tours-data"

type SortColumn =
  | "show_date"
  | "rating"
  | "show_group"
  | "show_subvenue"
  | "show_venue_location"
  | "show_detail"
  | "attendee_count"

type SortDirection = "asc" | "desc"

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

function getTourColor(tours: TourCount[], tourName: string): string {
  const tour = tours.find((t) => t.tour === tourName)
  return tour ? tour.color : "transparent"
}

function formatShowDate(showDate: string) {
  const [year, month, day] = showDate.split("-")
  return `${month}.${day}.${year.slice(2)}`
}

function RatingStars({
  rating,
}: {
  rating: number
}) {
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
    <div className="relative flex items-center">
      <div className="flex items-center gap-0.5 transition-opacity group-hover:opacity-10">
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

function YearShowRow({
  show,
  index,
  tours,
  attendeeCounts,
  showRatings,
  showsWithSetlists,
  showsWithReleases,
  showsWithRadioIds,
}: {
  show: YearShow
  index: number
  tours: TourCount[]
  attendeeCounts: Record<string, number>
  showRatings: Record<string, number>
  showsWithSetlists: Set<string>
  showsWithReleases: Set<string>
  showsWithRadioIds: Set<string>
}) {
  const { user } = useAuth()
  const rating = showRatings[show.show_id] ?? 0
  const attendeeCount = attendeeCounts[show.show_id] ?? 0

  return (
    <TableRow className={index % 2 === 0 ? "bg-background/70" : "bg-background"}>
      <TableCell className="relative w-[4px] p-0 align-middle">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="absolute inset-y-0 left-0 w-[4px]"
                style={{
                  backgroundColor: getTourColor(tours, show.show_tour),
                }}
              />
            </TooltipTrigger>
            {show.show_tour && (
              <TooltipContent side="right">
                <span className="text-[11px]">{show.show_tour}</span>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell className="whitespace-nowrap px-2 py-1 text-center text-[11px] font-medium tabular-nums">
        <Link
          href={`/dpro/setlist/${show.show_id}`}
          className="hover:underline"
        >
          {formatShowDate(show.show_date)}
        </Link>
      </TableCell>
      {user ? (
        <TableCell className="w-[28px] px-1 py-1 text-center align-middle leading-none">
          <div className="inline-flex items-center justify-center">
            {show.attended ? (
              <div className="inline-flex items-center justify-center rounded-full bg-emerald-600 p-0.5">
                <Check className="size-3 text-white" strokeWidth={3} />
              </div>
            ) : (
              <span className="inline-block size-3" aria-hidden />
            )}
          </div>
        </TableCell>
      ) : null}
      <TableCell className="px-2 py-1 text-[11px] font-normal text-muted-foreground">
        {show.show_group}
      </TableCell>
      <TableCell className="px-2 py-1 text-[11px]">
        {show.venue_id ? (
          <Link
            href={`/dpro/venue/${show.venue_id}`}
            className="hover:underline"
          >
            {show.show_subvenue}
          </Link>
        ) : show.show_subvenue_venue ? (
          <Link
            href={`/dpro/venue/${encodeURIComponent(
              show.show_subvenue_venue,
            )}`}
            className="hover:underline"
          >
            {show.show_subvenue}
          </Link>
        ) : (
          <span>{show.show_subvenue}</span>
        )}
      </TableCell>
      <TableCell className="px-2 py-1 text-[11px] text-muted-foreground">
        {show.show_venue_location}
      </TableCell>
      <TableCell className="group px-2 py-1 text-center align-middle leading-none">
        <div className="inline-flex items-center justify-center">
          <RatingStars rating={rating} />
        </div>
      </TableCell>
      <TableCell className="w-[28px] px-1 py-1 text-center align-middle leading-none">
        <div className="inline-flex items-center justify-center">
          {showsWithSetlists.has(show.show_id) ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/dpro/setlist/${show.show_id}`}
                    aria-label="View setlist"
                    className="inline-flex items-center justify-center rounded p-0.5 text-emerald-600 hover:text-emerald-500"
                  >
                    <FileMusic className="size-3.5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <span className="text-[11px]">Setlist scan</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="inline-block size-3.5" aria-hidden />
          )}
        </div>
      </TableCell>
      <TableCell className="w-[28px] px-1 py-1 text-center align-middle leading-none">
        <div className="inline-flex items-center justify-center">
          {showsWithReleases.has(show.show_id) ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/dpro/setlist/${show.show_id}`}
                    aria-label="View releases"
                    className="inline-flex items-center justify-center rounded p-0.5 text-rose-600 hover:text-rose-500"
                  >
                    <AudioLines className="size-3.5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <span className="text-[11px]">Media available</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="inline-block size-3.5" aria-hidden />
          )}
        </div>
      </TableCell>
      <TableCell className="w-[32px] px-1 py-1 text-center align-middle text-[11px] font-medium leading-none">
        <div className="inline-flex items-center justify-center">
          {attendeeCount > 0 ? attendeeCount : ""}
        </div>
      </TableCell>
      <TableCell className="w-[28px] px-1 py-1 text-center align-middle leading-none">
        <div className="inline-flex items-center justify-center">
          {show.show_wl_link ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={show.show_wl_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Wysteria Lane article"
                    className="inline-flex items-center justify-center rounded hover:opacity-90"
                  >
                    <Image
                      src="/WL.png"
                      alt="Wysteria Lane"
                      width={14}
                      height={14}
                      className="h-3.5 w-auto block"
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <span className="text-[11px]">
                    Chat in the Community Forum
                  </span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="inline-block size-3.5" aria-hidden />
          )}
        </div>
      </TableCell>
      <TableCell className="w-[28px] px-1 py-1 text-center align-middle leading-none">
        <div className="inline-flex items-center justify-center">
          {showsWithRadioIds.has(show.show_id) ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/dpro/setlist/${show.show_id}`}
                    aria-label="WTED Goose Radio"
                    className="inline-flex items-center justify-center rounded hover:opacity-90"
                  >
                    <Image
                      src="/WTED.png"
                      alt="WTED Goose Radio"
                      width={14}
                      height={14}
                      className="h-3.5 w-auto block"
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <span className="text-[11px]">WTED Goose Radio</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="inline-block size-3.5" aria-hidden />
          )}
        </div>
      </TableCell>
      <TableCell className="px-2 py-1 text-[11px] text-muted-foreground">
        {show.show_detail}
        {show.show_detail && show.show_alert ? <>&nbsp;&nbsp;</> : null}
        {show.show_alert ? (
          <span className="font-medium text-red-500">
            [{show.show_alert}]
          </span>
        ) : null}
      </TableCell>
    </TableRow>
  )
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
  const [sortColumn, setSortColumn] = useState<SortColumn>("show_date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection(column === "rating" ? "desc" : "asc")
    }
  }

  const sortedShows = [...shows].sort((a, b) => {
    let valueA: any
    let valueB: any

    switch (sortColumn) {
      case "show_date":
        valueA = new Date(a.show_date).getTime()
        valueB = new Date(b.show_date).getTime()
        break
      case "rating":
        valueA = showRatings[a.show_id] || 0
        valueB = showRatings[b.show_id] || 0
        break
      case "show_group":
        valueA = a.show_group || ""
        valueB = b.show_group || ""
        break
      case "show_subvenue":
        valueA = a.show_subvenue || ""
        valueB = b.show_subvenue || ""
        break
      case "show_venue_location":
        valueA = a.show_venue_location || ""
        valueB = b.show_venue_location || ""
        break
      case "show_detail":
        valueA = a.show_detail || ""
        valueB = b.show_detail || ""
        break
      case "attendee_count":
        valueA = attendeeCounts[a.show_id] || 0
        valueB = attendeeCounts[b.show_id] || 0
        break
      default:
        valueA = new Date(a.show_date).getTime()
        valueB = new Date(b.show_date).getTime()
    }

    if (typeof valueA === "string" && typeof valueB === "string") {
      const comparison = valueA.localeCompare(valueB)
      if (comparison !== 0) {
        return sortDirection === "asc" ? comparison : -comparison
      }
    } else if (valueA !== valueB) {
      return sortDirection === "asc" ? valueA - valueB : valueB - valueA
    }

    if (sortColumn !== "show_date") {
      const dateA = new Date(a.show_date).getTime()
      const dateB = new Date(b.show_date).getTime()
      if (dateA !== dateB) {
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA
      }
    }

    const canonIdA = a.show_canonid === null ? -1 : a.show_canonid
    const canonIdB = b.show_canonid === null ? -1 : b.show_canonid
    if (canonIdA !== canonIdB) {
      return sortDirection === "asc" ? canonIdA - canonIdB : canonIdB - canonIdA
    }

    const groupA = a.show_group || ""
    const groupB = b.show_group || ""
    return groupA.localeCompare(groupB)
  })

  if (loading) {
    return (
      <Card className="ring-0 border border-border/60 bg-card/80">
        <CardContent className="flex items-center justify-center px-4 py-8 text-xs text-muted-foreground">
          Loading shows…
        </CardContent>
      </Card>
    )
  }

  if (!loading && shows.length === 0) {
    return (
      <Card className="ring-0 border border-border/60 bg-card/80">
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

  const sortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return null
    return sortDirection === "asc" ? "↑" : "↓"
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80">
      <CardContent className="p-0">
        <Table className="min-w-max text-[11px]">
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="w-[4px] p-0" />
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
                  src="/WTED.png"
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

