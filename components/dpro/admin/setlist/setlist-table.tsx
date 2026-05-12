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

interface SetlistTableProps {
  setlistEntries: AdminSetlistEntryData[]
  onEntrySelect: (entry: AdminSetlistEntryData) => void
}

export function SetlistTable({
  setlistEntries,
  onEntrySelect,
}: SetlistTableProps) {
  return (
    <Table className="set-table">
      <TableHeader>
          <TableRow>
            <TableHead className="w-8 py-1 text-center text-sm">S</TableHead>
            <TableHead className="w-8 py-1 text-center text-sm">#</TableHead>
            <TableHead className="py-1 text-left text-sm">Song</TableHead>
            <TableHead className="py-1 text-left text-sm">Short</TableHead>
            <TableHead className="py-1 text-left text-sm">→</TableHead>
            <TableHead className="py-1 text-center text-sm">Placement</TableHead>
            <TableHead className="py-1 text-center text-sm">Length</TableHead>
            <TableHead className="py-1 text-left text-sm">Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {setlistEntries.map((entry) => (
            <TableRow
              key={entry.entry_id}
              className="cursor-pointer text-[0.625rem]"
              onClick={() => onEntrySelect(entry)}
            >
              <TableCell className="py-1 text-center text-xs">{entry.entry_set}</TableCell>
              <TableCell className="py-1 text-center text-xs">{entry.entry_setnum}</TableCell>
              <TableCell className="py-1 text-xs font-medium">{entry.entry_song}</TableCell>
              <TableCell className="py-1 text-xs">{entry.entry_short ?? ""}</TableCell>
              <TableCell className="py-1 text-xs">
                {(entry.entry_segue ?? "").replace(/>/g, "→")}
              </TableCell>
              <TableCell className="py-1">
                <div
                  className="wl-home-v2-archive-admin-placement-pill"
                  data-admin-placement-pill={getPlacementBarCssToken(
                    entry.entry_placement,
                  )}
                >
                  {entry.entry_placement ?? ""}
                </div>
              </TableCell>
              <TableCell className="py-1 text-center text-xs">
                {formatTimeDisplay(entry.entry_length)}
              </TableCell>
              <TableCell className="py-1 text-xs">{entry.entry_coachnotes ?? ""}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
  )
}
