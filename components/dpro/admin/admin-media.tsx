"use client"

import { formatDate } from "@/lib/utils/show-utils"
import { cn } from "@/lib/utils"
import { useAdminMedia } from "@/hooks/use-admin-media"
import { AdminShowDropdown } from "./admin-show-dropdown"
import { AdminMediaTable } from "./admin-media-table"
import { AdminTabShell } from "./admin-tab-shell"
import { AdminTabToolbar } from "./admin-tab-toolbar"

export function AdminMedia() {
  const {
    searchTerm,
    setSearchTerm,
    isDropdownOpen,
    setIsDropdownOpen,
    selectedShow,
    setlistEntries,
    mediaEntries,
    loadingSetlist,
    loadingReleases,
    togglingEntry,
    showReleases,
    filteredShows,
    loading,
    loadingProgress,
    handleShowSelect,
    handleToggleMedia,
    handleToggleAllForRelease,
  } = useAdminMedia()

  return (
    <AdminTabShell>
      <AdminTabToolbar title="Media Management">
        <AdminShowDropdown
          isOpen={isDropdownOpen}
          onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filteredShows={filteredShows}
          onShowSelect={handleShowSelect}
          loading={loading}
          loadingProgress={loadingProgress}
          selectedShow={selectedShow}
        />
      </AdminTabToolbar>
      {selectedShow && (
        <div className="widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            className={cn(
              "wp-head wl-home-v2-years-shows-wp-head wl-home-v2-tours-shows-wp-head",
              "flex w-full min-w-0 shrink-0 flex-row flex-wrap items-center gap-x-3 gap-y-2 border-b border-[rgb(29,32,30)] pb-3",
            )}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="wp-head-date min-w-0 truncate">
                {formatDate(selectedShow.show_date)} [{selectedShow.show_group}]
              </span>
              <span className="text-[11px] leading-snug text-white/55">
                {selectedShow.show_subvenue} — {selectedShow.show_venue_location}
              </span>
            </div>
          </div>
          {loadingSetlist || loadingReleases ?
            <div className="flex flex-1 items-center justify-center gap-2 px-3 py-10">
              <div className="flex gap-2">
                <div className="size-3 animate-pulse rounded-lg bg-muted" />
                <div className="size-3 animate-pulse rounded-lg bg-muted [animation-delay:150ms]" />
                <div className="size-3 animate-pulse rounded-lg bg-muted [animation-delay:300ms]" />
              </div>
              <p className="ml-2 text-xs text-white/65">
                Loading media...
              </p>
            </div>
          : setlistEntries.length > 0 ?
            <div className="wl-home-v2-years-table-scroll min-h-0 min-w-0 flex-1">
              <AdminMediaTable
                setlistEntries={setlistEntries}
                showReleases={showReleases}
                mediaEntries={mediaEntries}
                togglingEntry={togglingEntry}
                onToggleAllForRelease={handleToggleAllForRelease}
                onToggleMedia={handleToggleMedia}
              />
            </div>
          : <div className="px-1 py-6 text-center text-xs text-white/65">
              <p className="m-0">No setlist entries found for this show.</p>
            </div>}
        </div>
      )}
      {!selectedShow && !loading && (
        <div className="rounded-lg border border-border bg-background p-3 text-center text-xs text-muted-foreground">
          Select a show to view its media assignments.
        </div>
      )}
    </AdminTabShell>
  )
}
