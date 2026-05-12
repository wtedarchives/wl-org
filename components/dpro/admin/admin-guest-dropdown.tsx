"use client"

import { createPortal } from "react-dom"
import { ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  isOpen: boolean
  onToggle: () => void
  searchTerm: string
  onSearchChange: (value: string) => void
  filteredGuests: GuestData[]
  selectedGuest: GuestData | null
  onGuestSelect: (guest: GuestData) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  dropdownRef: React.RefObject<HTMLDivElement | null>
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  selectedGuestRef: React.RefObject<HTMLButtonElement | null>
  dropdownPosition: { top: number; right: number }
}

export function AdminGuestDropdown({
  isOpen,
  onToggle,
  searchTerm,
  onSearchChange,
  filteredGuests,
  selectedGuest,
  onGuestSelect,
  triggerRef,
  dropdownRef,
  scrollContainerRef,
  selectedGuestRef,
  dropdownPosition,
}: AdminGuestDropdownProps) {
  return (
    <div>
      <Button
        ref={triggerRef}
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="gap-2"
      >
        Personnel
        <ChevronDown className="size-4" />
      </Button>
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="wl-home-v2-archive-admin-floating-dropdown fixed"
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
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search guests..."
                  className="h-8 pr-8 text-xs"
                />
                <Search className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-white/40" />
              </div>
            </div>
            <div
              ref={scrollContainerRef}
              className="max-h-64 overflow-y-auto divide-y divide-[rgb(49,51,49)]"
            >
              {filteredGuests.map((guest) => (
                <button
                  key={guest.guest_id}
                  ref={
                    selectedGuest?.guest_id === guest.guest_id
                      ? selectedGuestRef
                      : null
                  }
                  type="button"
                  onClick={() => onGuestSelect(guest)}
                  className={
                    "wl-home-v2-archive-admin-floating-dropdown__row" +
                    (selectedGuest?.guest_id === guest.guest_id
                      ? " wl-home-v2-archive-admin-floating-dropdown__row--selected"
                      : "")
                  }
                >
                  {guest.guest}
                </button>
              ))}
              {filteredGuests.length === 0 && (
                <div className="wl-home-v2-archive-admin-floating-dropdown-empty">
                  No guests found
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
