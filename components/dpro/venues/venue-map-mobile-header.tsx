"use client"

import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VenueMapMobileHeaderProps {
  venueCount: number
  hasActiveFilters: boolean
  onClearFilters: () => void
  onOpenFilterModal: () => void
  wlHomeV2?: boolean
}

export function VenueMapMobileHeader({
  venueCount,
  hasActiveFilters,
  onClearFilters,
  onOpenFilterModal,
  wlHomeV2 = false,
}: VenueMapMobileHeaderProps) {
  if (wlHomeV2) {
    return (
      <div className="venues-archive-map-toolbar mb-0 xl:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="venues-archive-map-count">
              {venueCount} venues
            </span>
            {hasActiveFilters ?
              <button
                type="button"
                className="venues-archive-map-clear-btn venues-archive-map-clear-btn--icon"
                onClick={onClearFilters}
                aria-label="Clear filters"
              >
                <X className="size-3.5 shrink-0 opacity-90" aria-hidden />
              </button>
            : null}
          </div>
          <button
            type="button"
            className="venues-archive-map-pill-btn venues-archive-map-pill-btn--sm"
            onClick={onOpenFilterModal}
          >
            <Filter className="size-3.5 shrink-0" aria-hidden />
            <span>Filter</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-2 xl:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {venueCount} venues
          </span>
          {hasActiveFilters && (
            <Button
              variant="destructive"
              size="icon"
              className="h-7 w-7"
              onClick={onClearFilters}
              aria-label="Clear filters"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={onOpenFilterModal}
        >
          <Filter className="size-4" />
          Filter
        </Button>
      </div>
    </div>
  )
}
