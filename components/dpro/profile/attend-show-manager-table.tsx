"use client"

import Link from "next/link"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatShowDate } from "@/lib/utils/attendance-utils"
import type { AttendShow } from "@/hooks/use-attend-show-data"
import type { SortColumn, SortDirection } from "@/hooks/use-table-sort"

interface AttendShowManagerTableProps {
  shows: AttendShow[]
  loading: boolean
  searchQuery: string
  sortColumn: SortColumn
  sortDirection: SortDirection
  onSort: (column: SortColumn) => void
  getSortIcon: (column: SortColumn) => React.ReactNode
  onAttendanceToggle: (show: AttendShow) => void
}

export function AttendShowManagerTable({
  shows,
  loading,
  searchQuery,
  onSort,
  getSortIcon,
  onAttendanceToggle,
}: AttendShowManagerTableProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="flex gap-2">
          <div className="size-4 animate-pulse rounded-full bg-muted" />
          <div className="size-4 animate-pulse rounded-full bg-muted [animation-delay:150ms]" />
          <div className="size-4 animate-pulse rounded-full bg-muted [animation-delay:300ms]" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Loading shows…
        </p>
      </div>
    )
  }

  const emptyMsg = searchQuery
    ? "No shows matching your search"
    : "No shows found for this year"

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 text-center">
              <Check className="mx-auto size-4 text-muted-foreground" />
            </TableHead>
            <TableHead
              className="cursor-pointer text-center hover:bg-muted/50"
              onClick={() => onSort("show_date")}
            >
              Date {getSortIcon("show_date")}
            </TableHead>
            <TableHead
              className="cursor-pointer text-left hover:bg-muted/50"
              onClick={() => onSort("show_group")}
            >
              Group {getSortIcon("show_group")}
            </TableHead>
            <TableHead
              className="cursor-pointer text-left hover:bg-muted/50"
              onClick={() => onSort("show_subvenue")}
            >
              Venue {getSortIcon("show_subvenue")}
            </TableHead>
            <TableHead
              className="cursor-pointer text-left hover:bg-muted/50"
              onClick={() => onSort("show_venue_location")}
            >
              Location {getSortIcon("show_venue_location")}
            </TableHead>
            <TableHead className="text-left">Detail</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-8 text-center text-muted-foreground"
              >
                {emptyMsg}
              </TableCell>
            </TableRow>
          ) : (
            shows.map((show) => (
              <TableRow key={show.show_id} className="text-xs [&>td]:py-0.5">
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-5 w-5 shrink-0 rounded-sm ${
                      show.attended
                        ? "bg-green-600 text-white hover:bg-red-600 hover:text-white"
                        : "border border-muted-foreground/50 hover:bg-green-600 hover:text-white"
                    }`}
                    onClick={() => onAttendanceToggle(show)}
                    title={
                      show.attended
                        ? "Remove from attended shows"
                        : "Mark as attended"
                    }
                  >
                    <Check
                      className={`size-3 ${show.attended ? "text-white" : "text-muted-foreground/60"}`}
                    />
                  </Button>
                </TableCell>
                <TableCell className="text-center whitespace-nowrap">
                  <Link
                    href={`/archive/setlist/${show.show_id}`}
                    className="font-medium hover:underline"
                  >
                    {formatShowDate(show.show_date)}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {show.show_group}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {show.venue_id ? (
                    <Link
                      href={`/archive/venue/${show.venue_id}`}
                      className="text-foreground hover:underline"
                    >
                      {show.show_subvenue}
                    </Link>
                  ) : show.show_subvenue_venue ? (
                    <Link
                      href={`/archive/venue/${encodeURIComponent(show.show_subvenue_venue)}`}
                      className="text-foreground hover:underline"
                    >
                      {show.show_subvenue}
                    </Link>
                  ) : (
                    show.show_subvenue
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {show.show_venue_location}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {show.show_detail}
                  {show.show_detail && show.show_alert && " "}
                  {show.show_alert && (
                    <span className="font-medium text-destructive">
                      [{show.show_alert}]
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
