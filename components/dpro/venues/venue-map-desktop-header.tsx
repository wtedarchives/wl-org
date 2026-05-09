"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface VenueMapDesktopHeaderProps {
  venueCount: number
  hasActiveFilters: boolean
  selectedTour: string
  selectedGroup: string
  tours: Array<{ tour: string }>
  groups: Array<{ group: string }>
  isGroupDropdownDisabled: boolean
  onClearFilters: () => void
  onTourChange: (value: string) => void
  onGroupChange: (value: string) => void
  wlHomeV2?: boolean
}

export function VenueMapDesktopHeader({
  venueCount,
  hasActiveFilters,
  selectedTour,
  selectedGroup,
  tours,
  groups,
  isGroupDropdownDisabled,
  onClearFilters,
  onTourChange,
  onGroupChange,
  wlHomeV2 = false,
}: VenueMapDesktopHeaderProps) {
  if (wlHomeV2) {
    return (
      <div className="venues-archive-map-toolbar mb-0 hidden justify-between gap-3 xl:flex xl:flex-wrap xl:items-center">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <div className="venues-archive-map-count whitespace-nowrap">
            Showing {venueCount} venues
          </div>
          {hasActiveFilters ?
            <button
              type="button"
              className="venues-archive-map-clear-btn venues-archive-map-clear-btn--text"
              onClick={onClearFilters}
            >
              Clear filter
            </button>
          : null}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex min-w-0 items-center gap-2">
            <label
              htmlFor="tour-filter"
              className="venues-archive-map-field-label shrink-0"
            >
              Tour
            </label>
            <Select value={selectedTour} onValueChange={onTourChange}>
              <SelectTrigger
                id="tour-filter"
                className="venues-archive-map-select-trigger h-8 w-[min(100vw-8rem,180px)] min-w-[8.5rem] text-xs shadow-none"
              >
                <SelectValue placeholder="[Show All]" />
              </SelectTrigger>
              <SelectContent className="venues-archive-map-select-content z-[1000]">
                <SelectItem value="Show All">[Show All]</SelectItem>
                {tours.map((tour) => (
                  <SelectItem key={tour.tour} value={tour.tour}>
                    {tour.tour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <label
              htmlFor="group-filter"
              className="venues-archive-map-field-label shrink-0"
            >
              Group
            </label>
            <Select value={selectedGroup} onValueChange={onGroupChange}>
              <SelectTrigger
                id="group-filter"
                disabled={isGroupDropdownDisabled}
                className="venues-archive-map-select-trigger h-8 w-[min(100vw-8rem,180px)] min-w-[8.5rem] text-xs shadow-none disabled:cursor-not-allowed disabled:opacity-45"
              >
                <SelectValue placeholder="[Show All]" />
              </SelectTrigger>
              <SelectContent className="venues-archive-map-select-content z-[1000]">
                <SelectItem value="Show All">[Show All]</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.group} value={group.group}>
                    {group.group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-2 hidden xl:flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-xs font-medium text-muted-foreground">
          Showing {venueCount} venues
        </div>
        {hasActiveFilters && (
          <Button
            variant="destructive"
            size="sm"
            className="h-7 text-xs"
            onClick={onClearFilters}
          >
            Clear Filter
          </Button>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label
            htmlFor="tour-filter"
            className="text-xs font-medium text-muted-foreground"
          >
            Filter by tour:
          </label>
          <Select value={selectedTour} onValueChange={onTourChange}>
            <SelectTrigger id="tour-filter" className="h-7 w-[180px] text-xs">
              <SelectValue placeholder="[Show All]" />
            </SelectTrigger>
            <SelectContent className="z-[1000]">
              <SelectItem value="Show All">[Show All]</SelectItem>
              {tours.map((tour) => (
                <SelectItem key={tour.tour} value={tour.tour}>
                  {tour.tour}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor="group-filter"
            className="text-xs font-medium text-muted-foreground"
          >
            Filter by group:
          </label>
          <Select
            value={selectedGroup}
            onValueChange={onGroupChange}
            disabled={isGroupDropdownDisabled}
          >
            <SelectTrigger
              id="group-filter"
              className={`h-7 w-[180px] text-xs ${
                isGroupDropdownDisabled ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              <SelectValue placeholder="[Show All]" />
            </SelectTrigger>
            <SelectContent className="z-[1000]">
              <SelectItem value="Show All">[Show All]</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.group} value={group.group}>
                  {group.group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
