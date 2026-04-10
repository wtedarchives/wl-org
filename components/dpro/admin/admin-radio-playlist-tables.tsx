"use client"

import Image from "next/image"
import { Loader2Icon } from "lucide-react"
import type { WtedEpisodeRadioSyncRow } from "@/lib/wted-episodes-radio-sync"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

function PlaylistDetailCard({ row }: { row: WtedEpisodeRadioSyncRow }) {
  return (
    <div className="space-y-4 rounded-md border bg-muted/30 px-3 py-3 text-sm transition-all duration-200">
      <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-[minmax(0,7.5rem)_1fr] sm:items-baseline">
        <span className="shrink-0 text-muted-foreground">Radio ID</span>
        <span className="font-mono">{row.radio_id}</span>
      </div>
      <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-[minmax(0,7.5rem)_1fr] sm:items-baseline">
        <span className="shrink-0 text-muted-foreground">Episode</span>
        <span className="break-words">{row.episode}</span>
      </div>
      {row.artwork ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,7.5rem)_1fr] sm:items-start">
          <span className="shrink-0 text-muted-foreground">Artwork</span>
          <div className="relative h-24 w-24 overflow-hidden rounded-md border bg-muted">
            <Image
              src={row.artwork}
              alt=""
              fill
              className="object-cover"
              unoptimized
              sizes="96px"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function ClickableRadioPlaylistsTable({
  rows,
  onRowClick,
  updatingUuid,
  listKind,
}: {
  rows: WtedEpisodeRadioSyncRow[]
  onRowClick: (row: WtedEpisodeRadioSyncRow) => void
  updatingUuid: string | null
  listKind: "new" | "removed"
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No rows in this category.</p>
    )
  }
  const ariaOpen = (radioId: string) =>
    listKind === "new"
      ? `Open actions for playlist ${radioId}`
      : `Open actions for removed playlist ${radioId}`

  return (
    <div className="max-h-[min(28rem,55vh)] overflow-auto rounded-md border md:max-h-[min(32rem,50vh)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14 text-center">Art</TableHead>
            <TableHead className="w-[7rem] whitespace-nowrap">
              Radio ID
            </TableHead>
            <TableHead>Episode</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow
              key={r.uuid}
              className={cn(
                "cursor-pointer border-b transition-colors hover:bg-muted/40",
                updatingUuid === r.uuid && "pointer-events-none opacity-70",
              )}
              role="button"
              tabIndex={0}
              aria-busy={updatingUuid === r.uuid}
              aria-label={ariaOpen(r.radio_id)}
              onClick={() => onRowClick(r)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onRowClick(r)
                }
              }}
            >
              <TableCell className="w-14 align-middle">
                {r.artwork ? (
                  <div className="relative mx-auto size-10 overflow-hidden rounded bg-muted">
                    <Image
                      src={r.artwork}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                      sizes="40px"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="align-top font-mono text-xs">
                {updatingUuid === r.uuid ? (
                  <Loader2Icon
                    className="size-4 animate-spin text-muted-foreground"
                    aria-hidden
                  />
                ) : (
                  r.radio_id
                )}
              </TableCell>
              <TableCell className="align-top text-sm break-words">
                {r.episode}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

const dispositionButtonClass =
  "min-h-10 px-3 py-1.5 sm:min-h-9 touch-manipulation"

export function RemovedPlaylistDispositionDialog({
  row,
  open,
  onOpenChange,
  onConfirmSkipped,
  updating,
}: {
  row: WtedEpisodeRadioSyncRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmSkipped: () => void
  updating: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!updating}>
        <DialogHeader>
          <DialogTitle>Set status</DialogTitle>
          <DialogDescription>
            Mark this removed playlist as skipped. It will leave the REMOVED
            list.
          </DialogDescription>
        </DialogHeader>
        {row ? <PlaylistDetailCard row={row} /> : null}
        <DialogFooter className="flex flex-row flex-wrap items-center justify-end gap-2 sm:gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={dispositionButtonClass}
            disabled={updating}
            onClick={() => onConfirmSkipped()}
          >
            skipped
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
