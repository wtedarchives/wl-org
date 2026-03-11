"use client"

import type {
  SetOptions,
  SetnumOptions,
  PlacementOptions,
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

interface BasicInfoSectionProps {
  sets: SetOptions[]
  setnums: SetnumOptions[]
  placements: PlacementOptions[]
  editedEntry: AdminSetlistEntryData | null
  isEditing: boolean
  isNewEntry: boolean
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
}

export function BasicInfoSection({
  sets,
  setnums,
  placements,
  editedEntry,
  isEditing,
  isNewEntry,
  handleInputChange,
}: BasicInfoSectionProps) {
  const canEdit = isEditing || isNewEntry

  return (
    <>
      <div className="md:col-span-2">
        <label className="mb-0.5 block text-xs font-medium">Set</label>
        {canEdit ? (
          <Select
            name="entry_set"
            value={editedEntry?.entry_set ?? "--"}
            onValueChange={(v) =>
              handleInputChange({
                target: { name: "entry_set", value: v },
              } as React.ChangeEvent<HTMLSelectElement>)
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="--" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="--">--</SelectItem>
              {sets.map((s) => (
                <SelectItem key={s.set} value={s.set}>
                  {s.set}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={editedEntry?.entry_set ?? ""}
            readOnly
            className="h-8 text-xs"
          />
        )}
      </div>
      <div className="md:col-span-2">
        <label className="mb-0.5 block text-xs font-medium">Set Number</label>
        {canEdit ? (
          <Select
            value={
              editedEntry?.entry_setnum === null
                ? "--"
                : String(editedEntry?.entry_setnum ?? "--")
            }
            onValueChange={(v) =>
              handleInputChange({
                target: {
                  name: "entry_setnum",
                  value: v === "--" ? "" : v,
                },
              } as React.ChangeEvent<HTMLSelectElement>)
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="--" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="--">--</SelectItem>
              {setnums.map((s) => (
                <SelectItem key={s.setnums} value={String(s.setnums)}>
                  {s.setnums}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={editedEntry?.entry_setnum ?? ""}
            readOnly
            className="h-8 text-xs"
          />
        )}
      </div>
      <div className="md:col-span-2">
        <label className="mb-0.5 block text-xs font-medium">Placement</label>
        {canEdit ? (
          <Select
            value={editedEntry?.entry_placement ?? "--"}
            onValueChange={(v) =>
              handleInputChange({
                target: { name: "entry_placement", value: v },
              } as React.ChangeEvent<HTMLSelectElement>)
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="--" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="--">--</SelectItem>
              {placements.map((p) => (
                <SelectItem key={p.placements} value={p.placements}>
                  {p.placements}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={editedEntry?.entry_placement ?? ""}
            readOnly
            className="h-8 text-xs"
          />
        )}
      </div>
    </>
  )
}
