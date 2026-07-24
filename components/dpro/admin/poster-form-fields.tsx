"use client"

import { useMemo, useState, type Dispatch, type SetStateAction } from "react"
import Image from "next/image"
import { Plus, X } from "lucide-react"
import { getShowDisplayData } from "@/lib/utils/show-utils"
import type { ShowData, ShowPosterArtist, TourData } from "@/types/admin"
import { AdminShowDropdown } from "./admin-show-dropdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { PosterFormFields } from "./poster-modal-form"

interface PosterFormFieldsProps {
  formData: PosterFormFields
  setFormData: Dispatch<SetStateAction<PosterFormFields>>
  shows: ShowData[]
  tours: TourData[]
  knownArtists: ShowPosterArtist[]
  showsLoading: boolean
  showsLoadingProgress: number
  uploading: boolean
  onImageFile: (file: File | null) => void
  error: string | null
}

export function PosterFormFields({
  formData,
  setFormData,
  shows,
  tours,
  knownArtists,
  showsLoading,
  showsLoadingProgress,
  uploading,
  onImageFile,
  error,
}: PosterFormFieldsProps) {
  const [showDropdownOpen, setShowDropdownOpen] = useState(false)
  const [showSearch, setShowSearch] = useState("")
  const [tourPickKey, setTourPickKey] = useState(0)
  const [artistPickKey, setArtistPickKey] = useState(0)

  const showById = useMemo(() => {
    const map = new Map<string, ShowData>()
    for (const s of shows) map.set(s.show_id, s)
    return map
  }, [shows])

  const filteredShows = useMemo(() => {
    const selected = new Set(formData.showIds)
    const q = showSearch.trim().toLowerCase()
    return shows.filter((s) => {
      if (selected.has(s.show_id)) return false
      if (!q) return true
      const { dateStr, canonIdStr, locationStr } = getShowDisplayData(s)
      return `${dateStr}${canonIdStr}${locationStr}`.toLowerCase().includes(q)
    })
  }, [shows, formData.showIds, showSearch])

  const availableTours = useMemo(() => {
    const selected = new Set(formData.tourNames)
    return tours.filter((t) => !selected.has(t.tour))
  }, [tours, formData.tourNames])

  const availableKnownArtists = useMemo(() => {
    const selected = new Set(
      formData.artists
        .map((a) => a.name.trim().toLowerCase())
        .filter(Boolean),
    )
    return knownArtists.filter(
      (a) => !selected.has(a.name.trim().toLowerCase()),
    )
  }, [knownArtists, formData.artists])

  const addShow = (show: { show_id: string }) => {
    setFormData((prev) =>
      prev.showIds.includes(show.show_id)
        ? prev
        : { ...prev, showIds: [...prev.showIds, show.show_id] },
    )
    setShowDropdownOpen(false)
    setShowSearch("")
  }

  const removeShow = (showId: string) => {
    setFormData((prev) => ({
      ...prev,
      showIds: prev.showIds.filter((id) => id !== showId),
    }))
  }

  const addTour = (tourName: string) => {
    if (!tourName) return
    setFormData((prev) =>
      prev.tourNames.includes(tourName)
        ? prev
        : { ...prev, tourNames: [...prev.tourNames, tourName] },
    )
  }

  const removeTour = (tourName: string) => {
    setFormData((prev) => ({
      ...prev,
      tourNames: prev.tourNames.filter((t) => t !== tourName),
    }))
  }

  const addArtistRow = () => {
    setFormData((prev) => ({
      ...prev,
      artists: [...prev.artists, { name: "", link: "" }],
    }))
  }

  const addKnownArtist = (name: string) => {
    const match = knownArtists.find(
      (a) => a.name.trim().toLowerCase() === name.trim().toLowerCase(),
    )
    if (!match) return
    setFormData((prev) => {
      const already = prev.artists.some(
        (a) => a.name.trim().toLowerCase() === match.name.toLowerCase(),
      )
      if (already) return prev
      return {
        ...prev,
        artists: [...prev.artists, { name: match.name, link: match.link }],
      }
    })
  }

  const updateArtist = (
    index: number,
    field: "name" | "link",
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      artists: prev.artists.map((a, i) =>
        i === index ? { ...a, [field]: value } : a,
      ),
    }))
  }

  const removeArtist = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      artists: prev.artists.filter((_, i) => i !== index),
    }))
  }

  const imagePreview =
    formData.image.trim().startsWith("http") ? formData.image.trim() : null

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label>Shows</Label>
        <AdminShowDropdown
          isOpen={showDropdownOpen}
          onToggle={() => setShowDropdownOpen((o) => !o)}
          searchTerm={showSearch}
          onSearchChange={setShowSearch}
          filteredShows={filteredShows}
          onShowSelect={addShow}
          loading={showsLoading}
          loadingProgress={showsLoadingProgress}
          triggerLabel="Add show"
          portalToBody={false}
          menuAlign="left"
        />
        {formData.showIds.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {formData.showIds.map((id) => {
              const show = showById.get(id)
              const label = show
                ? (() => {
                    const d = getShowDisplayData(show)
                    return `${d.dateStr}${d.canonIdStr}${d.locationStr}`
                  })()
                : id
              return (
                <li
                  key={id}
                  className="flex min-h-11 items-center justify-between gap-2 rounded-md border border-border px-2 py-1.5 text-xs"
                >
                  <span className="min-w-0 truncate">{label}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 shrink-0 p-0"
                    onClick={() => removeShow(id)}
                    aria-label={`Remove show ${label}`}
                  >
                    <X className="size-3.5" aria-hidden />
                  </Button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No shows linked.</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Tours</Label>
        {availableTours.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {tours.length === 0
              ? "Loading tours…"
              : "All tours already linked."}
          </p>
        ) : (
          <Select
            key={tourPickKey}
            onValueChange={(v) => {
              addTour(v)
              setTourPickKey((k) => k + 1)
            }}
          >
            <SelectTrigger className="h-11 w-full text-xs sm:h-8">
              <SelectValue placeholder="Add tour" />
            </SelectTrigger>
            <SelectContent>
              {availableTours.map((t) => (
                <SelectItem key={t.tour} value={t.tour}>
                  {t.tour}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {formData.tourNames.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {formData.tourNames.map((tour) => (
              <li
                key={tour}
                className="flex min-h-11 items-center justify-between gap-2 rounded-md border border-border px-2 py-1.5 text-xs"
              >
                <span className="min-w-0 truncate">{tour}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 shrink-0 p-0"
                  onClick={() => removeTour(tour)}
                  aria-label={`Remove tour ${tour}`}
                >
                  <X className="size-3.5" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No tours linked.</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label>Artists</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 gap-1 text-xs sm:h-8"
            onClick={addArtistRow}
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
              addKnownArtist(v)
              setArtistPickKey((k) => k + 1)
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
        {formData.artists.length === 0 ? (
          <p className="text-xs text-muted-foreground">No artists added.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {formData.artists.map((artist, index) => (
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
                    onChange={(e) => updateArtist(index, "name", e.target.value)}
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
                    onChange={(e) => updateArtist(index, "link", e.target.value)}
                    className="h-11 text-xs sm:h-8"
                    placeholder="https://…"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-11 w-11 shrink-0 p-0 sm:h-8 sm:w-8"
                  onClick={() => removeArtist(index)}
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

      <div className="flex flex-col gap-1">
        <Label htmlFor="poster-print-run">Print run</Label>
        <Input
          id="poster-print-run"
          type="number"
          inputMode="numeric"
          min={0}
          value={formData.print_run}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, print_run: e.target.value }))
          }
          className="h-11 text-xs sm:h-8"
          placeholder="e.g. 100"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="poster-description">Description</Label>
        <Textarea
          id="poster-description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          className="min-h-24 text-xs"
          placeholder="Optional notes about this poster"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="poster-image-file">Image</Label>
        <Input
          id="poster-image-file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={uploading}
          className="h-11 cursor-pointer text-xs file:mr-3 file:border-0 file:bg-transparent file:text-xs sm:h-8"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null
            onImageFile(file)
          }}
        />
        <Input
          id="poster-image-url"
          type="url"
          value={formData.image}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, image: e.target.value }))
          }
          className="h-11 text-xs sm:h-8"
          placeholder="Or paste an image URL"
        />
        {uploading ? (
          <p className="text-xs text-muted-foreground">Uploading image…</p>
        ) : null}
        {imagePreview ? (
          <div className="relative h-40 w-full max-w-xs overflow-hidden rounded-md border border-border">
            <Image
              src={imagePreview}
              alt="Poster preview"
              fill
              unoptimized
              className="object-contain"
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
