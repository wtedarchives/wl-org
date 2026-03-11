"use client"

import { useRef, useEffect } from "react"
import { ChevronDown, Search } from "lucide-react"
import { getShowDisplayData } from "@/lib/utils/show-utils"
import type { AdminShowData } from "@/types/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AdminShowDropdownProps {
  isOpen: boolean
  onToggle: () => void
  searchTerm: string
  onSearchChange: (term: string) => void
  filteredShows: AdminShowData[]
  onShowSelect: (show: AdminShowData) => void
  loading: boolean
  loadingProgress: number
  selectedShow?: AdminShowData | null
}

export function AdminShowDropdown({
  isOpen,
  onToggle,
  searchTerm,
  onSearchChange,
  filteredShows,
  onShowSelect,
  loading,
  loadingProgress,
  selectedShow,
}: AdminShowDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const selectedShowRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onToggle()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, onToggle])

  useEffect(() => {
    if (
      isOpen &&
      selectedShow &&
      selectedShowRef.current &&
      scrollContainerRef.current
    ) {
      setTimeout(() => {
        selectedShowRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        })
      }, 100)
    }
  }, [isOpen, selectedShow])

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="gap-2"
      >
        Show
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
                placeholder="Search shows..."
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
                  Loading shows ({Math.round(loadingProgress)}%)
                </p>
              </div>
            ) : (
              <>
                {filteredShows.map((show) => {
                  const { dateStr, canonIdStr, locationStr } =
                    getShowDisplayData(show)
                  return (
                    <button
                      key={show.show_id}
                      ref={
                        selectedShow?.show_id === show.show_id
                          ? selectedShowRef
                          : null
                      }
                      onClick={() => onShowSelect(show)}
                      className={`w-full px-2 py-1 text-left text-xs transition-colors hover:bg-muted ${
                        selectedShow?.show_id === show.show_id ? "bg-muted" : ""
                      }`}
                    >
                      <span className="font-bold">{dateStr}</span>
                      {canonIdStr}
                      {locationStr}
                    </button>
                  )
                })}
                {filteredShows.length === 0 && !loading && (
                  <div className="px-2 py-1 text-center text-xs text-muted-foreground">
                    No shows found
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
