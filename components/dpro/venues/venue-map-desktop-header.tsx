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
}: VenueMapDesktopHeaderProps) {
  return (
    <div className="mb-2 hidden xl:flex justify-between items-center">
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
            className="text-xs text-muted-foreground font-medium"
          >
            Filter by tour:
          </label>
          <Select
            value={selectedTour}
            onValueChange={onTourChange}
          >
            <SelectTrigger
              id="tour-filter"
              className="h-7 w-[180px] text-xs"
            >
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
            className="text-xs text-muted-foreground font-medium"
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
                isGroupDropdownDisabled
                  ? "opacity-50 cursor-not-allowed"
                  : ""
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
