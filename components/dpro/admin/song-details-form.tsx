"use client"

import { FloppyDisk, PencilSimple } from "@phosphor-icons/react"
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
    <div className="wl-home-v2-archive-admin-song-form">
      <div className="wl-home-v2-archive-admin-song-form__head">
        <h4 className="wl-home-v2-archive-admin-song-form__title">
          {selectedSong.song}
        </h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggleEdit}
          disabled={isSubmitting}
          className="wl-home-v2-tours-header-pill shrink-0 gap-1"
        >
          {isEditing ?
            <>
              <FloppyDisk className="size-3.5 shrink-0 opacity-80" aria-hidden />
              Save
            </>
          : <>
              <PencilSimple className="size-3.5 shrink-0 opacity-80" aria-hidden />
              Edit
            </>
          }
        </Button>
      </div>
      <div className="wl-home-v2-archive-admin-song-form__grid">
        <div className="min-w-0">
          <label htmlFor="song-admin-song">Song Title</label>
          <Input
            id="song-admin-song"
            type="text"
            name="song"
            value={editedSong?.song ?? ""}
            onChange={onInputChange}
            readOnly={!isEditing}
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="song-admin-displayname">Display Name</label>
          <Input
            id="song-admin-displayname"
            type="text"
            name="song_displayname"
            value={editedSong?.song_displayname ?? ""}
            onChange={onInputChange}
            readOnly={!isEditing}
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="song-admin-original-artist">Original Artist</label>
          {isEditing ?
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
              <SelectTrigger id="song-admin-original-artist" size="sm">
                <SelectValue placeholder="-- Select Artist --" />
              </SelectTrigger>
              <SelectContent className="wl-home-v2-archive-admin-portal-content">
                <SelectItem value="__none__">-- Select Artist --</SelectItem>
                {artists.map((a) => (
                  <SelectItem key={a.artist} value={a.artist}>
                    {a.artist}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          : <Input value={editedSong?.song_originalartist ?? ""} readOnly />}
        </div>
        <div className="min-w-0">
          <label htmlFor="song-admin-category">Category</label>
          {isEditing ?
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
              <SelectTrigger id="song-admin-category" size="sm">
                <SelectValue placeholder="-- Select Category --" />
              </SelectTrigger>
              <SelectContent className="wl-home-v2-archive-admin-portal-content">
                <SelectItem value="__none__">-- Select Category --</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.category} value={c.category}>
                    {c.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          : <Input value={editedSong?.song_category ?? ""} readOnly />}
        </div>
        <div className="min-w-0">
          <label htmlFor="song-admin-categoryorder">Category Order</label>
          <Input
            id="song-admin-categoryorder"
            type="text"
            name="song_categoryorder"
            value={
              editedSong?.song_categoryorder === null
                ? ""
                : (editedSong?.song_categoryorder ?? "")
            }
            onChange={onInputChange}
            readOnly={!isEditing}
          />
        </div>
        <div className="wl-home-v2-archive-admin-song-form__notes min-w-0">
          <label htmlFor="song-admin-coachnotes">Coach&apos;s Notes</label>
          <textarea
            id="song-admin-coachnotes"
            name="song_coachnotes"
            value={editedSong?.song_coachnotes ?? ""}
            onChange={onInputChange}
            readOnly={!isEditing}
            rows={4}
          />
        </div>
      </div>
    </div>
  )
}
