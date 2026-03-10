"use client"

import { VenueSearch } from "@/components/dpro/venues/venue-search"
import { Card } from "@/components/ui/card"

interface VenueHeaderProps {
  venueName: string
  venueLocation: string | null
  onSearchOpenChange?: (open: boolean) => void
}

export function VenueHeader({
  venueName,
  venueLocation,
  onSearchOpenChange,
}: VenueHeaderProps) {
  return (
    <Card className="overflow-hidden border border-border/60 bg-card/80 shadow-sm py-0">
      <div className="bg-muted/60 px-3 py-1.5 flex justify-between items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <h1 className="text-sm font-semibold truncate">{venueName}</h1>
          {venueLocation && (
            <span className="hidden md:inline-flex rounded-md border border-border bg-wl-dark-green px-2 py-0.5 text-[10px] font-medium text-white shrink-0">
              {venueLocation}
            </span>
          )}
        </div>
        <VenueSearch onOpenChange={onSearchOpenChange} />
      </div>
      {venueLocation && (
        <div className="md:hidden border-t border-border/60 px-3 py-1.5">
          <span className="text-[10px] text-muted-foreground">
            {venueLocation}
          </span>
        </div>
      )}
    </Card>
  )
}
