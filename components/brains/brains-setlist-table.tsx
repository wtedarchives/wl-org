"use client"

import { useMemo } from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { SortableContext, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { DotsSixVertical } from "@phosphor-icons/react"

import { SetlistEntryDiscourseBrain } from "@/components/dpro/admin/setlist/setlist-entry-discourse-brain"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getPlacementBarCssToken } from "@/lib/placement-bar-color"
import { cn } from "@/lib/utils"
import type { AdminSetlistEntryData } from "@/types/admin"

interface BrainsSetlistRowProps {
  entry: AdminSetlistEntryData
  showId: string
  readOnly: boolean
  onEdit: (entry: AdminSetlistEntryData) => void
  /** True for the first row of a set, which gets a divider above it. */
  startsSet: boolean
}

function BrainsSetlistRow({
  entry,
  showId,
  readOnly,
  onEdit,
  startsSet,
}: BrainsSetlistRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.entry_id, disabled: readOnly })

  return (
    <TableRow
      ref={setNodeRef}
      data-dragging={isDragging}
      data-brains-set-top={startsSet ? "true" : undefined}
      onClick={() => onEdit(entry)}
      className={cn(
        "cursor-pointer align-middle",
        "relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80",
        startsSet && "border-t-2 border-t-white/20",
      )}
      style={{
        // Runtime-only: dnd-kit sortable transform / transition.
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <TableCell className="w-8 px-1 py-1 align-middle">
        {!readOnly && (
          <button
            type="button"
            // Large enough to hit with a thumb, and touch-manipulation so the
            // 200ms press-and-hold gesture is not fighting the browser.
            className="flex size-7 touch-manipulation items-center justify-center rounded-md text-white/50 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label={`Reorder ${entry.entry_song ?? "entry"}`}
            onClick={(e) => e.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <DotsSixVertical className="size-3.5 shrink-0" aria-hidden />
          </button>
        )}
      </TableCell>

      {/* The brain posts to Discourse, push, Bluesky and Instagram — a write, so
          it disappears rather than fails once the window has closed. */}
      <TableCell className="wl-home-v2-admin-setlist-discourse-brain-cell align-middle">
        {!readOnly && (
          <SetlistEntryDiscourseBrain entry={entry} showId={showId} />
        )}
      </TableCell>

      <TableCell className="text-center text-xs tabular-nums">
        {entry.entry_set}
      </TableCell>
      <TableCell className="text-center text-xs tabular-nums">
        {entry.entry_setnum}
      </TableCell>
      <TableCell className="min-w-0 text-xs font-medium">
        {entry.entry_song}
      </TableCell>
      <TableCell className="text-center text-xs">
        {(entry.entry_segue ?? "").replace(/>/g, "→")}
      </TableCell>
      <TableCell className="hidden text-xs sm:table-cell">
        {entry.entry_short ?? ""}
      </TableCell>
      <TableCell className="hidden text-center sm:table-cell">
        <div
          className="wl-home-v2-archive-admin-placement-pill inline-block align-middle"
          data-admin-placement-pill={getPlacementBarCssToken(
            entry.entry_placement,
          )}
        >
          {entry.entry_placement ?? ""}
        </div>
      </TableCell>
      <TableCell className="hidden text-xs md:table-cell">
        {entry.entry_coachnotes ?? ""}
      </TableCell>
    </TableRow>
  )
}

interface BrainsSetlistTableProps {
  entries: AdminSetlistEntryData[]
  showId: string
  readOnly: boolean
  onEdit: (entry: AdminSetlistEntryData) => void
  onReorder: (activeId: string, overId: string) => void
}

/**
 * The setlist, draggable.
 *
 * Sensors match the Radio episode table this borrows from: a 6px mouse threshold
 * so a click still selects, a 200ms touch delay so vertical page scrolling wins
 * unless the user really means to drag, and a keyboard sensor so reordering is
 * reachable without a pointer. Movement is locked to the vertical axis.
 *
 * Dragging is disabled outright when read-only, so an expired window cannot start
 * a gesture the server would refuse.
 */
export function BrainsSetlistTable({
  entries,
  showId,
  readOnly,
  onEdit,
  onReorder,
}: BrainsSetlistTableProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor),
  )

  const sortableIds = useMemo<UniqueIdentifier[]>(
    () => entries.map((e) => e.entry_id),
    [entries],
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    onReorder(String(active.id), String(over.id))
  }

  if (entries.length === 0) {
    return (
      <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-white/50">
        Nothing yet — add the first song
      </p>
    )
  }

  return (
    <div className="min-w-0 overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <Table className="set-table wl-home-v2-admin-setlist-entry-table">
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <span className="sr-only">Reorder</span>
              </TableHead>
              <TableHead
                className="wl-home-v2-admin-setlist-discourse-brain-head text-center text-sm"
                aria-label="Post to chat"
              />
              <TableHead className="w-8 text-center text-sm">S</TableHead>
              <TableHead className="w-8 text-center text-sm">#</TableHead>
              <TableHead className="text-left text-sm">Song</TableHead>
              <TableHead className="text-center text-sm">→</TableHead>
              <TableHead className="hidden text-left text-sm sm:table-cell">
                Short
              </TableHead>
              <TableHead className="hidden text-center text-sm sm:table-cell">
                Placement
              </TableHead>
              <TableHead className="hidden text-left text-sm md:table-cell">
                Notes
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <SortableContext items={sortableIds}>
              {entries.map((entry, i) => (
                <BrainsSetlistRow
                  key={entry.entry_id}
                  entry={entry}
                  showId={showId}
                  readOnly={readOnly}
                  onEdit={onEdit}
                  startsSet={i > 0 && entries[i - 1].entry_set !== entry.entry_set}
                />
              ))}
            </SortableContext>
          </TableBody>
        </Table>
      </DndContext>
    </div>
  )
}
