"use client"

import { useMemo } from "react"
import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"

import { parseBrainsSetDroppableId, sortBrainsSetKeys } from "@/lib/brains-sets"
import type { AdminSetlistEntryData } from "@/types/admin"
import type { BrainsSongOption } from "@/hooks/use-brains-entry-options"

import { BrainsAddSet } from "./brains-add-set"
import { BrainsSetBlock } from "./brains-set-block"

interface BrainsSetlistBoardProps {
  entries: AdminSetlistEntryData[]
  visualSets: string[]
  availableSets: string[]
  showId: string
  readOnly: boolean
  songs: BrainsSongOption[]
  onAddSet: (setKey: string) => void
  onAddSong: (setKey: string) => void
  onEdit: (entry: AdminSetlistEntryData) => void
  onDeleteSet: (setKey: string) => void
  onReorder: (activeId: string, overId: string) => void
}

export function BrainsSetlistBoard({
  entries,
  visualSets,
  availableSets,
  showId,
  readOnly,
  songs,
  onAddSet,
  onAddSong,
  onEdit,
  onDeleteSet,
  onReorder,
}: BrainsSetlistBoardProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor),
  )

  const collisionDetection: CollisionDetection = (args) => {
    const pointer = pointerWithin(args)
    const hits = pointer.length > 0 ? pointer : closestCorners(args)
    const item = hits.find(
      (c) => parseBrainsSetDroppableId(String(c.id)) === null,
    )
    return item ? [item] : hits
  }

  const bySet = useMemo(() => {
    const map = new Map<string, AdminSetlistEntryData[]>()
    for (const setKey of visualSets) map.set(setKey, [])
    for (const entry of entries) {
      const key = entry.entry_set ?? "1"
      const list = map.get(key)
      if (list) list.push(entry)
      else map.set(key, [entry])
    }
    return map
  }, [entries, visualSets])

  const orderedSets = useMemo(
    () => sortBrainsSetKeys(bySet.keys()),
    [bySet],
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    onReorder(String(active.id), String(over.id))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <div className="wl-home-v2-brains-board">
        {orderedSets.length === 0 ?
          <p className="m-0 px-1 py-8 text-center text-xs text-white/65">
            Add a set to start the setlist
          </p>
        : orderedSets.map((setKey) => (
            <BrainsSetBlock
              key={setKey}
              setKey={setKey}
              entries={bySet.get(setKey) ?? []}
              showId={showId}
              readOnly={readOnly}
              songs={songs}
              onAddSong={onAddSong}
              onEdit={onEdit}
              onDeleteSet={onDeleteSet}
            />
          ))
        }
        {!readOnly ?
          <BrainsAddSet availableSets={availableSets} onAdd={onAddSet} />
        : null}
      </div>
    </DndContext>
  )
}
