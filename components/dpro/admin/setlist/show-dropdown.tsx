"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Search } from "lucide-react"
import { formatDate } from "@/lib/utils/show-utils"
import type { ShowData } from "@/types/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ShowDropdownProps {
  shows: ShowData[]
  loading: boolean
  loadingProgress: number
  onShowSelect: (show: ShowData) => void
  selectedShow?: ShowData | null
}

export function ShowDropdown({
  shows,
  loading,
  loadingProgress,
  onShowSelect,
  selectedShow,
}: ShowDropdownProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const selectedShowRef = useRef<HTMLButtonElement | null>(null)

  const filteredShows = shows.filter((show) => {
    const searchLower = searchTerm.toLowerCase()
    const dateStr = formatDate(show.show_date)
    return (
      dateStr.includes(searchLower) ||
      show.show_canonid?.toString().includes(searchLower) ||
      show.show_group.toLowerCase().includes(searchLower) ||
      show.show_venue_location?.toLowerCase().includes(searchLower)
    )
  })

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (
      isDropdownOpen &&
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
  }, [isDropdownOpen, selectedShow])

  const handleShowSelect = (show: ShowData) => {
    onShowSelect(show)
    setIsDropdownOpen(false)
    setSearchTerm("")
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="gap-2"
      >
        Select Show
        <ChevronDown className="size-4" />
      </Button>
      {isDropdownOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-h-96 overflow-y-auto rounded-md border bg-muted shadow-lg">
          <div className="p-1">
            <div className="relative">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                {filteredShows.map((show) => (
                  <button
                    key={show.show_id}
                    ref={
                      selectedShow?.show_id === show.show_id
                        ? selectedShowRef
                        : null
                    }
                    onClick={() => handleShowSelect(show)}
                    className={`w-full px-2 py-1 text-left text-xs transition-colors hover:bg-background ${
                      selectedShow?.show_id === show.show_id ? "bg-background" : ""
                    }`}
                  >
                    <span className="font-bold">
                      {formatDate(show.show_date)}
                    </span>
                    {show.show_canonid ? ` [${show.show_canonid}]` : ""}{" "}
                    [{show.show_group} – {show.show_venue_location ?? "Unknown"}]
                  </button>
                ))}
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
