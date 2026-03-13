"use client"

import { Save, Edit, Plus } from "lucide-react"
import { formatDate } from "@/lib/utils/show-utils"
import type { AdminShowData } from "@/types/admin"
import { Button } from "@/components/ui/button"
import { AdminShowDropdown } from "./admin-show-dropdown"

interface AdminShowHeaderProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  filteredShows: AdminShowData[]
  onShowSelect: (show: { show_id: string }) => void
  loading: boolean
  loadingProgress: number
  isDropdownOpen: boolean
  setIsDropdownOpen: (open: boolean) => void
  onOpenNewShowModal: () => void
  selectedShow: AdminShowData | null
  isEditing: boolean
  isSubmitting: boolean
  onToggleEdit: () => void
}

export function AdminShowHeader({
  searchTerm,
  setSearchTerm,
  filteredShows,
  onShowSelect,
  loading,
  loadingProgress,
  isDropdownOpen,
  setIsDropdownOpen,
  onOpenNewShowModal,
  selectedShow,
  isEditing,
  isSubmitting,
  onToggleEdit,
}: AdminShowHeaderProps) {
  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Show Management</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenNewShowModal}
            className="gap-2"
          >
            <Plus className="size-4" />
          </Button>
          <AdminShowDropdown
            isOpen={isDropdownOpen}
            onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filteredShows={filteredShows}
            onShowSelect={onShowSelect}
            loading={loading}
            loadingProgress={loadingProgress}
            selectedShow={selectedShow}
          />
        </div>
      </div>
      {selectedShow && (
        <div className="pb-1">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-medium">
              {formatDate(selectedShow.show_date)} - {selectedShow.show_subvenue}
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleEdit}
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
      )}
    </>
  )
}
