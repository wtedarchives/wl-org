"use client"

import { useState, useMemo } from "react"
import { FloppyDisk, PencilSimple, Plus } from "@phosphor-icons/react"
import type { VenueData } from "@/types/admin"
import { useAdminVenueData } from "@/hooks/use-admin-venue-data"
import { useVenueForm } from "@/hooks/use-venue-form"
import { useVenueActions } from "@/hooks/use-venue-actions"
import { VenueDropdown } from "./venue-dropdown"
import { VenueForm } from "./venue-form"
import { Button } from "@/components/ui/button"
import { AdminTabShell } from "./admin-tab-shell"
import { AdminTabToolbar } from "./admin-tab-toolbar"

export function AdminVenue() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const { allVenues, loading, loadingProgress, fetchAllVenues } =
    useAdminVenueData()
  const {
    selectedVenue,
    isEditing,
    editedVenue,
    isSubmitting,
    isCreatingNew,
    handleVenueSelect,
    handleInputChange,
    handleCreateNew,
    handleCancel,
    setIsSubmitting,
    setIsCreatingNew,
    setIsEditing,
    setSelectedVenue,
  } = useVenueForm(allVenues)
  const { saveVenue } = useVenueActions()

  const filteredVenues = useMemo(() => {
    return allVenues.filter((venue) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        venue.venue.toLowerCase().includes(searchLower) ||
        venue.venue_location.toLowerCase().includes(searchLower) ||
        (venue.venue_address &&
          venue.venue_address.toLowerCase().includes(searchLower))
      )
    })
  }, [allVenues, searchTerm])

  const handleVenueSelectWithDropdown = (venue: VenueData) => {
    handleVenueSelect(venue)
    setIsDropdownOpen(false)
    setSearchTerm("")
  }

  const toggleEdit = () => {
    if (isEditing) {
      saveVenue(
        editedVenue!,
        selectedVenue,
        isCreatingNew,
        setIsSubmitting,
        setIsCreatingNew,
        setIsEditing,
        setSelectedVenue,
        fetchAllVenues
      )
    } else {
      setIsEditing(true)
    }
  }

  return (
    <AdminTabShell>
      <AdminTabToolbar title="Venue Management">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCreateNew}
          className="wl-home-v2-tours-header-pill gap-1"
          title="New venue"
        >
          <Plus className="size-3.5 shrink-0 opacity-80" aria-hidden />
        </Button>
        <VenueDropdown
            isOpen={isDropdownOpen}
            onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
            onClose={() => setIsDropdownOpen(false)}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filteredVenues={filteredVenues}
            onVenueSelect={handleVenueSelectWithDropdown}
            loading={loading}
            loadingProgress={loadingProgress}
            selectedVenue={selectedVenue}
          />
      </AdminTabToolbar>
      {selectedVenue && (
        <div className="wl-home-v2-archive-admin-song-form wl-home-v2-archive-admin-form--two-col">
          <div className="wl-home-v2-archive-admin-song-form__head">
            <h4 className="wl-home-v2-archive-admin-song-form__title">
              {isCreatingNew ?
                "New Venue"
              : `${selectedVenue.venue} - ${selectedVenue.venue_location}`}
            </h4>
            <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2">
              {isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="wl-home-v2-tours-header-pill"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleEdit}
                disabled={isSubmitting}
                className="wl-home-v2-tours-header-pill gap-1"
              >
                {isEditing ?
                  <>
                    <FloppyDisk className="size-3.5 shrink-0 opacity-80" aria-hidden />
                    Save
                  </>
                : <>
                    <PencilSimple className="size-3.5 shrink-0 opacity-80" aria-hidden />
                    Edit
                  </>
                }
              </Button>
            </div>
          </div>
          <VenueForm
            editedVenue={editedVenue}
            isEditing={isEditing}
            onInputChange={handleInputChange}
          />
        </div>
      )}
      {!selectedVenue && !loading && (
        <div className="wl-home-v2-archive-admin-callout wl-home-v2-archive-admin-callout--spacious">
          <p>
            Select a venue from the dropdown or create a new one to get started.
          </p>
        </div>
      )}
    </AdminTabShell>
  )
}
