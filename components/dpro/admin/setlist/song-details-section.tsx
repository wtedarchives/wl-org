"use client"

import type {
  SegueOptions,
  ShortOptions,
  AdminSetlistEntryData,
} from "@/types/admin"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SongDetailsSectionProps {
  segues: SegueOptions[]
  shorts: ShortOptions[]
  editedEntry: AdminSetlistEntryData | null
  isEditing: boolean
  isNewEntry: boolean
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
}

export function SongDetailsSection({
  segues,
  shorts,
  editedEntry,
  isEditing,
  isNewEntry,
  handleInputChange,
}: SongDetailsSectionProps) {
  const canEdit = isEditing || isNewEntry

  return (
    <>
      <div className="md:col-span-2">
        <label className="mb-0.5 block text-xs font-medium">Short</label>
        {canEdit ? (
          <Select
            value={editedEntry?.entry_short ?? "--"}
            onValueChange={(v) =>
              handleInputChange({
                target: { name: "entry_short", value: v },
              } as React.ChangeEvent<HTMLSelectElement>)
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="--" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="--">--</SelectItem>
              {shorts.map((s) => (
                <SelectItem key={s.song_shorts} value={s.song_shorts}>
                  {s.song_shorts}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={editedEntry?.entry_short ?? ""}
            readOnly
            className="h-8 text-xs"
          />
        )}
      </div>
      <div className="md:col-span-2">
        <label className="mb-0.5 block text-xs font-medium">Segue</label>
        {canEdit ? (
          <Select
            value={editedEntry?.entry_segue ?? "--"}
            onValueChange={(v) =>
              handleInputChange({
                target: { name: "entry_segue", value: v },
              } as React.ChangeEvent<HTMLSelectElement>)
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="--" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="--">--</SelectItem>
              {segues.map((s) => (
                <SelectItem key={s.segues} value={s.segues}>
                  {s.segues}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={editedEntry?.entry_segue ?? ""}
            readOnly
            className="h-8 text-xs"
          />
        )}
      </div>
      <div className="md:col-span-2">
        <label className="mb-0.5 block text-xs font-medium">
          Length (hh:mm:ss)
        </label>
        <Input
          type="text"
          name="entry_length"
          value={editedEntry?.entry_length ?? ""}
          onChange={handleInputChange}
          readOnly={!canEdit}
          placeholder="00:00:00"
          className="h-8 text-xs"
        />
      </div>
    </>
  )
}
