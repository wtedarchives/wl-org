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
            className="fixed z-[100] w-64 max-h-[min(24rem,calc(100vh-8rem))] overflow-y-auto rounded-md border bg-background shadow-lg"
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
                <Search className="absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            <div
              ref={scrollContainerRef}
              className="max-h-64 overflow-y-auto divide-y"
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
                  className={`w-full px-2 py-1 text-left text-xs transition-colors hover:bg-muted ${
                    selectedGuest?.guest_id === guest.guest_id ? "bg-muted" : ""
                  }`}
                >
                  {guest.guest}
                </button>
              ))}
              {filteredGuests.length === 0 && (
                <div className="px-2 py-1 text-center text-xs text-muted-foreground">
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
