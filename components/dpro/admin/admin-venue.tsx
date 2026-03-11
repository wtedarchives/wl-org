"use client"

import { useState, useMemo } from "react"
import { Save, Edit, Plus } from "lucide-react"
import type { VenueData } from "@/types/admin"
import { useAdminVenueData } from "@/hooks/use-admin-venue-data"
import { useVenueForm } from "@/hooks/use-venue-form"
import { useVenueActions } from "@/hooks/use-venue-actions"
import { VenueDropdown } from "./venue-dropdown"
import { VenueForm } from "./venue-form"
import { Button } from "@/components/ui/button"

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
    <div className="pb-1">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Venue Management</h3>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" onClick={handleCreateNew}>
            <Plus className="size-4" />
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
        </div>
      </div>
      {selectedVenue && (
        <div className="px-2">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-medium">
              {isCreatingNew
                ? "New Venue"
                : `${selectedVenue.venue} - ${selectedVenue.venue_location}`}
            </h4>
            <div className="flex items-center gap-2">
              {isEditing && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={toggleEdit}
                disabled={isSubmitting}
                className="gap-1"
              >
                {isEditing ? (
                  <>
                    <Save className="size-4" />
                    Save
                  </>
                ) : (
                  <>
                    <Edit className="size-4" />
                    Edit
                  </>
                )}
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
        <div className="py-8 text-center">
          <p className="text-xs text-muted-foreground">
            Select a venue from the dropdown or create a new one to get started.
          </p>
        </div>
      )}
    </div>
  )
}
