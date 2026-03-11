"use client"

import { getHeaderText } from "@/lib/utils/show-utils"
import type { ShowData } from "@/types/admin"
import { ShowDropdown } from "./show-dropdown"

interface MainHeaderProps {
  saveStatus: "idle" | "processing" | "done" | "error"
  shows: ShowData[]
  loading: boolean
  loadingProgress: number
  onShowSelect: (show: ShowData) => void
  selectedShow?: ShowData | null
}

export function MainHeader({
  saveStatus,
  shows,
  loading,
  loadingProgress,
  onShowSelect,
  selectedShow,
}: MainHeaderProps) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-sm font-semibold">
        {getHeaderText(saveStatus)}
      </h3>
      <ShowDropdown
        shows={shows}
        loading={loading}
        loadingProgress={loadingProgress}
        onShowSelect={onShowSelect}
        selectedShow={selectedShow}
      />
    </div>
  )
}
