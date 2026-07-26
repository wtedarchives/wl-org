"use client"

import { formatDate } from "@/lib/utils/show-utils"
import { cn } from "@/lib/utils"
import { useAdminBandcamp } from "@/hooks/use-admin-bandcamp"
import { AdminShowDropdown } from "./admin-show-dropdown"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AdminTabShell } from "./admin-tab-shell"
import { AdminTabToolbar } from "./admin-tab-toolbar"
import { AdminBandcampSetlistTable } from "./admin-bandcamp-setlist-table"

export function AdminBandcamp() {
  const {
    searchTerm,
    setSearchTerm,
    isDropdownOpen,
    setIsDropdownOpen,
    selectedShow,
    setlistEntries,
    loadingSetlist,
    assignments,
    savingEntryId,
    albumUrl,
    setAlbumUrl,
    album,
    fetching,
    fetchError,
    filteredShows,
    loading,
    loadingProgress,
    handleShowSelect,
    handleFetchTracks,
    optionsForEntry,
    handleAssign,
  } = useAdminBandcamp()

  return (
    <AdminTabShell>
      <AdminTabToolbar title="Bandcamp Track Links">
        <Input
          type="url"
          value={albumUrl}
          onChange={(e) => setAlbumUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleFetchTracks()
            }
          }}
          placeholder="Bandcamp album URL"
          className="h-8 w-full min-w-[16rem] max-w-[26rem] border border-white/10 bg-black/35 px-2 text-xs text-white/90"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleFetchTracks}
          disabled={fetching || !albumUrl.trim()}
        >
          {fetching ? "Fetching…" : "Fetch tracks"}
        </Button>
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

      {fetchError ?
        <div className="rounded-lg border border-[rgba(255,122,103,0.4)] bg-[rgba(255,122,103,0.08)] px-3 py-2 text-xs text-[rgb(255,168,150)]">
          {fetchError}
        </div>
      : album ?
        <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-white/70">
          Loaded <span className="font-medium text-white/90">
            {album.album_title ?? "album"}
          </span>{" "}
          — {album.tracks.length} tracks. Assign them to setlist entries below.
        </div>
      : null}

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
          {loadingSetlist ?
            <div className="flex flex-1 items-center justify-center gap-2 px-3 py-10">
              <div className="flex gap-2">
                <div className="size-3 animate-pulse rounded-lg bg-muted" />
                <div className="size-3 animate-pulse rounded-lg bg-muted [animation-delay:150ms]" />
                <div className="size-3 animate-pulse rounded-lg bg-muted [animation-delay:300ms]" />
              </div>
              <p className="ml-2 text-xs text-white/65">Loading setlist...</p>
            </div>
          : setlistEntries.length > 0 ?
            <AdminBandcampSetlistTable
              setlistEntries={setlistEntries}
              assignments={assignments}
              savingEntryId={savingEntryId}
              optionsForEntry={optionsForEntry}
              onAssign={handleAssign}
            />
          : <div className="px-1 py-6 text-center text-xs text-white/65">
              <p className="m-0">No setlist entries found for this show.</p>
            </div>}
        </div>
      )}
      {!selectedShow && !loading && (
        <div className="rounded-lg border border-border bg-background p-3 text-center text-xs text-muted-foreground">
          Fetch an album&apos;s tracks, then select a show to assign Bandcamp
          track links to its setlist entries.
        </div>
      )}
    </AdminTabShell>
  )
}
