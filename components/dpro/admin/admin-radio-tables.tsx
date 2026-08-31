"use client"

import { useMemo, useState } from "react"
import { Loader2Icon } from "lucide-react"
import type { WtedRadioIdRow } from "@/lib/wted-radio-ids-sync"
import type { AdminShowData } from "@/types/admin"
import { AdminShowDropdown } from "@/components/dpro/admin/admin-show-dropdown"
import { formatDate } from "@/lib/utils/show-utils"
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

/** Show list + assignment plumbing shared by the disposition dialog. */
export type AdminRadioShowPickerProps = {
  allShows: AdminShowData[]
  showsLoading: boolean
  loadingProgress: number
  /** Persists immediately on select; resolves false if the write failed. */
  onAssignShow: (showId: string | null) => Promise<boolean>
  assigningShow: boolean
}

/**
 * Assigns `wted_radio_ids.show_id` from inside the disposition dialog, so a
 * track can be mapped and dispositioned in one pass.
 *
 * The show is what gives an otherwise artwork-less track its image: the catalog
 * view resolves show -> lowest-release_order release -> release_artwork. Tracks
 * imported from the Radio.co Studio catalog arrive with no show at all, which is
 * why this needs to be quick to do in bulk.
 */
function ShowAssignRow({
  row,
  allShows,
  showsLoading,
  loadingProgress,
  onAssignShow,
  assigningShow,
  disabled,
}: AdminRadioShowPickerProps & {
  row: WtedRadioIdRow
  disabled: boolean
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const selectedShow = useMemo(
    () => allShows.find((s) => s.show_id === row.show_id) ?? null,
    [allShows, row.show_id],
  )

  const filteredShows = useMemo(() => {
    const t = searchTerm.toLowerCase()
    if (!t) return allShows
    return allShows.filter((show) => {
      const dateStr = formatDate(show.show_date)
      return (
        dateStr.toLowerCase().includes(t) ||
        show.show_canonid?.toString().includes(t) ||
        show.show_group?.toLowerCase().includes(t) ||
        show.show_venue_location?.toLowerCase().includes(t) ||
        show.show_subvenue?.toLowerCase().includes(t)
      )
    })
  }, [allShows, searchTerm])

  const triggerLabel =
    selectedShow ? formatDate(selectedShow.show_date)
    : row.show_id ? "Show not in list"
    : "Select show"

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-[minmax(0,7.5rem)_1fr] sm:items-center">
      <span className="shrink-0 text-muted-foreground">Show</span>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {/*
          portalToBody={false} is required here: the dropdown's own docs note
          that Radix's inert/pointer handling blocks a body portal inside a
          modal dialog, so the menu must stay in the dialog's stacking context.
        */}
        <AdminShowDropdown
          isOpen={isOpen}
          onToggle={() => setIsOpen((v) => !v)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filteredShows={filteredShows}
          onShowSelect={(show) => {
            setIsOpen(false)
            if (show.show_id === row.show_id) return
            void onAssignShow(show.show_id)
          }}
          loading={showsLoading}
          loadingProgress={loadingProgress}
          selectedShow={selectedShow}
          triggerLabel={triggerLabel}
          portalToBody={false}
          menuAlign="left"
        />

        {assigningShow ?
          <Loader2Icon className="size-3.5 shrink-0 animate-spin opacity-70" />
        : null}

        {row.show_id && !assigningShow ?
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            disabled={disabled}
            onClick={() => void onAssignShow(null)}
          >
            Clear
          </Button>
        : null}
      </div>

      {selectedShow ?
        <p className="text-xs text-muted-foreground sm:col-start-2">
          {selectedShow.show_group || "—"}
          {selectedShow.show_venue_location ?
            ` · ${selectedShow.show_venue_location}`
          : ""}
        </p>
      : null}
    </div>
  )
}

/**
 * `bare` omits the card chrome so a caller can wrap these rows together with
 * extra controls (the NEW dialog adds a show picker) inside one card.
 */
export function RadioTrackDetailCard({
  row,
  bare = false,
}: {
  row: WtedRadioIdRow
  bare?: boolean
}) {
  const rows = (
    <>
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
    </>
  )

  if (bare) return <div className="space-y-4">{rows}</div>

  return (
    <div className="space-y-4 rounded-md border bg-muted/30 px-3 py-3 text-sm transition-all duration-200">
      {rows}
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
  listKind: "new" | "removed" | "orphan"
}) {
  if (rows.length === 0) {
    return (
      <p className="wl-home-v2-admin-radio-tab-table-hint">
        {listKind === "orphan"
          ? "Run Sync to list catalog rows that are not in Radio.co."
          : "No rows in this category."}
      </p>
    )
  }
  const ariaOpen = (radioId: string) =>
    listKind === "new"
      ? `Open actions for track ${radioId}`
      : listKind === "orphan"
        ? `Open remove dialog for track ${radioId} missing from Radio.co`
        : `Open actions for removed track ${radioId}`

  return (
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
              "cursor-pointer text-xs transition-colors",
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
                  className="size-4 shrink-0 animate-spin opacity-70"
                  aria-hidden
                />
              ) : (
                r.radio_id
              )}
            </TableCell>
            <TableCell className="align-top text-xs">{r.track_artist ?? "—"}</TableCell>
            <TableCell className="align-top text-xs break-words">
              {r.track_title ?? "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
  showPicker,
}: {
  row: WtedRadioIdRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (status: NewDispositionStatus) => void
  updating: boolean
  showPicker: AdminRadioShowPickerProps
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!updating}>
        <DialogHeader>
          <DialogTitle>Set status</DialogTitle>
          <DialogDescription>
            Assign a show to give this track artwork, then set it to linked or
            skipped. Choosing a show saves immediately; linked/skipped is what
            removes it from the NEW list.
          </DialogDescription>
        </DialogHeader>
        {row ?
          <div className="space-y-4 rounded-md border bg-muted/30 px-3 py-3 text-sm transition-all duration-200">
            <RadioTrackDetailCard row={row} bare />
            <ShowAssignRow
              row={row}
              disabled={updating}
              {...showPicker}
            />
          </div>
        : null}
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
