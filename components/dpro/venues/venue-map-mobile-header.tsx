"use client"

import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VenueMapMobileHeaderProps {
  venueCount: number
  hasActiveFilters: boolean
  onClearFilters: () => void
  onOpenFilterModal: () => void
}

export function VenueMapMobileHeader({
  venueCount,
  hasActiveFilters,
  onClearFilters,
  onOpenFilterModal,
}: VenueMapMobileHeaderProps) {
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
