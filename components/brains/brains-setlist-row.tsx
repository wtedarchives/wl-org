"use client"

import {
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { DotsSixVertical } from "@phosphor-icons/react"

import { SetlistEntryDiscourseBrain } from "@/components/dpro/admin/setlist/setlist-entry-discourse-brain"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { getPlacementBarCssToken } from "@/lib/placement-bar-color"
import { cn } from "@/lib/utils"
import type { AdminSetlistEntryData } from "@/types/admin"
import type { BrainsSongOption } from "@/hooks/use-brains-entry-options"

interface BrainsSetlistRowProps {
  entry: AdminSetlistEntryData
  showId: string
  readOnly: boolean
  songs: BrainsSongOption[]
  onEdit: (entry: AdminSetlistEntryData) => void
}

export function BrainsSetlistRow({
  entry,
  showId,
  readOnly,
  songs,
  onEdit,
}: BrainsSetlistRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.entry_id, disabled: readOnly })

  const songMeta = songs.find((s) => s.song === entry.entry_song)

  return (
    <li
      ref={setNodeRef}
      data-dragging={isDragging}
      className={cn(
        "wl-home-v2-brains-row",
        isDragging && "wl-home-v2-brains-row--dragging",
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className="wl-home-v2-brains-row__handle">
        {!readOnly ?
          <button
            type="button"
            className="flex size-8 touch-manipulation items-center justify-center rounded-md text-white/50 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label={`Reorder ${entry.entry_song ?? "entry"}`}
            onClick={(e) => e.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <DotsSixVertical className="size-4 shrink-0" aria-hidden />
          </button>
        : null}
      </div>

      <div className="wl-home-v2-brains-row__brain">
        {!readOnly ?
          <SetlistEntryDiscourseBrain
            entry={entry}
            showId={showId}
            surface="brains"
          />
        : null}
      </div>

      <button
        type="button"
        className="wl-home-v2-brains-row__body"
        onClick={() => onEdit(entry)}
      >
        <span className="wl-home-v2-brains-row__num tabular-nums">
          {entry.entry_setnum}
        </span>
        <span className="wl-home-v2-brains-row__song min-w-0">
          <SongDisplayName
            song={entry.entry_song ?? ""}
            songDisplayName={songMeta?.song_displayname}
            className="min-w-0"
            underlineOnHover={false}
          />
        </span>
        <span className="wl-home-v2-brains-row__segue">
          {(entry.entry_segue ?? "").replace(/>/g, "→")}
        </span>
        <span className="wl-home-v2-brains-row__short">
          {entry.entry_short ?? ""}
        </span>
        <span className="wl-home-v2-brains-row__placement">
          <span
            className="wl-home-v2-archive-admin-placement-pill inline-block align-middle"
            data-admin-placement-pill={getPlacementBarCssToken(
              entry.entry_placement,
            )}
          >
            {entry.entry_placement ?? ""}
          </span>
        </span>
      </button>
    </li>
  )
}
