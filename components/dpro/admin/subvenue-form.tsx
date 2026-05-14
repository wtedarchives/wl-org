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
    <div className="wl-home-v2-archive-admin-song-form__grid">
      <div className="min-w-0">
        <label htmlFor="subvenue-admin-name">Subvenue Name</label>
        <Input
          id="subvenue-admin-name"
          type="text"
          name="subvenue"
          value={editedSubvenue?.subvenue ?? ""}
          onChange={onInputChange}
          readOnly={!isEditing}
          placeholder="Enter subvenue name"
        />
      </div>
      <div className="min-w-0">
        <label htmlFor="subvenue-admin-venue">Venue</label>
        {isEditing ?
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
        : <Input
            id="subvenue-admin-venue"
            value={getSelectedVenueDisplay()}
            readOnly
          />
        }
      </div>
      <div className="min-w-0">
        <label htmlFor="subvenue-admin-start">Start Date</label>
        <Input
          id="subvenue-admin-start"
          type="date"
          name="subvenue_startdate"
          value={editedSubvenue?.subvenue_startdate ?? ""}
          onChange={onInputChange}
          readOnly={!isEditing}
        />
      </div>
      <div className="min-w-0">
        <label htmlFor="subvenue-admin-end">End Date</label>
        <Input
          id="subvenue-admin-end"
          type="date"
          name="subvenue_enddate"
          value={editedSubvenue?.subvenue_enddate ?? ""}
          onChange={onInputChange}
          readOnly={!isEditing}
        />
      </div>
    </div>
  )
}
