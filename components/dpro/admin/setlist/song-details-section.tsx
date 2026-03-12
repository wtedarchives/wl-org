"use client"

import { useState, useCallback, useEffect } from "react"
import type {
  ShortOptions,
  AdminSetlistEntryData,
} from "@/types/admin"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  parseLengthToHhMmSs,
  formatLengthForInput,
} from "@/lib/utils/show-utils"

interface SongDetailsSectionProps {
  shorts: ShortOptions[]
  editedEntry: AdminSetlistEntryData | null
  isEditing: boolean
  isNewEntry: boolean
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
}

export function SongDetailsSection({
  shorts,
  editedEntry,
  isEditing,
  isNewEntry,
  handleInputChange,
}: SongDetailsSectionProps) {
  const canEdit = isEditing || isNewEntry

  const [lengthInputValue, setLengthInputValue] = useState(() =>
    formatLengthForInput(editedEntry?.entry_length ?? "")
  )

  useEffect(() => {
    setLengthInputValue(formatLengthForInput(editedEntry?.entry_length ?? ""))
  }, [editedEntry?.entry_id, editedEntry?.entry_length])

  const handleLengthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      setLengthInputValue(raw)
      const normalized = parseLengthToHhMmSs(raw)
      if (normalized !== null || raw.trim() === "") {
        handleInputChange({
          target: {
            name: "entry_length",
            value: normalized ?? "",
          },
        } as React.ChangeEvent<HTMLInputElement>)
      }
    },
    [handleInputChange]
  )

  const handleLengthBlur = useCallback(() => {
    const normalized = parseLengthToHhMmSs(lengthInputValue)
    if (normalized !== null) {
      setLengthInputValue(formatLengthForInput(normalized))
      handleInputChange({
        target: { name: "entry_length", value: normalized },
      } as React.ChangeEvent<HTMLInputElement>)
    } else if (lengthInputValue.trim() === "") {
      handleInputChange({
        target: { name: "entry_length", value: "" },
      } as React.ChangeEvent<HTMLInputElement>)
    }
  }, [lengthInputValue, handleInputChange])

  return (
    <div className="flex flex-col gap-2 md:col-span-6 md:flex-row md:flex-wrap md:items-end md:justify-between md:gap-4">
      <div className="w-full md:w-auto">
        <label className="mb-0.5 block text-xs font-medium">Short</label>
        {canEdit ? (
          <>
            <div className="flex flex-wrap gap-0.5 md:hidden">
              <Button
                type="button"
                variant={
                  (!editedEntry?.entry_short || editedEntry.entry_short === "--")
                    ? "default"
                    : "outline"
                }
                size="sm"
                className="h-6 text-xs transition-colors hover:!bg-muted hover:!text-foreground"
                onClick={() =>
                  handleInputChange({
                    target: { name: "entry_short", value: "--" },
                  } as React.ChangeEvent<HTMLSelectElement>)
                }
              >
                --
              </Button>
              {shorts.map((s) => (
                <Button
                  key={s.song_shorts}
                  type="button"
                  variant={
                    editedEntry?.entry_short === s.song_shorts
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="h-6 text-xs transition-colors hover:!bg-muted hover:!text-foreground"
                  onClick={() =>
                    handleInputChange({
                      target: { name: "entry_short", value: s.song_shorts },
                    } as React.ChangeEvent<HTMLSelectElement>)
                  }
                >
                  {s.song_shorts}
                </Button>
              ))}
            </div>
            <div className="hidden md:block">
              <ToggleGroup
                type="single"
                value={
                  editedEntry?.entry_short && editedEntry.entry_short !== "--"
                    ? editedEntry.entry_short
                    : "--"
                }
                onValueChange={(v) => {
                  const valueToSet = v ?? "--"
                  handleInputChange({
                    target: { name: "entry_short", value: valueToSet },
                  } as React.ChangeEvent<HTMLSelectElement>)
                }}
                variant="outline"
                size="sm"
                className="w-auto flex-wrap justify-start"
              >
                <ToggleGroupItem key="--" value="--" className="shrink-0 text-xs">
                  --
                </ToggleGroupItem>
                {shorts.map((s) => (
                  <ToggleGroupItem
                    key={s.song_shorts}
                    value={s.song_shorts}
                    className="shrink-0 text-xs"
                  >
                    {s.song_shorts}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </>
        ) : (
          <Input
            value={editedEntry?.entry_short ?? ""}
            readOnly
            className="h-6 w-full text-xs md:w-auto"
          />
        )}
      </div>
      <div className="flex w-full flex-row items-end gap-6 md:contents">
        <div className="shrink-0 md:w-auto">
          <label className="mb-0.5 block text-xs font-medium">Segue</label>
          {canEdit ? (
            <div className="flex h-6 items-center">
              <Checkbox
                id="entry_segue"
                checked={(editedEntry?.entry_segue ?? "") === ">"}
                onCheckedChange={(checked) =>
                  handleInputChange({
                    target: {
                      name: "entry_segue",
                      value: checked ? ">" : "",
                    },
                  } as React.ChangeEvent<HTMLSelectElement>)
                }
                className="h-4 w-4"
              />
              <label
                htmlFor="entry_segue"
                className="ml-2 cursor-pointer text-xs"
              >
                →
              </label>
            </div>
          ) : (
            <Input
              value={editedEntry?.entry_segue === ">" ? ">" : ""}
              readOnly
              className="h-6 w-full text-xs md:w-auto"
            />
          )}
        </div>
        <div className="min-w-0 flex-1 md:w-auto">
          <label className="mb-0.5 block text-xs font-medium">Length</label>
          <Input
            type="text"
            name="entry_length"
            value={lengthInputValue}
            onChange={handleLengthChange}
            onBlur={handleLengthBlur}
            readOnly={!canEdit}
            placeholder="mm:ss or h:mm:ss"
            className="h-6 w-full text-xs"
          />
        </div>
      </div>
    </div>
  )
}
