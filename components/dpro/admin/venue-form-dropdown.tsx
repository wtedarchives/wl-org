"use client"

import { useRef, useEffect } from "react"
import { ChevronDown, Search } from "lucide-react"
import type { VenueDataBasic } from "@/types/admin"
import { Input } from "@/components/ui/input"

interface VenueFormDropdownProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  searchTerm: string
  onSearchChange: (term: string) => void
  filteredVenues: VenueDataBasic[]
  onVenueSelect: (venue: VenueDataBasic) => void
  selectedVenue: string
}

export function VenueFormDropdown({
  isOpen,
  onToggle,
  onClose,
  searchTerm,
  onSearchChange,
  filteredVenues,
  onVenueSelect,
  selectedVenue,
}: VenueFormDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, onClose])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={onToggle}
        className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-2 text-left text-xs"
      >
        <span className="truncate">
          {selectedVenue || "Select venue..."}
        </span>
        <ChevronDown className="size-4 shrink-0" />
      </button>
      {isOpen && (
        <div className="absolute left-0 z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-background shadow-lg">
          <div className="p-1">
            <div className="relative">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search venues..."
                className="h-8 pr-8 text-xs"
              />
              <Search className="absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto divide-y">
            {filteredVenues.map((venue) => (
              <button
                key={venue.venue}
                type="button"
                onClick={() => onVenueSelect(venue)}
                className="w-full px-2 py-1 text-left text-xs transition-colors hover:bg-muted"
              >
                <span className="font-medium">{venue.venue}</span> [
                {venue.venue_location}]
              </button>
            ))}
            {filteredVenues.length === 0 && (
              <div className="px-2 py-1 text-center text-xs text-muted-foreground">
                No venues found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
