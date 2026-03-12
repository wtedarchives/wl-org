"use client"

import { Save, Edit } from "lucide-react"
import type { SongDataFull } from "@/types/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SongDetailsFormProps {
  selectedSong: SongDataFull
  editedSong: SongDataFull | null
  isEditing: boolean
  isSubmitting: boolean
  categories: { category: string }[]
  artists: { artist: string }[]
  onToggleEdit: () => void
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
}

export function SongDetailsForm({
  selectedSong,
  editedSong,
  isEditing,
  isSubmitting,
  categories,
  artists,
  onToggleEdit,
  onInputChange,
}: SongDetailsFormProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-medium">{selectedSong.song}</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleEdit}
          disabled={isSubmitting}
          className="gap-1"
        >
          {isEditing ? (
            <>
              <Save className="size-4" />
              Save
            </>
          ) : (
            <>
              <Edit className="size-4" />
              Edit
            </>
          )}
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-4">
        <div className="min-w-0">
          <label className="mb-0.5 block text-xs font-medium">Song Title</label>
          <Input
            type="text"
            name="song"
            value={editedSong?.song ?? ""}
            onChange={onInputChange}
            readOnly={!isEditing}
            className="h-6 w-full text-xs"
          />
        </div>
        <div className="min-w-0">
          <label className="mb-0.5 block text-xs font-medium">
            Display Name
          </label>
          <Input
            type="text"
            name="song_displayname"
            value={editedSong?.song_displayname ?? ""}
            onChange={onInputChange}
            readOnly={!isEditing}
            className="h-6 w-full text-xs"
          />
        </div>
        <div className="min-w-0">
          <label className="mb-0.5 block text-xs font-medium">
            Original Artist
          </label>
          {isEditing ? (
            <Select
              value={editedSong?.song_originalartist || "__none__"}
              onValueChange={(v) =>
                onInputChange({
                  target: {
                    name: "song_originalartist",
                    value: v === "__none__" ? "" : v,
                  },
                } as React.ChangeEvent<HTMLSelectElement>)
              }
            >
              <SelectTrigger className="h-6 w-full text-xs">
                <SelectValue placeholder="-- Select Artist --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">-- Select Artist --</SelectItem>
                {artists.map((a) => (
                  <SelectItem key={a.artist} value={a.artist}>
                    {a.artist}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={editedSong?.song_originalartist ?? ""}
              readOnly
              className="h-6 w-full text-xs"
            />
          )}
        </div>
        <div className="min-w-0">
          <label className="mb-0.5 block text-xs font-medium">Category</label>
          {isEditing ? (
            <Select
              value={editedSong?.song_category || "__none__"}
              onValueChange={(v) =>
                onInputChange({
                  target: {
                    name: "song_category",
                    value: v === "__none__" ? "" : v,
                  },
                } as React.ChangeEvent<HTMLSelectElement>)
              }
            >
              <SelectTrigger className="h-6 w-full text-xs">
                <SelectValue placeholder="-- Select Category --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">-- Select Category --</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.category} value={c.category}>
                    {c.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={editedSong?.song_category ?? ""}
              readOnly
              className="h-6 w-full text-xs"
            />
          )}
        </div>
        <div className="min-w-0">
          <label className="mb-0.5 block text-xs font-medium">
            Category Order
          </label>
          <Input
            type="text"
            name="song_categoryorder"
            value={
              editedSong?.song_categoryorder === null
                ? ""
                : editedSong?.song_categoryorder ?? ""
            }
            onChange={onInputChange}
            readOnly={!isEditing}
            className="h-6 w-full text-xs"
          />
        </div>
      </div>
      <div className="mt-2">
        <label className="mb-0.5 block text-xs font-medium">
          Coach&apos;s Notes
        </label>
        <textarea
          name="song_coachnotes"
          value={editedSong?.song_coachnotes ?? ""}
          onChange={onInputChange}
          readOnly={!isEditing}
          rows={4}
          className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
      </div>
    </div>
  )
}
