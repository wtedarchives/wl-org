"use client"

import type {
  SetOptions,
  SetnumOptions,
  PlacementOptions,
  AdminSetlistEntryData,
} from "@/types/admin"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react"

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
    <div className="flex flex-col gap-2 md:col-span-6 md:flex-row md:flex-wrap md:items-end md:justify-between md:gap-4">
      <div className="w-full md:w-auto">
        <label className="mb-0.5 block text-xs font-medium">Set</label>
        {canEdit ? (
          <ToggleGroup
            type="single"
            value={
              editedEntry?.entry_set && editedEntry.entry_set !== "--"
                ? editedEntry.entry_set
                : sets[0]?.set ?? ""
            }
            onValueChange={(v) => {
              const valueToSet =
                v ??
                (editedEntry?.entry_set && editedEntry.entry_set !== "--"
                  ? editedEntry.entry_set
                  : sets[0]?.set) ??
                ""
              handleInputChange({
                target: { name: "entry_set", value: valueToSet },
              } as React.ChangeEvent<HTMLSelectElement>)
            }}
            variant="outline"
            size="sm"
            className="!w-full flex-wrap justify-stretch md:w-auto md:justify-start"
          >
            {sets.map((s) => (
              <ToggleGroupItem
                key={s.set}
                value={s.set}
                className="min-w-0 flex-1 text-xs md:flex-initial"
              >
                {s.set}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : (
          <Input
            value={editedEntry?.entry_set ?? ""}
            readOnly
            className="h-6 w-full text-xs md:w-auto"
          />
        )}
      </div>
      <div className="w-full md:w-auto">
        <label className="mb-0.5 block text-xs font-medium">Set Number</label>
        {canEdit ? (
          <div className="flex h-6 w-full items-center gap-1 md:w-auto">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-6 w-6 shrink-0 transition-all duration-150 hover:!bg-primary/25 hover:!ring-2 hover:!ring-primary/60"
              onClick={() => {
                const current =
                  editedEntry?.entry_setnum ?? 1
                const next = Math.max(
                  1,
                  typeof current === "number" ? current - 1 : parseInt(String(current)) - 1
                )
                handleInputChange({
                  target: {
                    name: "entry_setnum",
                    value: String(next),
                  },
                } as React.ChangeEvent<HTMLSelectElement>)
              }}
            >
              <Minus className="size-4" />
            </Button>
            <Input
              type="number"
              name="entry_setnum"
              min={1}
              max={30}
              value={
                editedEntry?.entry_setnum != null &&
                editedEntry.entry_setnum > 0
                  ? editedEntry.entry_setnum
                  : 1
              }
              onChange={(e) => {
                const v = e.target.value
                const n = v === "" ? 1 : parseInt(v, 10)
                const clamped = Number.isNaN(n)
                  ? 1
                  : Math.min(30, Math.max(1, n))
                handleInputChange({
                  target: {
                    name: "entry_setnum",
                    value: String(clamped),
                  },
                } as React.ChangeEvent<HTMLInputElement>)
              }}
              className="h-6 min-w-12 flex-1 text-center text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-6 w-6 shrink-0 transition-all duration-150 hover:!bg-primary/25 hover:!ring-2 hover:!ring-primary/60"
              onClick={() => {
                const current =
                  editedEntry?.entry_setnum ?? 1
                const next = Math.min(
                  30,
                  typeof current === "number" ? current + 1 : parseInt(String(current)) + 1
                )
                handleInputChange({
                  target: {
                    name: "entry_setnum",
                    value: String(next),
                  },
                } as React.ChangeEvent<HTMLSelectElement>)
              }}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        ) : (
          <Input
            value={editedEntry?.entry_setnum ?? ""}
            readOnly
            className="h-6 w-full text-xs md:w-auto"
          />
        )}
      </div>
      <div className="w-full md:w-auto">
        <label className="mb-0.5 block text-xs font-medium">Placement</label>
        {canEdit ? (
          <div className="flex h-6 w-full items-center gap-1 md:w-auto">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-6 w-6 shrink-0 transition-all duration-150 hover:!bg-primary/25 hover:!ring-2 hover:!ring-primary/60"
              onClick={() => {
                const idx = placements.findIndex(
                  (p) => p.placements === (editedEntry?.entry_placement ?? "--")
                )
                const prevIdx =
                  idx <= 0 ? placements.length - 1 : idx - 1
                const value =
                  placements[prevIdx]?.placements ?? "--"
                handleInputChange({
                  target: { name: "entry_placement", value },
                } as React.ChangeEvent<HTMLSelectElement>)
              }}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Input
              type="text"
              name="entry_placement"
              value={editedEntry?.entry_placement ?? "--"}
              readOnly
              className="h-6 min-w-0 flex-1 text-center text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-6 w-6 shrink-0 transition-all duration-150 hover:!bg-primary/25 hover:!ring-2 hover:!ring-primary/60"
              onClick={() => {
                const idx = placements.findIndex(
                  (p) => p.placements === (editedEntry?.entry_placement ?? "--")
                )
                const nextIdx =
                  idx < 0 || idx >= placements.length - 1 ? 0 : idx + 1
                const value =
                  placements[nextIdx]?.placements ?? "--"
                handleInputChange({
                  target: { name: "entry_placement", value },
                } as React.ChangeEvent<HTMLSelectElement>)
              }}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        ) : (
          <Input
            value={editedEntry?.entry_placement ?? ""}
            readOnly
            className="h-6 w-full text-xs md:w-auto"
          />
        )}
      </div>
    </div>
  )
}
