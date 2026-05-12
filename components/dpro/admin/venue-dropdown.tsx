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
      className="wl-home-v2-archive-admin-floating-dropdown wl-home-v2-archive-admin-floating-dropdown--wide fixed"
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
              <Search className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-white/40" />
            </div>
          </div>
          <div
            ref={scrollContainerRef}
            className="max-h-64 overflow-y-auto divide-y divide-[rgb(49,51,49)]"
          >
            {loading && loadingProgress < 100 ? (
              <div className="wl-home-v2-archive-admin-floating-dropdown-loading">
                <div className="wl-home-v2-archive-admin-floating-dropdown-loading-dots">
                  <div className="wl-home-v2-archive-admin-floating-dropdown-loading-dot" />
                  <div className="wl-home-v2-archive-admin-floating-dropdown-loading-dot" />
                  <div className="wl-home-v2-archive-admin-floating-dropdown-loading-dot" />
                </div>
                <p className="wl-home-v2-archive-admin-floating-dropdown-loading-text">
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
                      type="button"
                      onClick={() => onVenueSelect(venue)}
                      className={
                        "wl-home-v2-archive-admin-floating-dropdown__row" +
                        (isSelected
                          ? " wl-home-v2-archive-admin-floating-dropdown__row--selected"
                          : "")
                      }
                    >
                      <span className="font-medium">{venue.venue}</span> [
                      {venue.venue_location}]
                    </button>
                  )
                })}
                {filteredVenues.length === 0 && !loading && (
                  <div className="wl-home-v2-archive-admin-floating-dropdown-empty">
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
