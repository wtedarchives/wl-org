"use client"

import { useState, useRef, useEffect, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react"
import { scrollChildIntoContainer } from "@/lib/scroll-child-into-container"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface GuestData {
  guest: string
  guest_id: string
  guest_displayname: string | null
  guest_instrument: string | null
  guest_category: string | null
  guest_canonid: number | null
}

interface AdminGuestDropdownProps {
  guests: GuestData[]
  onGuestSelect: (guest: GuestData) => void
  selectedGuest?: GuestData | null
  /** Merged onto the trigger (default: tours header pill). */
  triggerClassName?: string
}

export function AdminGuestDropdown({
  guests,
  onGuestSelect,
  selectedGuest,
  triggerClassName,
}: AdminGuestDropdownProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const selectedGuestRef = useRef<HTMLButtonElement | null>(null)

  const filteredGuests = guests.filter((g) => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return true
    const dn = (g.guest_displayname ?? "").toLowerCase()
    const inst = (g.guest_instrument ?? "").toLowerCase()
    return (
      g.guest.toLowerCase().includes(q) ||
      dn.includes(q) ||
      inst.includes(q)
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
      selectedGuest &&
      selectedGuestRef.current &&
      scrollContainerRef.current
    ) {
      const container = scrollContainerRef.current
        const child = selectedGuestRef.current
        if (container && child) scrollChildIntoContainer(container, child)
    }
  }, [isDropdownOpen, selectedGuest])

  const handleGuestSelect = (guest: GuestData) => {
    onGuestSelect(guest)
    setIsDropdownOpen(false)
    setSearchTerm("")
  }

  const dropdownContent = isDropdownOpen && (
    <div
      ref={dropdownRef}
      className={
        "wl-home-v2-archive-admin-floating-dropdown " +
        "wl-home-v2-archive-admin-floating-dropdown--wide fixed " +
        "wl-home-v2-archive-admin-floating-dropdown--anchor-tr"
      }
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
            placeholder="Search personnel..."
            className="h-8 pr-8 text-xs"
          />
          <MagnifyingGlass className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-white/40" />
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        className="wl-home-v2-archive-admin-floating-dropdown__scroll divide-y divide-[rgb(49,51,49)]"
      >
        {filteredGuests.map((guest) => (
          <button
            key={guest.guest_id}
            type="button"
            ref={
              selectedGuest?.guest_id === guest.guest_id
                ? selectedGuestRef
                : null
            }
            onClick={() => handleGuestSelect(guest)}
            className={
              "wl-home-v2-archive-admin-floating-dropdown__row " +
              "wl-home-v2-archive-admin-floating-dropdown__row--compact" +
              (selectedGuest?.guest_id === guest.guest_id
                ? " wl-home-v2-archive-admin-floating-dropdown__row--selected"
                : "")
            }
          >
            <span
              className={
                "wl-home-v2-archive-admin-floating-dropdown__row-line " +
                "wl-home-v2-archive-admin-song-dropdown__primary"
              }
            >
              {guest.guest}
            </span>
          </button>
        ))}
        {filteredGuests.length === 0 && (
          <div className="wl-home-v2-archive-admin-floating-dropdown-empty">
            No personnel found
          </div>
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
        className={cn("wl-home-v2-tours-header-pill gap-1", triggerClassName)}
      >
        Select personnel
        <CaretDown className="size-3.5 shrink-0 opacity-80" aria-hidden />
      </Button>
      {dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  )
}
