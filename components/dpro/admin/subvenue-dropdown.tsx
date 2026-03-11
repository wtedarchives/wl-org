"use client"

import { useRef, useEffect } from "react"
import { ChevronDown, Search } from "lucide-react"
import type { SubvenueData, VenueDataBasic } from "@/types/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SubvenueDropdownProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  searchTerm: string
  onSearchChange: (term: string) => void
  filteredSubvenues: SubvenueData[]
  onSubvenueSelect: (subvenue: SubvenueData) => void
  loading: boolean
  loadingProgress: number
  allVenues: VenueDataBasic[]
  selectedSubvenue?: SubvenueData | null
}

function getSubvenueDisplayText(
  subvenue: SubvenueData,
  allVenues: VenueDataBasic[]
) {
  const venue = allVenues.find((v) => v.venue === subvenue.subvenue_venue)
  return venue
    ? `${subvenue.subvenue} [${venue.venue_location}]`
    : `${subvenue.subvenue} [${subvenue.subvenue_venue}]`
}

export function SubvenueDropdown({
  isOpen,
  onToggle,
  onClose,
  searchTerm,
  onSearchChange,
  filteredSubvenues,
  onSubvenueSelect,
  loading,
  loadingProgress,
  allVenues,
  selectedSubvenue,
}: SubvenueDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const selectedSubvenueRef = useRef<HTMLButtonElement | null>(null)

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

  useEffect(() => {
    if (
      isOpen &&
      selectedSubvenue &&
      selectedSubvenueRef.current &&
      scrollContainerRef.current
    ) {
      setTimeout(() => {
        selectedSubvenueRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        })
      }, 100)
    }
  }, [isOpen, selectedSubvenue])

  return (
    <div className="relative" ref={dropdownRef}>
      <Button variant="outline" size="sm" onClick={onToggle} className="gap-2">
        Subvenue
        <ChevronDown className="size-4" />
      </Button>
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-h-96 overflow-y-auto rounded-md border bg-background shadow-lg">
          <div className="p-1">
            <div className="relative">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search subvenues..."
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
                  Loading subvenues ({Math.round(loadingProgress)}%)
                </p>
              </div>
            ) : (
              <>
                {filteredSubvenues.map((subvenue) => {
                  const isSelected =
                    selectedSubvenue &&
                    subvenue.subvenue === selectedSubvenue.subvenue
                  return (
                    <button
                      key={subvenue.subvenue}
                      ref={isSelected ? selectedSubvenueRef : null}
                      onClick={() => onSubvenueSelect(subvenue)}
                      className={`w-full px-2 py-1 text-left text-xs transition-colors hover:bg-muted ${
                        isSelected ? "bg-muted" : ""
                      }`}
                    >
                      {getSubvenueDisplayText(subvenue, allVenues)}
                    </button>
                  )
                })}
                {filteredSubvenues.length === 0 && !loading && (
                  <div className="px-2 py-1 text-center text-xs text-muted-foreground">
                    No subvenues found
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
