"use client"

import { useState } from "react"
import { ChevronDown, ChevronLeft, Search, X } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAttendShowData } from "@/hooks/use-attend-show-data"
import { useYearsData } from "@/hooks/use-years-data"
import {
  useTableSort,
  getFilteredAndSortedShows,
} from "@/hooks/use-table-sort"
import { AttendShowManagerTable } from "./attend-show-manager-table"

import "./attend-show-manage.css"

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
    sortDirection,
  )

  return (
    <section
      className="wl-attend-manage wl-attend-manage--root"
      aria-labelledby="wl-attend-manage-title"
    >
      <header className="wl-attend-manage__head">
        <div className="wl-attend-manage__head-left">
          <button
            type="button"
            className="wl-attend-manage__back"
            onClick={onClose}
            aria-label="Back to attended shows"
          >
            <ChevronLeft className="size-3.5 shrink-0 opacity-80" aria-hidden />
            <span>Back to Shows</span>
          </button>
          <h2 id="wl-attend-manage-title" className="wl-attend-manage__title">
            Manage Attended Shows
          </h2>
        </div>
        <div className="wl-attend-manage__toolbar">
          <div className="wl-attend-manage__search-wrap">
            <Search
              className="wl-attend-manage__search-icon"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search shows…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="wl-attend-manage__search-input"
              aria-label="Search shows"
              autoComplete="off"
            />
            {searchQuery ?
              <button
                type="button"
                className="wl-attend-manage__search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X className="size-3" aria-hidden />
              </button>
            : null}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="wl-attend-manage__year-trigger">
                {yearFilter || "Select Year"}
                <ChevronDown className="size-4 shrink-0 opacity-80" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="max-h-64 overflow-y-auto"
            >
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
      </header>
      <div className="wl-attend-manage__body">
        <p className="wl-attend-manage__hint">
          Check the boxes next to shows you&apos;ve attended to add them to
          your list. Uncheck to remove them.
        </p>
        <AttendShowManagerTable
          shows={filteredShows}
          loading={loading}
          searchQuery={searchQuery}
          onSort={handleSort}
          getSortIcon={getSortIcon}
          onAttendanceToggle={handleAttendanceToggle}
        />
      </div>
    </section>
  )
}
