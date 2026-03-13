"use client"

import { useState } from "react"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Search, X } from "lucide-react"
import { useAttendShowData } from "@/hooks/use-attend-show-data"
import { useYearsData } from "@/hooks/use-years-data"
import {
  useTableSort,
  getFilteredAndSortedShows,
} from "@/hooks/use-table-sort"
import { AttendShowManagerTable } from "./attend-show-manager-table"

interface AttendShowManagerProps {
  onClose: () => void
}

export function AttendShowManager({ onClose }: AttendShowManagerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { years, yearFilter, setYearFilter } = useYearsData()
  const { shows, loading, handleAttendanceToggle } =
    useAttendShowData(yearFilter)
  const { sortColumn, sortDirection, handleSort, getSortIcon } =
    useTableSort()

  const filteredShows = getFilteredAndSortedShows(
    shows,
    searchQuery,
    sortColumn,
    sortDirection
  )

  return (
    <Card className="max-w-6xl">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onClose}
            aria-label="Back to attended shows"
          >
            <ChevronLeft className="size-5" />
          </Button>
          <h2 className="text-sm font-semibold">Manage Attended Shows</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search shows…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-8 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                {yearFilter || "Select Year"}
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
              {years.map((year) => (
                <DropdownMenuItem
                  key={year}
                  onClick={() => setYearFilter(year)}
                >
                  {year}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Check the boxes next to shows you&apos;ve attended to add them to
          your list. Uncheck to remove them.
        </p>
        <AttendShowManagerTable
          shows={filteredShows}
          loading={loading}
          searchQuery={searchQuery}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          getSortIcon={getSortIcon}
          onAttendanceToggle={handleAttendanceToggle}
        />
      </CardContent>
    </Card>
  )
}
