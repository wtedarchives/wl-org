"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVerticalIcon, Loader2Icon, Trash2Icon } from "lucide-react"
import { formatDate } from "@/lib/utils/show-utils"
import type { AdminEpisodeSetlistTableRow } from "@/lib/admin-radio-episode-setlists-enrich"
import type { PlacementOptions, SetOptions, SetnumOptions } from "@/types/admin"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export const EPISODE_SETLIST_NULL = "__none__"

function setSelectValue(v: string | null) {
  return v === EPISODE_SETLIST_NULL || !v ? null : v
}

function orderSelectValue(v: string | null) {
  if (v === EPISODE_SETLIST_NULL || v == null || v === "") return null
  const n = Number.parseInt(v, 10)
  return Number.isFinite(n) ? n : null
}

function placementSelectValue(v: string | null) {
  return v === EPISODE_SETLIST_NULL || !v ? null : v
}

const episodeSetlistSelectTriggerClass =
  "h-auto min-h-6 w-max max-w-none shrink-0 px-1.5 py-1 text-[0.65rem] leading-tight [&_svg]:size-3 [&_[data-slot=select-value]]:!flex-none [&_[data-slot=select-value]]:!overflow-visible [&_[data-slot=select-value]]:whitespace-nowrap"

export function SortableEpisodeSetlistTableRow({
  r,
  sets,
  setnums,
  placements,
  interactionLocked,
  deleteSpinning,
  showGroupTopBorder,
  draftSet,
  draftOrder,
  draftPlacement,
  onSetChange,
  onOrderChange,
  onPlacementChange,
  onDeleteRow,
}: {
  r: AdminEpisodeSetlistTableRow
  sets: SetOptions[]
  setnums: SetnumOptions[]
  placements: PlacementOptions[]
  interactionLocked: boolean
  deleteSpinning: boolean
  showGroupTopBorder: boolean
  draftSet: string | null
  draftOrder: number | null
  draftPlacement: string | null
  onSetChange: (v: string | null) => void
  onOrderChange: (v: number | null) => void
  onPlacementChange: (v: string | null) => void
  onDeleteRow: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: r.eeUuid })

  return (
    <TableRow
      ref={setNodeRef}
      data-dragging={isDragging}
      data-admin-dnd-group-top={showGroupTopBorder ? "true" : undefined}
      className={cn(
        "align-middle border-border/50 hover:bg-background/55 dark:hover:bg-background/25",
        "relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80",
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <TableCell className="align-middle w-8 px-1 py-1">
        <button
          type="button"
          className={cn(
            "flex size-6 touch-manipulation items-center justify-center rounded-md text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-label={`Drag to reorder: ${r.entrySong}`}
          disabled={interactionLocked}
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-3 shrink-0" />
        </button>
      </TableCell>
      <TableCell className="align-middle px-2 py-1.5 text-xs leading-tight">
        <SongDisplayName
          song={r.entrySong}
          songDisplayName={r.songDisplayName}
        />
      </TableCell>
      <TableCell className="align-middle whitespace-nowrap px-2 py-1.5 text-xs leading-tight">
        {r.showDateRaw ? formatDate(r.showDateRaw) : "—"}
      </TableCell>
      <TableCell className="align-middle break-words px-2 py-1.5 text-xs leading-tight">
        {r.venueLocation ?? "—"}
      </TableCell>
      <TableCell className="align-middle break-words px-2 py-1.5 text-xs leading-tight">
        {r.showGroup ?? "—"}
      </TableCell>
      <TableCell className="align-middle whitespace-nowrap px-1.5 py-1">
        <Select
          value={draftSet ?? EPISODE_SETLIST_NULL}
          onValueChange={(v) => onSetChange(setSelectValue(v))}
          disabled={interactionLocked}
        >
          <SelectTrigger
            size="sm"
            className={episodeSetlistSelectTriggerClass}
          >
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value={EPISODE_SETLIST_NULL}>—</SelectItem>
            {sets.map((s) => (
              <SelectItem key={s.set} value={s.set}>
                {s.set}
              </SelectItem>
            ))}
            {draftSet && !sets.some((s) => s.set === draftSet) ?
              <SelectItem value={draftSet}>{draftSet}</SelectItem>
            : null}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="align-middle whitespace-nowrap px-1.5 py-1">
        <Select
          value={
            draftOrder != null ? String(draftOrder) : EPISODE_SETLIST_NULL
          }
          onValueChange={(v) => onOrderChange(orderSelectValue(v))}
          disabled={interactionLocked}
        >
          <SelectTrigger
            size="sm"
            className={episodeSetlistSelectTriggerClass}
          >
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value={EPISODE_SETLIST_NULL}>—</SelectItem>
            {setnums.map((sn) => (
              <SelectItem key={sn.setnums} value={String(sn.setnums)}>
                {sn.setnums}
              </SelectItem>
            ))}
            {draftOrder != null &&
            !setnums.some((s) => s.setnums === draftOrder) ?
              <SelectItem value={String(draftOrder)}>{draftOrder}</SelectItem>
            : null}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="align-middle whitespace-nowrap px-1.5 py-1">
        <Select
          value={draftPlacement ?? EPISODE_SETLIST_NULL}
          onValueChange={(v) =>
            onPlacementChange(placementSelectValue(v))
          }
          disabled={interactionLocked}
        >
          <SelectTrigger
            size="sm"
            className={episodeSetlistSelectTriggerClass}
          >
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value={EPISODE_SETLIST_NULL}>—</SelectItem>
            {placements.map((p) => (
              <SelectItem key={p.placements} value={p.placements}>
                {p.placements}
              </SelectItem>
            ))}
            {draftPlacement &&
            !placements.some((p) => p.placements === draftPlacement) ?
              <SelectItem value={draftPlacement}>{draftPlacement}</SelectItem>
            : null}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="align-middle px-1 py-1">
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 min-w-6 text-destructive hover:bg-destructive/10 [&_svg]:size-3.5"
            aria-label="Remove entry"
            disabled={interactionLocked}
            onClick={onDeleteRow}
          >
            {deleteSpinning ?
              <Loader2Icon className="size-3.5 animate-spin" />
            : <Trash2Icon className="size-3.5" />}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
