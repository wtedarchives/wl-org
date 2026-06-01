"use client"

import {
  formatTimeDisplay,
} from "@/lib/utils/show-utils"
import { getPlacementBarCssToken } from "@/lib/placement-bar-color"
import type { AdminSetlistEntryData } from "@/types/admin"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SetlistEntryDiscourseBrain } from "./setlist-entry-discourse-brain"

interface SetlistTableProps {
  setlistEntries: AdminSetlistEntryData[]
  showId: string
  onEntrySelect: (entry: AdminSetlistEntryData) => void
}

export function SetlistTable({
  setlistEntries,
  showId,
  onEntrySelect,
}: SetlistTableProps) {
  return (
    <Table className="set-table wl-home-v2-admin-setlist-entry-table">
      <TableHeader>
          <TableRow>
            <TableHead
              className="wl-home-v2-admin-setlist-discourse-brain-head text-center text-sm"
              aria-label="Discourse"
            />
            <TableHead className="w-8 text-center text-sm">S</TableHead>
            <TableHead className="w-8 text-center text-sm">#</TableHead>
            <TableHead className="text-left text-sm">Song</TableHead>
            <TableHead className="text-left text-sm">Short</TableHead>
            <TableHead className="text-center text-sm">→</TableHead>
            <TableHead className="text-center text-sm">Placement</TableHead>
            <TableHead className="text-center text-sm">Length</TableHead>
            <TableHead className="text-left text-sm">Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {setlistEntries.map((entry) => (
            <TableRow
              key={entry.entry_id}
              className="cursor-pointer text-[0.625rem]"
              onClick={() => onEntrySelect(entry)}
            >
              <TableCell className="wl-home-v2-admin-setlist-discourse-brain-cell">
                <SetlistEntryDiscourseBrain entry={entry} showId={showId} />
              </TableCell>
              <TableCell className="text-center text-xs">{entry.entry_set}</TableCell>
              <TableCell className="text-center text-xs">{entry.entry_setnum}</TableCell>
              <TableCell className="text-xs font-medium">{entry.entry_song}</TableCell>
              <TableCell className="text-xs">{entry.entry_short ?? ""}</TableCell>
              <TableCell className="text-center text-xs">
                {(entry.entry_segue ?? "").replace(/>/g, "→")}
              </TableCell>
              <TableCell className="text-center">
                <div
                  className="wl-home-v2-archive-admin-placement-pill inline-block align-middle"
                  data-admin-placement-pill={getPlacementBarCssToken(
                    entry.entry_placement,
                  )}
                >
                  {entry.entry_placement ?? ""}
                </div>
              </TableCell>
              <TableCell className="text-center text-xs">
                {formatTimeDisplay(entry.entry_length)}
              </TableCell>
              <TableCell className="text-xs">{entry.entry_coachnotes ?? ""}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
  )
}
