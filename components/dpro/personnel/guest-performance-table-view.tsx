"use client"

import Link from "next/link"
import { ArrowUp, ArrowDown } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatSetlistDate } from "@/lib/setlist-utils"
import type { GuestShow } from "@/hooks/use-guest-data"

interface GuestPerformanceTableViewProps {
  performances: GuestShow[]
  sortColumn: string
  sortDirection: "asc" | "desc"
  handleSort: (column: string) => void
  selectedGroup: string | null
}

function SortIcon({
  column,
  sortColumn,
  sortDirection,
}: {
  column: string
  sortColumn: string
  sortDirection: "asc" | "desc"
}) {
  if (sortColumn !== column) return null
  return sortDirection === "asc" ? (
    <ArrowUp className="size-3.5 inline-block ml-0.5" />
  ) : (
    <ArrowDown className="size-3.5 inline-block ml-0.5" />
  )
}

export function GuestPerformanceTableView({
  performances,
  sortColumn,
  sortDirection,
  handleSort,
  selectedGroup,
}: GuestPerformanceTableViewProps) {
  const shouldHighlight = (perf: GuestShow) => {
    if (!selectedGroup) return true
    return perf.show_group === selectedGroup
  }

  const getVenueHref = (perf: GuestShow) => {
    if (perf.venue_id) return `/dpro/venue/${perf.venue_id}`
    if (perf.show_subvenue)
      return `/dpro/venue/${encodeURIComponent(perf.show_subvenue)}`
    if (perf.show_venue_location)
      return `/dpro/venue/${encodeURIComponent(perf.show_venue_location)}`
    return null
  }

  const cellPadding = "px-2 py-1"

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead
              className="cursor-pointer hover:bg-muted/60 text-xs text-center"
              onClick={() => handleSort("show_date")}
            >
              Show{" "}
              <SortIcon
                column="show_date"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              />
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/60 text-xs"
              onClick={() => handleSort("show_group")}
            >
              Group{" "}
              <SortIcon
                column="show_group"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              />
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/60 text-xs"
              onClick={() => handleSort("show_venue_location")}
            >
              Location{" "}
              <SortIcon
                column="show_venue_location"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {performances.map((perf) => {
            const isHighlighted = shouldHighlight(perf)
            const venueHref = getVenueHref(perf)

            return (
              <TableRow
                key={perf.show_id}
                className={`transition-colors ${
                  isHighlighted ? "bg-muted/60" : ""
                } ${selectedGroup && !isHighlighted ? "opacity-30" : "opacity-100"}`}
              >
                <TableCell
                  className={`text-xs whitespace-nowrap text-center ${cellPadding}`}
                >
                  <Link
                    href={`/dpro/setlist/${perf.show_id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {formatSetlistDate(perf.show_date)}
                  </Link>
                </TableCell>
                <TableCell className={`text-xs whitespace-nowrap ${cellPadding}`}>
                  {perf.show_group}
                </TableCell>
                <TableCell className={`text-xs whitespace-nowrap ${cellPadding}`}>
                  {venueHref ? (
                    <Link
                      href={venueHref}
                      className="underline-offset-4 hover:underline"
                    >
                      {perf.show_venue_location}
                    </Link>
                  ) : (
                    perf.show_venue_location
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
