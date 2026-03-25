"use client"

import { useRef, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Search } from "lucide-react"
import { getShowDisplayData } from "@/lib/utils/show-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/** Minimal show shape for dropdown display (ShowData or AdminShowData) */
interface ShowForDropdown {
  show_id: string
  show_date: string
  show_canonid?: number | null
  show_group?: string
  show_subvenue?: string
  show_venue_location?: string | null
}

interface AdminShowDropdownProps {
  isOpen: boolean
  onToggle: () => void
  searchTerm: string
  onSearchChange: (term: string) => void
  filteredShows: ShowForDropdown[]
  onShowSelect: (show: ShowForDropdown) => void
  loading: boolean
  loadingProgress: number
  selectedShow?: ShowForDropdown | null
  triggerLabel?: string
  /**
   * When false, the menu is positioned under the trigger inside the parent
   * stacking context (required inside modal dialogs — portaling to body is
   * blocked by Radix inert/pointer behavior).
   */
  portalToBody?: boolean
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
  triggerLabel = "Show",
  portalToBody = true,
}: AdminShowDropdownProps) {
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const selectedShowRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!portalToBody || !isOpen || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setDropdownPosition({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    })
  }, [isOpen, portalToBody])

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

  const dropdownInner = (
    <>
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
                      className={`w-full px-2 py-1 text-left text-xs transition-colors hover:bg-background ${
                        selectedShow?.show_id === show.show_id ? "bg-background" : ""
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
    </>
  )

  const dropdownPanel = (
    <div
      ref={dropdownRef}
      className={
        portalToBody
          ? "fixed z-[100] w-80 max-h-[min(24rem,calc(100vh-8rem))] overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-lg"
          : "absolute right-0 top-[calc(100%+0.5rem)] z-[200] w-80 max-h-[min(24rem,calc(100vh-8rem))] overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-lg"
      }
      style={
        portalToBody
          ? {
              top: dropdownPosition.top,
              right: dropdownPosition.right,
            }
          : undefined
      }
    >
      {dropdownInner}
    </div>
  )

  const trigger = (
    <Button
      ref={triggerRef}
      variant="outline"
      size="sm"
      onClick={onToggle}
      className="gap-2"
    >
      {triggerLabel}
      <ChevronDown className="size-4" />
    </Button>
  )

  if (portalToBody) {
    return (
      <>
        {trigger}
        {isOpen ? createPortal(dropdownPanel, document.body) : null}
      </>
    )
  }

  return (
    <div className="relative inline-block">
      {trigger}
      {isOpen ? dropdownPanel : null}
    </div>
  )
}
