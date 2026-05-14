"use client"

import { useState, useRef, useEffect, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react"
import { formatDate, getShowDisplayData } from "@/lib/utils/show-utils"
import type { ShowData } from "@/types/admin"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface ShowDropdownProps {
  shows: ShowData[]
  loading: boolean
  loadingProgress: number
  onShowSelect: (show: ShowData) => void
  selectedShow?: ShowData | null
  /** Merged onto the trigger (default: tours header pill). */
  triggerClassName?: string
}

export function ShowDropdown({
  shows,
  loading,
  loadingProgress,
  onShowSelect,
  selectedShow,
  triggerClassName,
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
      className="wl-home-v2-archive-admin-floating-dropdown wl-home-v2-archive-admin-floating-dropdown--wide fixed wl-home-v2-archive-admin-floating-dropdown--anchor-tr"
      style={
        {
          ["--adm-dd-top" as string]: `${dropdownPosition.top}px`,
          ["--adm-dd-right" as string]: `${dropdownPosition.right}px`,
        } as CSSProperties
      }
    >
      <div className="wl-home-v2-archive-admin-floating-dropdown__search">
        <div className="relative">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search shows..."
                className="h-8 pr-8 text-xs"
              />
              <MagnifyingGlass className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-white/40" />
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        className="wl-home-v2-archive-admin-floating-dropdown__scroll divide-y divide-[rgb(49,51,49)]"
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
                {filteredShows.map((show) => {
                  const { dateStr, canonIdStr, locationStr } =
                    getShowDisplayData(show)
                  return (
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
                      "wl-home-v2-archive-admin-floating-dropdown__row " +
                      "wl-home-v2-archive-admin-floating-dropdown__row--compact" +
                      (selectedShow?.show_id === show.show_id
                        ? " wl-home-v2-archive-admin-floating-dropdown__row--selected"
                        : "")
                    }
                  >
                    <span className="wl-home-v2-archive-admin-floating-dropdown__row-date">
                      {dateStr}
                    </span>
                    <span className="wl-home-v2-archive-admin-floating-dropdown__row-meta">
                      {canonIdStr}
                      {locationStr}
                    </span>
                  </button>
                  )
                })}
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
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={cn(
          "wl-home-v2-tours-header-pill gap-1",
          triggerClassName,
        )}
      >
        Select show
        <CaretDown className="size-3.5 shrink-0 opacity-80" aria-hidden />
      </Button>
      {dropdownContent &&
        createPortal(dropdownContent, document.body)}
    </>
  )
}
