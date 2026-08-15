"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Plus, Trash } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { brainsSetDroppableId, formatBrainsSetLabel } from "@/lib/brains-sets"
import { cn } from "@/lib/utils"
import type { AdminSetlistEntryData } from "@/types/admin"
import type { BrainsSongOption } from "@/hooks/use-brains-entry-options"

import { BrainsSetlistRow } from "./brains-setlist-row"

interface BrainsSetBlockProps {
  setKey: string
  entries: AdminSetlistEntryData[]
  showId: string
  readOnly: boolean
  songs: BrainsSongOption[]
  onAddSong: (setKey: string) => void
  onEdit: (entry: AdminSetlistEntryData) => void
  onDeleteSet: (setKey: string) => void
}

export function BrainsSetBlock({
  setKey,
  entries,
  showId,
  readOnly,
  songs,
  onAddSong,
  onEdit,
  onDeleteSet,
}: BrainsSetBlockProps) {
  const droppableId = brainsSetDroppableId(setKey)
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    disabled: readOnly,
  })
  const sortableIds = entries.map((e) => e.entry_id)
  const encore = setKey.startsWith("E")

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "wl-home-v2-brains-set",
        encore && "wl-home-v2-brains-set--encore",
        isOver && "wl-home-v2-brains-set--over",
      )}
      aria-label={formatBrainsSetLabel(setKey)}
    >
      <header className="wl-home-v2-brains-set__head">
        <h3 className="wl-home-v2-brains-set__title">
          {formatBrainsSetLabel(setKey)}
        </h3>
        {!readOnly ?
          <span className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="wl-home-v2-tours-header-pill min-h-11 gap-1"
              onClick={() => onAddSong(setKey)}
            >
              <Plus className="size-3.5 shrink-0 opacity-80" aria-hidden />
              Add song
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="size-11 shrink-0 p-0 text-white/55 hover:text-rose-200"
              title={`Delete ${formatBrainsSetLabel(setKey)}`}
              aria-label={`Delete ${formatBrainsSetLabel(setKey)}`}
              onClick={() => onDeleteSet(setKey)}
            >
              <Trash className="size-4" aria-hidden />
            </Button>
          </span>
        : null}
      </header>

      <div className="wl-home-v2-brains-set__body">
        {entries.length === 0 ?
          <p className="wl-home-v2-brains-set__empty">
            No songs yet — add one or drag one here
          </p>
        : <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            <ul className="wl-home-v2-brains-set__list">
              {entries.map((entry) => (
                <BrainsSetlistRow
                  key={entry.entry_id}
                  entry={entry}
                  showId={showId}
                  readOnly={readOnly}
                  songs={songs}
                  onEdit={onEdit}
                />
              ))}
            </ul>
          </SortableContext>
        }
      </div>
    </section>
  )
}
