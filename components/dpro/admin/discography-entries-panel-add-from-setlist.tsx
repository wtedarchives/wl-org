"use client"

import type { Dispatch, SetStateAction } from "react"
import type { AdminShowData } from "@/types/admin"
import { formatDate } from "@/lib/utils/show-utils"
import { AdminShowDropdown } from "./admin-show-dropdown"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { DiscographyEntriesSetlistRow } from "@/hooks/use-discography-entries-panel"

export interface DiscographyEntriesPanelAddFromSetlistProps {
  isDropdownOpen: boolean
  setIsDropdownOpen: Dispatch<SetStateAction<boolean>>
  searchTerm: string
  setSearchTerm: (term: string) => void
  filteredShows: AdminShowData[]
  onShowSelect: (show: { show_id: string }) => void | Promise<void>
  allShowsLoading: boolean
  loadingProgress: number
  selectedShow: AdminShowData | null
  loadingSetlist: boolean
  setlistEntries: DiscographyEntriesSetlistRow[]
  linkCountBySetlistEntry: Map<string, number>
  selectedIds: Set<string>
  toggleSelected: (entryId: string, checked: boolean) => void
  adding: boolean
  nextOrderLabel: number
  onAddSelected: () => void | Promise<void>
}

export function DiscographyEntriesPanelAddFromSetlist({
  isDropdownOpen,
  setIsDropdownOpen,
  searchTerm,
  setSearchTerm,
  filteredShows,
  onShowSelect,
  allShowsLoading,
  loadingProgress,
  selectedShow,
  loadingSetlist,
  setlistEntries,
  linkCountBySetlistEntry,
  selectedIds,
  toggleSelected,
  adding,
  nextOrderLabel,
  onAddSelected,
}: DiscographyEntriesPanelAddFromSetlistProps) {
  return (
    <div className="flex flex-col gap-0 border-t border-border/60 pt-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium">Add from setlist</span>
        <AdminShowDropdown
          isOpen={isDropdownOpen}
          onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filteredShows={filteredShows}
          onShowSelect={onShowSelect}
          loading={allShowsLoading}
          loadingProgress={loadingProgress}
          selectedShow={selectedShow}
          portalToBody={false}
        />
      </div>
      {selectedShow ? (
        <p className="mb-2 text-[11px] text-muted-foreground">
          {formatDate(selectedShow.show_date)} – {selectedShow.show_subvenue}
        </p>
      ) : null}

      {loadingSetlist ? (
        <p className="text-xs text-muted-foreground">Loading setlist…</p>
      ) : setlistEntries.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {selectedShow
            ? "No setlist entries for this show."
            : "Pick a show to list setlist lines."}
        </p>
      ) : (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs"
              disabled={selectedIds.size === 0 || adding}
              onClick={() => void onAddSelected()}
            >
              {adding
                ? "Adding…"
                : `Add selected (${selectedIds.size}) from order ${nextOrderLabel}`}
            </Button>
          </div>
          <div className="w-full min-w-0 overflow-x-auto rounded-[10px]">
            <Table className="set-table min-w-[36rem]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 py-0.5 pl-2 text-center text-xs">
                    <span className="sr-only">Select</span>
                  </TableHead>
                  <TableHead className="w-8 py-0.5 text-xs">S</TableHead>
                  <TableHead className="w-8 py-0.5 text-xs">#</TableHead>
                  <TableHead className="min-w-[12rem] py-0.5 text-xs">
                    Song
                  </TableHead>
                  <TableHead className="min-w-[5.5rem] py-0.5 text-xs">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {setlistEntries.map((e) => {
                  const count = linkCountBySetlistEntry.get(e.entry_id) ?? 0
                  const linked = count > 0
                  return (
                    <TableRow key={e.entry_id}>
                      <TableCell className="py-0.5 pl-2">
                        <Checkbox
                          checked={selectedIds.has(e.entry_id)}
                          onCheckedChange={(c) =>
                            toggleSelected(e.entry_id, c === true)
                          }
                          aria-label={`Select ${e.entry_song ?? e.entry_id}`}
                        />
                      </TableCell>
                      <TableCell className="py-0.5 text-center text-xs">
                        {e.entry_set}
                      </TableCell>
                      <TableCell className="py-0.5 text-center text-xs">
                        {e.entry_setnum}
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-0.5 text-xs">
                        {e.entry_song ?? "—"}
                      </TableCell>
                      <TableCell className="py-0.5">
                        {linked ? (
                          <Badge variant="secondary" className="text-[10px]">
                            On release{count > 1 ? ` ×${count}` : ""}
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
