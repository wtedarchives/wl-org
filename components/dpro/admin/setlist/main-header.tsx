"use client"

import { Loader2, Check } from "lucide-react"
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
      <h3 className="flex items-center gap-1.5 text-sm font-semibold">
        {saveStatus === "processing" && (
          <Loader2 className="size-3.5 shrink-0 animate-spin" />
        )}
        {saveStatus === "done" && (
          <Check className="size-3.5 shrink-0 text-green-600 dark:text-green-400" />
        )}
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
