"use client"

import { Plus } from "@phosphor-icons/react"
import type { AdminShowData } from "@/types/admin"
import { Button } from "@/components/ui/button"
import { AdminShowDropdown } from "./admin-show-dropdown"
import { AdminTabToolbar } from "./admin-tab-toolbar"

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
}: AdminShowHeaderProps) {
  return (
    <AdminTabToolbar title="Show Management">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onOpenNewShowModal}
        className="wl-home-v2-tours-header-pill gap-1"
        title="New show"
      >
        <Plus className="size-3.5 shrink-0 opacity-80" aria-hidden />
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
    </AdminTabToolbar>
  )
}
