"use client"

import { useRef, useEffect, useState } from "react"
import { createPortal } from "react-dom"
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
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
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

  const dropdownContent = isOpen && (
    <div
      ref={dropdownRef}
      className="fixed z-[100] max-h-[min(15rem,calc(100vh-8rem))] overflow-y-auto rounded-md border bg-background shadow-lg"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width || "100%",
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
  )

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={onToggle}
        className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-2 text-left text-xs"
      >
        <span className="truncate">
          {selectedVenue || "Select venue..."}
        </span>
        <ChevronDown className="size-4 shrink-0" />
      </button>
      {dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  )
}
