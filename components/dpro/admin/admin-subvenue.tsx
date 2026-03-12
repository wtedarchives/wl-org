"use client"

import { useState, useMemo } from "react"
import { Save, Edit, Plus } from "lucide-react"
import type { SubvenueData, VenueDataBasic } from "@/types/admin"
import { useSubvenueData } from "@/hooks/use-subvenue-data"
import { useSubvenueForm } from "@/hooks/use-subvenue-form"
import { useSubvenueActions } from "@/hooks/use-subvenue-actions"
import { SubvenueDropdown } from "./subvenue-dropdown"
import { SubvenueForm } from "./subvenue-form"
import { Button } from "@/components/ui/button"

export function AdminSubvenue() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const {
    allSubvenues,
    allVenues,
    loading,
    loadingProgress,
    fetchAllSubvenues,
  } = useSubvenueData()
  const {
    selectedSubvenue,
    isEditing,
    editedSubvenue,
    isSubmitting,
    isCreatingNew,
    isVenueDropdownOpen,
    venueSearchTerm,
    handleSubvenueSelect,
    handleVenueSelect,
    handleInputChange,
    handleCreateNew,
    handleCancel,
    setIsSubmitting,
    setIsCreatingNew,
    setIsEditing,
    setSelectedSubvenue,
    setIsVenueDropdownOpen,
    setVenueSearchTerm,
  } = useSubvenueForm(allSubvenues)
  const { saveSubvenue } = useSubvenueActions()

  const filteredSubvenues = useMemo(() => {
    return allSubvenues.filter((subvenue) => {
      const searchLower = searchTerm.toLowerCase()
      const venue = allVenues.find((v) => v.venue === subvenue.subvenue_venue)
      return (
        subvenue.subvenue.toLowerCase().includes(searchLower) ||
        subvenue.subvenue_venue.toLowerCase().includes(searchLower) ||
        (venue &&
          (venue.venue.toLowerCase().includes(searchLower) ||
            venue.venue_location.toLowerCase().includes(searchLower)))
      )
    })
  }, [allSubvenues, allVenues, searchTerm])

  const filteredVenues = useMemo(() => {
    return allVenues.filter((venue) => {
      const searchLower = venueSearchTerm.toLowerCase()
      return (
        venue.venue.toLowerCase().includes(searchLower) ||
        venue.venue_location.toLowerCase().includes(searchLower)
      )
    })
  }, [allVenues, venueSearchTerm])

  const handleSubvenueSelectWithDropdown = (subvenue: SubvenueData) => {
    handleSubvenueSelect(subvenue)
    setIsDropdownOpen(false)
    setSearchTerm("")
  }

  const toggleEdit = () => {
    if (isEditing) {
      saveSubvenue(
        editedSubvenue!,
        selectedSubvenue,
        isCreatingNew,
        setIsSubmitting,
        setIsCreatingNew,
        setIsEditing,
        setSelectedSubvenue,
        fetchAllSubvenues
      )
    } else {
      setIsEditing(true)
    }
  }

  return (
    <div className="pb-1">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Subvenue Management</h3>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" onClick={handleCreateNew}>
            <Plus className="size-4" />
          </Button>
          <SubvenueDropdown
            isOpen={isDropdownOpen}
            onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
            onClose={() => setIsDropdownOpen(false)}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filteredSubvenues={filteredSubvenues}
            onSubvenueSelect={handleSubvenueSelectWithDropdown}
            loading={loading}
            loadingProgress={loadingProgress}
            allVenues={allVenues}
            selectedSubvenue={selectedSubvenue}
          />
        </div>
      </div>
      {selectedSubvenue && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-medium">
              {isCreatingNew ? "New Subvenue" : selectedSubvenue.subvenue}
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
          <SubvenueForm
            editedSubvenue={editedSubvenue}
            isEditing={isEditing}
            onInputChange={handleInputChange}
            allVenues={allVenues}
            isVenueDropdownOpen={isVenueDropdownOpen}
            onVenueDropdownToggle={() =>
              setIsVenueDropdownOpen(!isVenueDropdownOpen)
            }
            onVenueDropdownClose={() => setIsVenueDropdownOpen(false)}
            venueSearchTerm={venueSearchTerm}
            onVenueSearchChange={setVenueSearchTerm}
            filteredVenues={filteredVenues}
            onVenueSelect={handleVenueSelect}
          />
        </div>
      )}
      {!selectedSubvenue && !loading && (
        <div className="py-8 text-center">
          <p className="text-xs text-muted-foreground">
            Select a subvenue from the dropdown or create a new one to get
            started.
          </p>
        </div>
      )}
    </div>
  )
}
