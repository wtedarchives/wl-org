"use client"

import { useRef, useEffect, useState, type CSSProperties } from "react"
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
      className="wl-home-v2-archive-admin-floating-dropdown fixed wl-home-v2-archive-admin-floating-dropdown--anchor-tlw"
      style={
        {
          ["--adm-dd-top" as string]: `${dropdownPosition.top}px`,
          ["--adm-dd-left" as string]: `${dropdownPosition.left}px`,
          ["--adm-dd-width" as string]:
            dropdownPosition.width > 0 ? `${dropdownPosition.width}px` : "100%",
        } as CSSProperties
      }
    >
          <div className="wl-home-v2-archive-admin-floating-dropdown__search">
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
          <div className="wl-home-v2-archive-admin-floating-dropdown__scroll max-h-40 divide-y divide-[rgb(49,51,49)]">
            {filteredVenues.map((venue) => (
              <button
                key={venue.venue}
                type="button"
                onClick={() => onVenueSelect(venue)}
                className="wl-home-v2-archive-admin-floating-dropdown__row"
              >
                <span className="wl-home-v2-archive-admin-floating-dropdown__row-line">
                  <span className="font-medium">{venue.venue}</span>
                  {" ["}
                  {venue.venue_location}
                  {"]"}
                </span>
              </button>
            ))}
            {filteredVenues.length === 0 && (
              <div className="wl-home-v2-archive-admin-floating-dropdown-empty">
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
