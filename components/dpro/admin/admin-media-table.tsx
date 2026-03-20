"use client"

import { Check } from "lucide-react"
import { getPlacementColor } from "@/components/dpro/setlistgame/song-selection/utils"
import type { AdminSetlistEntryData } from "@/types/admin"
import type { ReleaseShow } from "@/types/admin"
import { ReleaseServiceIcon } from "../setlist/setlist-media-section"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface AdminMediaTableProps {
  setlistEntries: AdminSetlistEntryData[]
  showReleases: ReleaseShow[]
  mediaEntries: Set<string>
  togglingEntry: string | null
  headerRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
  onHoverRelease: (releaseId: string | null) => void
  onToggleAllForRelease: (releaseId: string) => void
  onToggleMedia: (entryId: string, releaseId: string) => void
}

export function AdminMediaTable({
  setlistEntries,
  showReleases,
  mediaEntries,
  togglingEntry,
  headerRefs,
  onHoverRelease,
  onToggleAllForRelease,
  onToggleMedia,
}: AdminMediaTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60">
            <TableHead className="py-1 text-center text-xs border-r">S</TableHead>
            <TableHead className="py-1 text-center text-xs border-r">#</TableHead>
            <TableHead className="py-1 text-left text-xs border-r">Song</TableHead>
            <TableHead className="py-1 text-left text-xs border-r">Short</TableHead>
            <TableHead className="py-1 text-left text-xs border-r">→</TableHead>
            <TableHead className="py-1 text-center text-xs border-r">
              Placement
            </TableHead>
            {showReleases.map((rs: ReleaseShow) => {
              const allChecked =
                setlistEntries.length > 0 &&
                setlistEntries.every((e) =>
                  mediaEntries.has(`${e.entry_id}:${rs.release_id}`)
                )
              const someChecked = setlistEntries.some((e) =>
                mediaEntries.has(`${e.entry_id}:${rs.release_id}`)
              )
              return (
                <TableHead
                  key={rs.release_id}
                  className="py-1 text-center text-xs border-r"
                >
                  <div className="flex flex-col items-center gap-1">
                    <div
                      ref={(el) => {
                        headerRefs.current[rs.release_id] = el
                      }}
                      className="cursor-pointer"
                      onMouseEnter={() => onHoverRelease(rs.release_id)}
                      onMouseLeave={() => onHoverRelease(null)}
                    >
                      <ReleaseServiceIcon service={rs.releases?.release_service ?? null} />
                    </div>
                    <Button
                      variant={allChecked ? "default" : "outline"}
                      size="sm"
                      className="size-4 p-0 transition-colors hover:bg-muted/80 hover:border-muted-foreground/30"
                      onClick={() => onToggleAllForRelease(rs.release_id)}
                      title={allChecked ? "Deselect all" : "Select all"}
                    >
                      {allChecked && <Check className="size-2.5" />}
                      {someChecked && !allChecked && (
                        <span className="text-[0.5rem]">−</span>
                      )}
                    </Button>
                  </div>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {setlistEntries.map((entry) => (
            <TableRow key={entry.entry_id} className="text-xs hover:bg-muted/50">
              <TableCell className="py-1 text-center border-r">
                {entry.entry_set}
              </TableCell>
              <TableCell className="py-1 text-center border-r">
                {entry.entry_setnum}
              </TableCell>
              <TableCell className="py-1 border-r">{entry.entry_song}</TableCell>
              <TableCell className="py-1 border-r">
                {entry.entry_short || ""}
              </TableCell>
              <TableCell className="py-1 border-r">
                {entry.entry_segue === ">" ? "→" : (entry.entry_segue || "")}
              </TableCell>
              <TableCell className="py-1 border-r">
                <div
                  className="mx-auto w-fit rounded-lg px-2 py-0.5 text-center font-medium"
                  style={{
                    backgroundColor: getPlacementColor(
                      entry.entry_placement ?? undefined
                    ),
                    color: "white",
                  }}
                >
                  {entry.entry_placement || ""}
                </div>
              </TableCell>
              {showReleases.map((rs: ReleaseShow) => {
                const key = `${entry.entry_id}:${rs.release_id}`
                const isChecked = mediaEntries.has(key)
                const isToggling = togglingEntry === key
                return (
                  <TableCell
                    key={rs.release_id}
                    className="py-1 text-center border-r"
                  >
                    <Button
                      variant={isChecked ? "default" : "outline"}
                      size="sm"
                      className="size-4 p-0 transition-colors hover:bg-muted hover:border-muted-foreground/40 data-[variant=default]:hover:bg-primary/90 data-[variant=default]:hover:ring-2 data-[variant=default]:hover:ring-primary/40"
                      onClick={() => onToggleMedia(entry.entry_id, rs.release_id)}
                      disabled={isToggling}
                    >
                      {isChecked && <Check className="size-3" />}
                    </Button>
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
