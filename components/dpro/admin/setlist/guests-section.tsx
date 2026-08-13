"use client"

import { ChevronDown, ChevronUp, Search, X } from "lucide-react"
import type { GuestCategory } from "@/types/admin"
import { Input } from "@/components/ui/input"

interface GuestsSectionProps {
  allGuests: GuestCategory[]
  selectedGuestIds: string[]
  guestSearchTerm: string
  setGuestSearchTerm: (term: string) => void
  isGuestSectionExpanded: boolean
  setIsGuestSectionExpanded: (expanded: boolean) => void
  isEditing: boolean
  isNewEntry: boolean
  handleGuestSelection: (guestId: string) => void
  handleSelectAllGooseMembers: () => void
}

export function GuestsSection({
  allGuests,
  selectedGuestIds,
  guestSearchTerm,
  setGuestSearchTerm,
  isGuestSectionExpanded,
  setIsGuestSectionExpanded,
  isEditing,
  isNewEntry,
  handleGuestSelection,
  handleSelectAllGooseMembers,
}: GuestsSectionProps) {
  const canEdit = isEditing || isNewEntry
  const filteredGuestsByCategory = !guestSearchTerm
    ? allGuests
    : allGuests
        .map((cat) => ({
          ...cat,
          guests: cat.guests.filter(
            (g) =>
              g.guest.toLowerCase().includes(guestSearchTerm.toLowerCase()) ||
              g.guest_displayname
                ?.toLowerCase()
                .includes(guestSearchTerm.toLowerCase()) ||
              g.guest_instrument
                ?.toLowerCase()
                .includes(guestSearchTerm.toLowerCase())
          ),
        }))
        .filter((cat) => cat.guests.length > 0)

  return (
    <div className="mt-2 md:col-span-6">
      <div className="flex flex-col space-y-0.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="block text-xs font-medium">Personnel</label>
            {canEdit && (
              <button
                type="button"
                onClick={handleSelectAllGooseMembers}
                className="rounded border px-2 py-0.5 text-xs font-medium hover:bg-muted"
              >
                Select All Goose Members
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsGuestSectionExpanded(!isGuestSectionExpanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isGuestSectionExpanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
        </div>
        {selectedGuestIds.length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {selectedGuestIds.map((guestId) => {
              const guestInfo = allGuests
                .flatMap((c) => c.guests)
                .find((g) => g.guest_id === guestId)
              if (!guestInfo) return null
              return (
                <div
                  key={guestId}
                  className="flex items-center gap-1 rounded border bg-muted px-2 py-0.5 text-xs"
                >
                  <span>
                    {guestInfo.guest_displayname ?? guestInfo.guest}
                  </span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleGuestSelection(guestId)
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      {isGuestSectionExpanded && (
        <div
          className={`mt-2 rounded border p-2 ${canEdit ? "bg-muted/30" : "bg-muted/10"}`}
        >
          {canEdit && (
            <div className="mb-2">
              <div className="relative">
                <Input
                  type="text"
                  value={guestSearchTerm}
                  onChange={(e) => setGuestSearchTerm(e.target.value)}
                  placeholder="Search personnel..."
                  className="h-8 pr-8 text-xs"
                />
                <Search className="absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          )}
          {filteredGuestsByCategory.length > 0 ? (
            <div className="max-h-60 overflow-y-auto">
              {filteredGuestsByCategory.map((category) => (
                <div key={category.category} className="mb-3">
                  <h4 className="mb-1 text-xs font-medium">
                    {category.category}
                  </h4>
                  <div className="space-y-1">
                    {category.guests.map((guest) => (
                      <div
                        key={guest.guest_id}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          id={`guest-${guest.guest_id}`}
                          checked={selectedGuestIds.includes(guest.guest_id)}
                          onChange={() => handleGuestSelection(guest.guest_id)}
                          disabled={!canEdit}
                          className="size-4 rounded border"
                        />
                        <label
                          htmlFor={`guest-${guest.guest_id}`}
                          className="cursor-pointer text-xs"
                        >
                          {guest.guest_displayname ?? guest.guest}
                          {guest.guest_instrument &&
                            ` (${guest.guest_instrument})`}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              {guestSearchTerm
                ? "No guests found matching your search"
                : "No guests available"}
            </p>
          )}
          {selectedGuestIds.length > 0 && (
            <div className="mt-2 border-t pt-2">
              <p className="text-xs">
                Selected guests: {selectedGuestIds.length}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
