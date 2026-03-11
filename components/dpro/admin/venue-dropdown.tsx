"use client"

import { useRef, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Search } from "lucide-react"
import type { VenueData } from "@/types/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface VenueDropdownProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  searchTerm: string
  onSearchChange: (term: string) => void
  filteredVenues: VenueData[]
  onVenueSelect: (venue: VenueData) => void
  loading: boolean
  loadingProgress: number
  selectedVenue?: VenueData | null
}

export function VenueDropdown({
  isOpen,
  onToggle,
  onClose,
  searchTerm,
  onSearchChange,
  filteredVenues,
  onVenueSelect,
  loading,
  loadingProgress,
  selectedVenue,
}: VenueDropdownProps) {
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const selectedVenueRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        isOpen &&
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, onClose])

  useEffect(() => {
    if (
      isOpen &&
      selectedVenue &&
      selectedVenueRef.current &&
      scrollContainerRef.current
    ) {
      setTimeout(() => {
        selectedVenueRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        })
      }, 100)
    }
  }, [isOpen, selectedVenue])

  const dropdownContent = isOpen && (
    <div
      ref={dropdownRef}
      className="fixed z-[100] w-80 max-h-[min(24rem,calc(100vh-8rem))] overflow-y-auto rounded-md border bg-background shadow-lg"
      style={{
        top: dropdownPosition.top,
        right: dropdownPosition.right,
      }}
    >
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
          <div
            ref={scrollContainerRef}
            className="max-h-64 overflow-y-auto divide-y"
          >
            {loading && loadingProgress < 100 ? (
              <div className="flex flex-col items-center justify-center p-3 h-16">
                <div className="flex gap-2">
                  <div className="size-3 animate-pulse rounded-lg bg-muted" />
                  <div className="size-3 animate-pulse rounded-lg bg-muted [animation-delay:150ms]" />
                  <div className="size-3 animate-pulse rounded-lg bg-muted [animation-delay:300ms]" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Loading venues ({Math.round(loadingProgress)}%)
                </p>
              </div>
            ) : (
              <>
                {filteredVenues.map((venue) => {
                  const isSelected =
                    selectedVenue &&
                    venue.venue === selectedVenue.venue &&
                    venue.venue_location === selectedVenue.venue_location
                  return (
                    <button
                      key={`${venue.venue}-${venue.venue_location}`}
                      ref={isSelected ? selectedVenueRef : null}
                      onClick={() => onVenueSelect(venue)}
                      className={`w-full px-2 py-1 text-left text-xs transition-colors hover:bg-muted ${
                        isSelected ? "bg-muted" : ""
                      }`}
                    >
                      <span className="font-medium">{venue.venue}</span> [
                      {venue.venue_location}]
                    </button>
                  )
                })}
                {filteredVenues.length === 0 && !loading && (
                  <div className="px-2 py-1 text-center text-xs text-muted-foreground">
                    No venues found
                  </div>
                )}
              </>
            )}
          </div>
        </div>
  )

  return (
    <>
      <Button
        ref={triggerRef}
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="gap-2"
      >
        Venue
        <ChevronDown className="size-4" />
      </Button>
      {dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  )
}
