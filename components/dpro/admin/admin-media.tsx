"use client"

import { formatDate } from "@/lib/utils/show-utils"
import { useAdminMedia } from "@/hooks/use-admin-media"
import { AdminShowDropdown } from "./admin-show-dropdown"
import { AdminMediaTable } from "./admin-media-table"
import { AdminMediaReleaseTooltip } from "./admin-media-release-tooltip"

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
    hoveredReleaseId,
    setHoveredReleaseId,
    tooltipPosition,
    headerRefs,
    showReleases,
    filteredShows,
    loading,
    loadingProgress,
    handleShowSelect,
    handleToggleMedia,
    handleToggleAllForRelease,
  } = useAdminMedia()

  const hoveredRelease = showReleases.find(
    (r) => r.release_id === hoveredReleaseId
  )

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Media Management</h3>
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
      </div>
      {selectedShow && (
        <div className="mb-2 px-2 pb-1">
          <h4 className="text-sm font-medium">
            {formatDate(selectedShow.show_date)} - {selectedShow.show_subvenue}
          </h4>
        </div>
      )}
      {selectedShow && (
        <div className="overflow-hidden rounded-lg border border-border">
          {loadingSetlist || loadingReleases ? (
            <div className="flex items-center justify-center gap-2 p-3">
              <div className="flex gap-2">
                <div className="size-3 animate-pulse rounded-lg bg-muted" />
                <div className="size-3 animate-pulse rounded-lg bg-muted [animation-delay:150ms]" />
                <div className="size-3 animate-pulse rounded-lg bg-muted [animation-delay:300ms]" />
              </div>
              <p className="ml-2 text-xs text-muted-foreground">
                Loading media...
              </p>
            </div>
          ) : setlistEntries.length > 0 ? (
            <AdminMediaTable
              setlistEntries={setlistEntries}
              showReleases={showReleases}
              mediaEntries={mediaEntries}
              togglingEntry={togglingEntry}
              headerRefs={headerRefs}
              onHoverRelease={setHoveredReleaseId}
              onToggleAllForRelease={handleToggleAllForRelease}
              onToggleMedia={handleToggleMedia}
            />
          ) : (
            <div className="rounded-lg border border-border bg-background p-3 text-center text-xs text-muted-foreground">
              No setlist entries found for this show.
            </div>
          )}
        </div>
      )}
      {!selectedShow && !loading && (
        <div className="rounded-lg border border-border bg-background p-3 text-center text-xs text-muted-foreground">
          Select a show to view its media assignments.
        </div>
      )}
      <AdminMediaReleaseTooltip
        release={hoveredRelease}
        position={tooltipPosition}
      />
    </div>
  )
}
