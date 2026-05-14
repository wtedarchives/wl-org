"use client"

import { Loader2, Check } from "lucide-react"
import { getHeaderText } from "@/lib/utils/show-utils"
import type { ShowData } from "@/types/admin"
import { cn } from "@/lib/utils"
import { ShowDropdown } from "./show-dropdown"

interface MainHeaderProps {
  saveStatus: "idle" | "processing" | "done" | "error"
  shows: ShowData[]
  loading: boolean
  loadingProgress: number
  onShowSelect: (show: ShowData) => void
  selectedShow?: ShowData | null
}

/**
 * Setlist admin toolbar: status + tour-style show picker on one row (inside tour main column).
 */
export function MainHeader({
  saveStatus,
  shows,
  loading,
  loadingProgress,
  onShowSelect,
  selectedShow,
}: MainHeaderProps) {
  return (
    <div className="flex w-full min-w-0 shrink-0 flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <div className="flex min-w-0 items-center gap-2">
        {saveStatus === "processing" ?
          <Loader2 className="size-3.5 shrink-0 animate-spin text-white/80" aria-hidden />
        : saveStatus === "done" ?
          <Check className="size-3.5 shrink-0 text-emerald-300" aria-hidden />
        : null}
        <span
          className={cn(
            "min-w-0 font-mono text-[11px] font-medium uppercase leading-snug tracking-[0.06em] text-white/90",
            saveStatus === "error" && "text-red-300",
          )}
        >
          {getHeaderText(saveStatus)}
        </span>
      </div>
      <ShowDropdown
        shows={shows}
        loading={loading}
        loadingProgress={loadingProgress}
        onShowSelect={onShowSelect}
        selectedShow={selectedShow}
        triggerClassName="shrink-0"
      />
    </div>
  )
}
