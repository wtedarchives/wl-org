"use client"

import type { AdminShowData } from "@/types/admin"
import { AdminShowDropdown } from "@/components/dpro/admin/admin-show-dropdown"
import { formatDate } from "@/lib/utils/show-utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getPlacementBarCssToken } from "@/lib/placement-bar-color"
import { cn } from "@/lib/utils"

export type SetlistPickerEntry = {
  entry_id: string
  entry_set: string | null
  entry_setnum: number
  entry_setorder: number
  entry_song: string | null
  entry_short: string | null
  entry_segue: string | null
  entry_placement: string | null
}

export function AdminRadioEpisodeSetlistsPickerSection({
  allShows,
  showsLoading,
  loadingProgress,
  searchTerm,
  onSearchChange,
  isDropdownOpen,
  onToggleDropdown,
  filteredShows,
  onShowSelect,
  selectedShow,
  pickerEntries,
  loadingPicker,
  radioId,
  onPickEntry,
  /** When false, the show menu stays in the dialog (required with modal dialogs). */
  showDropdownPortalToBody = true,
}: {
  allShows: AdminShowData[]
  showsLoading: boolean
  loadingProgress: number
  searchTerm: string
  onSearchChange: (term: string) => void
  isDropdownOpen: boolean
  onToggleDropdown: () => void
  filteredShows: AdminShowData[]
  onShowSelect: (show: AdminShowData) => void
  selectedShow: AdminShowData | null
  pickerEntries: SetlistPickerEntry[]
  loadingPicker: boolean
  radioId: string
  onPickEntry: (entry: SetlistPickerEntry) => void
  showDropdownPortalToBody?: boolean
}) {
  return (
    <section className="space-y-2 transition-opacity duration-200">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Add from show
      </h3>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <AdminShowDropdown
          isOpen={isDropdownOpen}
          onToggle={onToggleDropdown}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          filteredShows={filteredShows}
          onShowSelect={(show) => {
            const full = allShows.find((s) => s.show_id === show.show_id)
            if (full) onShowSelect(full)
          }}
          loading={showsLoading}
          loadingProgress={loadingProgress}
          selectedShow={selectedShow}
          triggerLabel="Show"
          portalToBody={showDropdownPortalToBody}
          portalAlignTriggerStart={showDropdownPortalToBody}
          menuAlign={showDropdownPortalToBody ? "right" : "left"}
        />
      </div>

      {selectedShow ?
        <div className="space-y-2">
          <p className="text-sm leading-snug break-words text-foreground">
            <span className="font-semibold tabular-nums">
              {formatDate(selectedShow.show_date)}
            </span>
            <span className="text-muted-foreground"> · </span>
            <span>{selectedShow.show_group || "—"}</span>
            <span className="text-muted-foreground"> · </span>
            <span>{selectedShow.show_venue_location ?? "—"}</span>
          </p>
          <div
            className={cn(
              "overflow-hidden rounded-[10px] border border-border/80 bg-muted/45 transition-all duration-200",
              "dark:bg-muted/35",
            )}
          >
            <div className="max-h-48 overflow-auto md:max-h-56">
              <Table className="set-table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-auto w-14 py-1.5 pr-2 pl-2 text-xs leading-tight">
                      Set
                    </TableHead>
                    <TableHead className="h-auto w-10 py-1.5 pr-2 pl-2 text-xs leading-tight">
                      #
                    </TableHead>
                    <TableHead className="h-auto min-w-[6rem] py-1.5 pr-2 pl-2 text-xs leading-tight">
                      Song
                    </TableHead>
                    <TableHead className="h-auto min-w-[3.5rem] py-1.5 pr-2 pl-2 text-xs leading-tight">
                      Short
                    </TableHead>
                    <TableHead className="h-auto w-8 py-1.5 pr-1 pl-1 text-center text-xs leading-tight">
                      {">"}
                    </TableHead>
                    <TableHead className="h-auto min-w-[5.5rem] py-1.5 pr-2 pl-2 text-center text-xs leading-tight">
                      Placement
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPicker ?
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-1.5 px-2 text-xs text-muted-foreground"
                      >
                        Loading setlist…
                      </TableCell>
                    </TableRow>
                  : pickerEntries.length === 0 ?
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-1.5 px-2 text-xs text-muted-foreground"
                      >
                        No entries for this show.
                      </TableCell>
                    </TableRow>
                  : pickerEntries.map((pe) => {
                      return (
                        <TableRow
                          key={pe.entry_id}
                          className={cn(
                            "cursor-pointer border-border/50 transition-colors",
                            "hover:bg-background/55 dark:hover:bg-background/25",
                            !radioId && "pointer-events-none opacity-50",
                          )}
                          onClick={() => {
                            if (radioId) onPickEntry(pe)
                          }}
                        >
                          <TableCell className="py-1.5 px-2 text-xs leading-tight">
                            {pe.entry_set ?? "—"}
                          </TableCell>
                          <TableCell className="py-1.5 px-2 text-xs leading-tight tabular-nums">
                            {pe.entry_setnum}
                          </TableCell>
                          <TableCell className="py-1.5 px-2 text-xs break-words leading-tight">
                            {pe.entry_song ?? "—"}
                          </TableCell>
                          <TableCell className="py-1.5 px-2 text-xs break-words leading-tight">
                            {pe.entry_short?.trim() ? pe.entry_short : "—"}
                          </TableCell>
                          <TableCell className="py-1.5 px-1 text-center text-xs leading-tight">
                            {(pe.entry_segue ?? "").replace(/>/g, "→")}
                          </TableCell>
                          <TableCell className="py-1.5 px-2">
                            <div
                              className={cn(
                                "wl-home-v2-archive-admin-placement-pill mx-auto w-fit max-w-[10rem] truncate text-[0.65rem] leading-tight",
                              )}
                              data-admin-placement-pill={getPlacementBarCssToken(
                                pe.entry_placement,
                              )}
                            >
                              {pe.entry_placement?.trim() ?
                                pe.entry_placement
                              : "—"}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  }
                </TableBody>
              </Table>
            </div>
            <p className="border-t border-border/60 bg-muted/30 px-2 py-1 text-[0.65rem] text-muted-foreground dark:bg-muted/25">
              Tap a row to add it to this episode.
            </p>
          </div>
        </div>
      : null}
    </section>
  )
}
