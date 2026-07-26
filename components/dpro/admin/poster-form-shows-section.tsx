"use client"

import { X } from "lucide-react"
import { getShowDisplayData } from "@/lib/utils/show-utils"
import type { ShowData } from "@/types/admin"
import { AdminShowDropdown } from "./admin-show-dropdown"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface PosterFormShowsSectionProps {
  showIds: string[]
  showById: Map<string, ShowData>
  showDropdownOpen: boolean
  onToggleDropdown: () => void
  showSearch: string
  onShowSearchChange: (value: string) => void
  filteredShows: ShowData[]
  onShowSelect: (show: { show_id: string }) => void
  onRemoveShow: (showId: string) => void
  showsLoading: boolean
  showsLoadingProgress: number
}

export function PosterFormShowsSection({
  showIds,
  showById,
  showDropdownOpen,
  onToggleDropdown,
  showSearch,
  onShowSearchChange,
  filteredShows,
  onShowSelect,
  onRemoveShow,
  showsLoading,
  showsLoadingProgress,
}: PosterFormShowsSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Shows</Label>
      <AdminShowDropdown
        isOpen={showDropdownOpen}
        onToggle={onToggleDropdown}
        searchTerm={showSearch}
        onSearchChange={onShowSearchChange}
        filteredShows={filteredShows}
        onShowSelect={onShowSelect}
        loading={showsLoading}
        loadingProgress={showsLoadingProgress}
        triggerLabel="Add show"
        portalToBody={false}
        menuAlign="left"
      />
      {showIds.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {showIds.map((id) => {
            const show = showById.get(id)
            const label = show
              ? (() => {
                  const d = getShowDisplayData(show)
                  return `${d.dateStr}${d.canonIdStr}${d.locationStr}`
                })()
              : id
            return (
              <li
                key={id}
                className="flex min-h-11 items-center justify-between gap-2 rounded-md border border-border px-2 py-1.5 text-xs"
              >
                <span className="min-w-0 truncate">{label}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 shrink-0 p-0"
                  onClick={() => onRemoveShow(id)}
                  aria-label={`Remove show ${label}`}
                >
                  <X className="size-3.5" aria-hidden />
                </Button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No shows linked.</p>
      )}
    </div>
  )
}
