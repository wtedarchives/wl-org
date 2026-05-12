"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
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
    if (isDropdownOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
  }, [isDropdownOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        isDropdownOpen &&
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isDropdownOpen])

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

  const dropdownContent = isDropdownOpen && (
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
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search shows..."
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
                  Loading shows ({Math.round(loadingProgress)}%)
                </p>
              </div>
            ) : (
              <>
                {filteredShows.map((show) => (
                  <button
                    key={show.show_id}
                    type="button"
                    ref={
                      selectedShow?.show_id === show.show_id
                        ? selectedShowRef
                        : null
                    }
                    onClick={() => handleShowSelect(show)}
                    className={
                      "wl-home-v2-archive-admin-floating-dropdown__row" +
                      (selectedShow?.show_id === show.show_id
                        ? " wl-home-v2-archive-admin-floating-dropdown__row--selected"
                        : "")
                    }
                  >
                    <span className="font-bold">
                      {formatDate(show.show_date)}
                    </span>
                    {show.show_canonid ? ` [${show.show_canonid}]` : ""}{" "}
                    [{show.show_group} – {show.show_venue_location ?? "Unknown"}]
                  </button>
                ))}
                {filteredShows.length === 0 && !loading && (
                  <div className="wl-home-v2-archive-admin-floating-dropdown-empty">
                    No shows found
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
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="gap-2"
      >
        Select Show
        <ChevronDown className="size-4" />
      </Button>
      {dropdownContent &&
        createPortal(dropdownContent, document.body)}
    </>
  )
}
