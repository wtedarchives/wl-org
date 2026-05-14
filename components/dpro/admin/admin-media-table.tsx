"use client"

import { Check } from "lucide-react"
import { getPlacementBarCssToken } from "@/lib/placement-bar-color"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AdminMediaTableProps {
  setlistEntries: AdminSetlistEntryData[]
  showReleases: ReleaseShow[]
  mediaEntries: Set<string>
  togglingEntry: string | null
  onToggleAllForRelease: (releaseId: string) => void
  onToggleMedia: (entryId: string, releaseId: string) => void
}

export function AdminMediaTable({
  setlistEntries,
  showReleases,
  mediaEntries,
  togglingEntry,
  onToggleAllForRelease,
  onToggleMedia,
}: AdminMediaTableProps) {
  return (
    <TooltipProvider>
      <Table className="set-table wl-home-v2-admin-setlist-entry-table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-8 text-center text-sm">S</TableHead>
            <TableHead className="w-8 text-center text-sm">#</TableHead>
            <TableHead className="text-left text-sm">Song</TableHead>
            <TableHead className="text-left text-sm">Short</TableHead>
            <TableHead className="text-center text-sm">→</TableHead>
            <TableHead className="text-center text-sm">Placement</TableHead>
            {showReleases.map((rs: ReleaseShow) => {
              const allChecked =
                setlistEntries.length > 0 &&
                setlistEntries.every((e) =>
                  mediaEntries.has(`${e.entry_id}:${rs.release_id}`),
                )
              const someChecked = setlistEntries.some((e) =>
                mediaEntries.has(`${e.entry_id}:${rs.release_id}`),
              )
              return (
                <TableHead key={rs.release_id} className="text-center text-sm">
                  <div className="flex flex-col items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="inline-flex cursor-default items-center justify-center">
                          <ReleaseServiceIcon
                            service={rs.releases?.release_service ?? null}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-medium">
                            {rs.releases?.release_displayname ?? "Release"}
                          </div>
                          {rs.releases?.release_service ?
                            <div className="text-[11px] opacity-90">
                              {rs.releases.release_service}
                            </div>
                          : null}
                        </div>
                      </TooltipContent>
                    </Tooltip>
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
              {showReleases.map((rs: ReleaseShow) => {
                const key = `${entry.entry_id}:${rs.release_id}`
                const isChecked = mediaEntries.has(key)
                const isToggling = togglingEntry === key
                return (
                  <TableCell key={rs.release_id} className="text-center">
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
    </TooltipProvider>
  )
}
