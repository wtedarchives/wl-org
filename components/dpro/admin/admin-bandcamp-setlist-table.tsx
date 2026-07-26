"use client"

import { getPlacementBarCssToken } from "@/lib/placement-bar-color"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  BandcampSetlistEntry,
  TrackAssignment,
} from "./admin-bandcamp.types"

export function AdminBandcampSetlistTable({
  setlistEntries,
  assignments,
  savingEntryId,
  optionsForEntry,
  onAssign,
}: {
  setlistEntries: BandcampSetlistEntry[]
  assignments: Record<string, TrackAssignment>
  savingEntryId: string | null
  optionsForEntry: (entryId: string) => TrackAssignment[]
  onAssign: (entryId: string, trackIdStr: string) => void
}) {
  return (
    <div className="wl-home-v2-years-table-scroll min-h-0 min-w-0 flex-1">
      <Table className="set-table wl-home-v2-admin-setlist-entry-table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-8 text-center text-sm">S</TableHead>
            <TableHead className="w-8 text-center text-sm">#</TableHead>
            <TableHead className="text-left text-sm">Song</TableHead>
            <TableHead className="text-left text-sm">Short</TableHead>
            <TableHead className="text-center text-sm">→</TableHead>
            <TableHead className="text-center text-sm">Placement</TableHead>
            <TableHead className="text-left text-sm">Bandcamp track</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {setlistEntries.map((entry) => {
            const options = optionsForEntry(entry.entry_id)
            const current = assignments[entry.entry_id]
            return (
              <TableRow key={entry.entry_id} className="text-[0.625rem]">
                <TableCell className="text-center text-xs">
                  {entry.entry_set}
                </TableCell>
                <TableCell className="text-center text-xs">
                  {entry.entry_setnum}
                </TableCell>
                <TableCell className="text-xs font-medium">
                  {entry.entry_song}
                </TableCell>
                <TableCell className="text-xs">
                  {entry.entry_short ?? ""}
                </TableCell>
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
                <TableCell className="text-xs">
                  <select
                    value={current ? String(current.track_id) : ""}
                    disabled={
                      savingEntryId === entry.entry_id ||
                      options.length === 0
                    }
                    onChange={(e) =>
                      onAssign(entry.entry_id, e.target.value)
                    }
                    className="h-7 w-full min-w-[8rem] max-w-[20rem] rounded-md border border-white/10 bg-black/35 px-2 text-xs text-white/90 outline-none focus-visible:border-[rgba(15,162,209,0.55)] focus-visible:ring-2 focus-visible:ring-[rgba(15,162,209,0.2)] disabled:opacity-50"
                  >
                    <option value="">— None —</option>
                    {options.map((o) => (
                      <option key={o.track_id} value={String(o.track_id)}>
                        {o.track_title ?? o.track_link}
                      </option>
                    ))}
                  </select>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
