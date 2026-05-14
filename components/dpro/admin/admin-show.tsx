"use client"

import { useState, useMemo } from "react"
import { formatDate } from "@/lib/utils/show-utils"
import type { AdminShowData } from "@/types/admin"
import { useShowData } from "@/hooks/use-show-data"
import { useShowReleases } from "@/hooks/use-show-releases"
import { useShowActions } from "@/hooks/use-show-actions"
import { useShowModals } from "@/hooks/use-show-modals"
import { AdminShowHeader } from "./admin-show-header"
import { ShowFormFields } from "./show-form-fields"
import { ReleasesTable } from "./releases-table"
import { ShowCompletionFlagsSection } from "./show-completion-flags-section"
import { ShowModal } from "./show-modal"
import { ShowReleaseModal } from "./show-release-modal"
import { AdminTabShell } from "./admin-tab-shell"

export function AdminShow() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const {
    allShows,
    loading,
    loadingProgress,
    groups,
    tours,
    subvenues,
    years,
    songs,
    fetchAllShows,
  } = useShowData()
  const { showReleases, loadingReleases, fetchShowReleases } = useShowReleases()
  const {
    selectedShow,
    isEditing,
    editedShow,
    isSubmitting,
    handleShowSelect,
    handleInputChange,
    toggleEdit,
    patchShow,
  } = useShowActions(allShows, fetchAllShows, fetchShowReleases)
  const {
    isShowModalOpen,
    isNewShow,
    isReleaseModalOpen,
    releaseModalMode,
    selectedReleaseForEdit,
    handleOpenNewShowModal,
    handleShowModalSave,
    handleAddRelease,
    handleEditRelease,
    handleReleaseModalClose,
    handleReleaseModalSave,
    closeShowModal,
  } = useShowModals()

  const filteredShows = useMemo(() => {
    return allShows.filter((show) => {
      const searchLower = searchTerm.toLowerCase()
      const dateStr = formatDate(show.show_date)
      return (
        dateStr.includes(searchLower) ||
        show.show_canonid?.toString().includes(searchLower) ||
        show.show_group.toLowerCase().includes(searchLower) ||
        show.show_venue_location?.toLowerCase().includes(searchLower) ||
        show.show_subvenue.toLowerCase().includes(searchLower)
      )
    })
  }, [allShows, searchTerm])

  const handleShowSelectWithReleases = (show: { show_id: string }) => {
    const fullShow = allShows.find((s) => s.show_id === show.show_id)
    if (!fullShow) return
    handleShowSelect(fullShow, fetchShowReleases)
    setIsDropdownOpen(false)
    setSearchTerm("")
  }

  const handleShowModalSaveWithFetch = () => {
    handleShowModalSave(fetchAllShows)
  }

  const handleReleaseModalSaveWithFetch = () => {
    if (selectedShow) {
      handleReleaseModalSave(selectedShow, fetchShowReleases)
    }
  }

  return (
    <AdminTabShell>
      <AdminShowHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredShows={filteredShows}
        onShowSelect={handleShowSelectWithReleases}
        loading={loading}
        loadingProgress={loadingProgress}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        onOpenNewShowModal={handleOpenNewShowModal}
        selectedShow={selectedShow}
      />
      {selectedShow && (
        <div className="wl-home-v2-archive-admin-song-form wl-home-v2-archive-admin-show-form">
          <ShowFormFields
            editedShow={editedShow}
            isEditing={isEditing}
            isSubmitting={isSubmitting}
            onToggleEdit={toggleEdit}
            onInputChange={handleInputChange}
            groups={groups}
            tours={tours}
            subvenues={subvenues}
            years={years}
            selectedShow={selectedShow}
            allShows={allShows}
            songs={songs}
          />
          <ReleasesTable
            showReleases={showReleases}
            loadingReleases={loadingReleases}
            onAddRelease={handleAddRelease}
            onEditRelease={handleEditRelease}
          />
          <ShowCompletionFlagsSection
            show={selectedShow}
            onSaveSuccess={patchShow}
            onRefreshShows={fetchAllShows}
          />
        </div>
      )}
      <ShowModal
        isOpen={isShowModalOpen}
        onClose={closeShowModal}
        show={selectedShow}
        onSave={handleShowModalSaveWithFetch}
        isNewShow={isNewShow}
        groups={groups}
        tours={tours}
        subvenues={subvenues}
        years={years}
      />
      {selectedShow && (
        <ShowReleaseModal
          isOpen={isReleaseModalOpen}
          onClose={handleReleaseModalClose}
          onSave={handleReleaseModalSaveWithFetch}
          showId={selectedShow.show_id}
          mode={releaseModalMode}
          existingReleaseId={selectedReleaseForEdit?.releaseId}
          existingOrder={selectedReleaseForEdit?.order}
        />
      )}
    </AdminTabShell>
  )
}
