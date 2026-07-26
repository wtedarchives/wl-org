"use client"

import { Plus, X } from "lucide-react"
import type { ShowPosterArtist } from "@/types/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PosterFormArtistsSectionProps {
  artists: ShowPosterArtist[]
  knownArtists: ShowPosterArtist[]
  availableKnownArtists: ShowPosterArtist[]
  artistPickKey: number
  onArtistPick: (name: string) => void
  onAddArtistRow: () => void
  onUpdateArtist: (
    index: number,
    field: "name" | "link",
    value: string,
  ) => void
  onRemoveArtist: (index: number) => void
}

export function PosterFormArtistsSection({
  artists,
  knownArtists,
  availableKnownArtists,
  artistPickKey,
  onArtistPick,
  onAddArtistRow,
  onUpdateArtist,
  onRemoveArtist,
}: PosterFormArtistsSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label>Artists</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 gap-1 text-xs sm:h-8"
          onClick={onAddArtistRow}
        >
          <Plus className="size-3.5" aria-hidden />
          Add artist
        </Button>
      </div>
      {knownArtists.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No saved poster artists yet — add one below.
        </p>
      ) : availableKnownArtists.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          All known artists already added.
        </p>
      ) : (
        <Select
          key={artistPickKey}
          onValueChange={(v) => {
            onArtistPick(v)
          }}
        >
          <SelectTrigger className="h-11 w-full text-xs sm:h-8">
            <SelectValue placeholder="Choose existing artist…" />
          </SelectTrigger>
          <SelectContent>
            {availableKnownArtists.map((a) => (
              <SelectItem key={a.name.toLowerCase()} value={a.name}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {artists.length === 0 ? (
        <p className="text-xs text-muted-foreground">No artists added.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {artists.map((artist, index) => (
            <li
              key={index}
              className="flex flex-col gap-2 rounded-md border border-border p-2 sm:flex-row sm:items-end"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Label htmlFor={`poster-artist-name-${index}`} className="text-xs">
                  Name
                </Label>
                <Input
                  id={`poster-artist-name-${index}`}
                  value={artist.name}
                  onChange={(e) => onUpdateArtist(index, "name", e.target.value)}
                  className="h-11 text-xs sm:h-8"
                  placeholder="Artist name"
                  list="poster-known-artist-names"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Label htmlFor={`poster-artist-link-${index}`} className="text-xs">
                  Link
                </Label>
                <Input
                  id={`poster-artist-link-${index}`}
                  type="url"
                  value={artist.link}
                  onChange={(e) => onUpdateArtist(index, "link", e.target.value)}
                  className="h-11 text-xs sm:h-8"
                  placeholder="https://…"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-11 w-11 shrink-0 p-0 sm:h-8 sm:w-8"
                onClick={() => onRemoveArtist(index)}
                aria-label={`Remove artist ${index + 1}`}
              >
                <X className="size-3.5" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {knownArtists.length > 0 ? (
        <datalist id="poster-known-artist-names">
          {knownArtists.map((a) => (
            <option key={a.name.toLowerCase()} value={a.name} />
          ))}
        </datalist>
      ) : null}
    </div>
  )
}
