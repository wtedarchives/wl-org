"use client"

import { useRef, useEffect, useState, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react"
import { scrollChildIntoContainer } from "@/lib/scroll-child-into-container"
import { getShowDisplayData } from "@/lib/utils/show-utils"
import { cn } from "@/lib/utils"
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
  /**
   * When portaling: anchor the menu’s **left** edge to the trigger’s left edge
   * (viewport coords). Use in wide modals so the panel doesn’t extend past the
   * dialog’s left clipped edge. Ignored when `portalToBody` is false.
   */
  portalAlignTriggerStart?: boolean
  /**
   * When not portaling: `left` = align menu’s left edge to trigger; `right` =
   * current behavior (menu’s right edge to trigger’s right).
   */
  menuAlign?: "left" | "right"
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
  triggerLabel = "Select show",
  portalToBody = true,
  portalAlignTriggerStart = false,
  menuAlign = "right",
}: AdminShowDropdownProps) {
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number
    left?: number
    right?: number
  }>({ top: 0, right: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const selectedShowRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!portalToBody || !isOpen || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    if (portalAlignTriggerStart) {
      const margin = 8
      const w = 320
      const left = Math.max(
        margin,
        Math.min(rect.left, window.innerWidth - w - margin),
      )
      setDropdownPosition({ top: rect.bottom + margin, left })
    } else {
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
  }, [isOpen, portalToBody, portalAlignTriggerStart])

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
      const container = scrollContainerRef.current
        const child = selectedShowRef.current
        if (container && child) scrollChildIntoContainer(container, child)
    }
  }, [isOpen, selectedShow])

  const portalPositionStyle =
    portalToBody ?
      portalAlignTriggerStart ?
        ({
          ["--adm-dd-top" as string]: `${dropdownPosition.top}px`,
          ["--adm-dd-left" as string]: `${dropdownPosition.left ?? 8}px`,
        } as CSSProperties)
      : ({
          ["--adm-dd-top" as string]: `${dropdownPosition.top}px`,
          ["--adm-dd-right" as string]: `${dropdownPosition.right}px`,
        } as CSSProperties)
    : undefined

  const dropdownInner = (
    <>
      <div className="wl-home-v2-archive-admin-floating-dropdown__search">
        <div className="relative">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
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
                    selectedShow?.show_id === show.show_id ?
                      selectedShowRef
                    : null
                  }
                  onClick={() => onShowSelect(show)}
                  className={
                    "wl-home-v2-archive-admin-floating-dropdown__row " +
                    "wl-home-v2-archive-admin-floating-dropdown__row--compact" +
                    (selectedShow?.show_id === show.show_id ?
                      " wl-home-v2-archive-admin-floating-dropdown__row--selected"
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
    </>
  )

  const dropdownPanel = (
    <div
      ref={dropdownRef}
      data-admin-show-dropdown-panel=""
      className={cn(
        "wl-home-v2-archive-admin-floating-dropdown wl-home-v2-archive-admin-floating-dropdown--wide",
        portalToBody ?
          portalAlignTriggerStart ?
            "fixed wl-home-v2-archive-admin-floating-dropdown--anchor-tl"
          : "fixed wl-home-v2-archive-admin-floating-dropdown--anchor-tr"
        : "wl-home-v2-archive-admin-floating-dropdown--stack-local absolute top-[calc(100%+0.5rem)]",
        !portalToBody && menuAlign === "left" ? "left-0"
        : !portalToBody ? "right-0"
        : "",
      )}
      style={
        !portalToBody ? undefined
        : portalPositionStyle
      }
    >
      {dropdownInner}
    </div>
  )

  const trigger = (
    <Button
      ref={triggerRef}
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="wl-home-v2-tours-header-pill gap-1"
    >
      {triggerLabel}
      <CaretDown className="size-3.5 shrink-0 opacity-80" aria-hidden />
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
