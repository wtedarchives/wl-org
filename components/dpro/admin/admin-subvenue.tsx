"use client"

import { useState, useMemo } from "react"
import { FloppyDisk, PencilSimple, Plus } from "@phosphor-icons/react"
import type { SubvenueData, VenueDataBasic } from "@/types/admin"
import { useSubvenueData } from "@/hooks/use-subvenue-data"
import { useSubvenueForm } from "@/hooks/use-subvenue-form"
import { useSubvenueActions } from "@/hooks/use-subvenue-actions"
import { SubvenueDropdown } from "./subvenue-dropdown"
import { SubvenueForm } from "./subvenue-form"
import { Button } from "@/components/ui/button"
import { AdminTabShell } from "./admin-tab-shell"
import { AdminTabToolbar } from "./admin-tab-toolbar"

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
    <AdminTabShell>
      <AdminTabToolbar title="Subvenue Management">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCreateNew}
          className="wl-home-v2-tours-header-pill gap-1"
          title="New subvenue"
        >
          <Plus className="size-3.5 shrink-0 opacity-80" aria-hidden />
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
      </AdminTabToolbar>
      {selectedSubvenue && (
        <div className="wl-home-v2-archive-admin-song-form wl-home-v2-archive-admin-form--two-col">
          <div className="wl-home-v2-archive-admin-song-form__head">
            <h4 className="wl-home-v2-archive-admin-song-form__title">
              {isCreatingNew ? "New Subvenue" : selectedSubvenue.subvenue}
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
        <div className="wl-home-v2-archive-admin-callout wl-home-v2-archive-admin-callout--spacious">
          <p>
            Select a subvenue from the dropdown or create a new one to get
            started.
          </p>
        </div>
      )}
    </AdminTabShell>
  )
}
