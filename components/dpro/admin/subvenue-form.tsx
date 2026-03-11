"use client"

import type { SubvenueData, VenueDataBasic } from "@/types/admin"
import { Input } from "@/components/ui/input"
import { VenueFormDropdown } from "./venue-form-dropdown"

interface SubvenueFormProps {
  editedSubvenue: SubvenueData | null
  isEditing: boolean
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  allVenues: VenueDataBasic[]
  isVenueDropdownOpen: boolean
  onVenueDropdownToggle: () => void
  onVenueDropdownClose: () => void
  venueSearchTerm: string
  onVenueSearchChange: (term: string) => void
  filteredVenues: VenueDataBasic[]
  onVenueSelect: (venue: VenueDataBasic) => void
}

export function SubvenueForm({
  editedSubvenue,
  isEditing,
  onInputChange,
  allVenues,
  isVenueDropdownOpen,
  onVenueDropdownToggle,
  onVenueDropdownClose,
  venueSearchTerm,
  onVenueSearchChange,
  filteredVenues,
  onVenueSelect,
}: SubvenueFormProps) {
  const getSelectedVenueDisplay = () => {
    if (!editedSubvenue?.subvenue_venue) return ""
    const venue = allVenues.find((v) => v.venue === editedSubvenue.subvenue_venue)
    return venue
      ? `${venue.venue} - ${venue.venue_location}`
      : editedSubvenue.subvenue_venue
  }

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      <div>
        <label className="mb-0.5 block text-xs font-medium">
          Subvenue Name
        </label>
        <Input
          type="text"
          name="subvenue"
          value={editedSubvenue?.subvenue ?? ""}
          onChange={onInputChange}
          readOnly={!isEditing}
          placeholder="Enter subvenue name"
          className="h-8 text-xs"
        />
      </div>
      <div>
        <label className="mb-0.5 block text-xs font-medium">Venue</label>
        {isEditing ? (
          <VenueFormDropdown
            isOpen={isVenueDropdownOpen}
            onToggle={onVenueDropdownToggle}
            onClose={onVenueDropdownClose}
            searchTerm={venueSearchTerm}
            onSearchChange={onVenueSearchChange}
            filteredVenues={filteredVenues}
            onVenueSelect={onVenueSelect}
            selectedVenue={getSelectedVenueDisplay()}
          />
        ) : (
          <Input
            value={getSelectedVenueDisplay()}
            readOnly
            className="h-8 text-xs"
          />
        )}
      </div>
      <div>
        <label className="mb-0.5 block text-xs font-medium">Start Date</label>
        <Input
          type="date"
          name="subvenue_startdate"
          value={editedSubvenue?.subvenue_startdate ?? ""}
          onChange={onInputChange}
          readOnly={!isEditing}
          className="h-8 text-xs"
        />
      </div>
      <div>
        <label className="mb-0.5 block text-xs font-medium">End Date</label>
        <Input
          type="date"
          name="subvenue_enddate"
          value={editedSubvenue?.subvenue_enddate ?? ""}
          onChange={onInputChange}
          readOnly={!isEditing}
          className="h-8 text-xs"
        />
      </div>
    </div>
  )
}
