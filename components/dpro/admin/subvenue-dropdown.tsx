"use client"

import { useRef, useEffect, useState, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react"
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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const selectedSubvenueRef = useRef<HTMLButtonElement | null>(null)

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

  const dropdownContent = isOpen && (
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
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search subvenues..."
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
                      type="button"
                      ref={isSelected ? selectedSubvenueRef : null}
                      onClick={() => onSubvenueSelect(subvenue)}
                      className={
                        "wl-home-v2-archive-admin-floating-dropdown__row" +
                        (isSelected
                          ? " wl-home-v2-archive-admin-floating-dropdown__row--selected"
                          : "")
                      }
                    >
                      <span className="wl-home-v2-archive-admin-floating-dropdown__row-line">
                        {getSubvenueDisplayText(subvenue, allVenues)}
                      </span>
                    </button>
                  )
                })}
                {filteredSubvenues.length === 0 && !loading && (
                  <div className="wl-home-v2-archive-admin-floating-dropdown-empty">
                    No subvenues found
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
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="wl-home-v2-tours-header-pill gap-1"
      >
        Subvenue
        <CaretDown className="size-3.5 shrink-0 opacity-80" aria-hidden />
      </Button>
      {dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  )
}
