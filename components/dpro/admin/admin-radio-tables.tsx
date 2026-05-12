"use client"

import { Loader2Icon } from "lucide-react"
import type { WtedRadioIdRow } from "@/lib/wted-radio-ids-sync"
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

export type NewDispositionStatus = "linked" | "skipped"

function RadioTrackDetailCard({ row }: { row: WtedRadioIdRow }) {
  return (
    <div className="space-y-4 rounded-md border bg-muted/30 px-3 py-3 text-sm transition-all duration-200">
      <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-[minmax(0,7.5rem)_1fr] sm:items-baseline">
        <span className="shrink-0 text-muted-foreground">Radio ID</span>
        <span className="font-mono">{row.radio_id}</span>
      </div>
      <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-[minmax(0,7.5rem)_1fr] sm:items-baseline">
        <span className="shrink-0 text-muted-foreground">Artist</span>
        <span>{row.track_artist ?? "—"}</span>
      </div>
      <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-[minmax(0,7.5rem)_1fr] sm:items-baseline">
        <span className="shrink-0 text-muted-foreground">Title</span>
        <span className="break-words">{row.track_title ?? "—"}</span>
      </div>
    </div>
  )
}

/** Clickable rows for NEW or REMOVED lists (opens disposition dialog). */
export function ClickableRadioTracksTable({
  rows,
  onRowClick,
  updatingUuid,
  listKind,
}: {
  rows: WtedRadioIdRow[]
  onRowClick: (row: WtedRadioIdRow) => void
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
      ? `Open actions for track ${radioId}`
      : `Open actions for removed track ${radioId}`

  return (
    <div className="max-h-[min(28rem,55vh)] overflow-auto rounded-[10px] border border-border/80 md:max-h-[min(32rem,50vh)]">
      <Table className="set-table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[7rem] whitespace-nowrap">
              Radio ID
            </TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>Title</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow
              key={r.uuid}
              className={cn(
                "cursor-pointer transition-colors",
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
              <TableCell className="align-top text-sm">
                {r.track_artist ?? "—"}
              </TableCell>
              <TableCell className="align-top text-sm break-words">
                {r.track_title ?? "—"}
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

export function NewDispositionDialog({
  row,
  open,
  onOpenChange,
  onConfirm,
  updating,
}: {
  row: WtedRadioIdRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (status: NewDispositionStatus) => void
  updating: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!updating}>
        <DialogHeader>
          <DialogTitle>Set status</DialogTitle>
          <DialogDescription>
            Set this request track to linked or skipped. It will leave the NEW
            list.
          </DialogDescription>
        </DialogHeader>
        {row ? <RadioTrackDetailCard row={row} /> : null}
        <DialogFooter className="flex flex-row flex-wrap items-center justify-end gap-2 sm:gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={dispositionButtonClass}
            disabled={updating}
            onClick={() => onConfirm("skipped")}
          >
            skipped
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={dispositionButtonClass}
            disabled={updating}
            onClick={() => onConfirm("linked")}
          >
            linked
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RemovedDispositionDialog({
  row,
  open,
  onOpenChange,
  onConfirmSkipped,
  updating,
}: {
  row: WtedRadioIdRow | null
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
            Mark this removed track as skipped. It will leave the REMOVED list.
          </DialogDescription>
        </DialogHeader>
        {row ? <RadioTrackDetailCard row={row} /> : null}
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
