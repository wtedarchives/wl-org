"use client"

import type { Dispatch, SetStateAction } from "react"
import type { ShowData, ShowPosterArtist, TourData } from "@/types/admin"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PosterFormArtistsSection } from "./poster-form-artists-section"
import { PosterFormImageSection } from "./poster-form-image-section"
import { PosterFormShowsSection } from "./poster-form-shows-section"
import { PosterFormToursSection } from "./poster-form-tours-section"
import type { PosterFormFields } from "./poster-modal-form"
import { usePosterFormFields } from "./use-poster-form-fields"

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
  const {
    showDropdownOpen,
    setShowDropdownOpen,
    showSearch,
    setShowSearch,
    tourPickKey,
    setTourPickKey,
    artistPickKey,
    setArtistPickKey,
    showById,
    filteredShows,
    availableTours,
    availableKnownArtists,
    addShow,
    removeShow,
    addTour,
    removeTour,
    addArtistRow,
    addKnownArtist,
    updateArtist,
    removeArtist,
    imagePreview,
  } = usePosterFormFields({
    formData,
    setFormData,
    shows,
    tours,
    knownArtists,
  })

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <PosterFormShowsSection
        showIds={formData.showIds}
        showById={showById}
        showDropdownOpen={showDropdownOpen}
        onToggleDropdown={() => setShowDropdownOpen((o) => !o)}
        showSearch={showSearch}
        onShowSearchChange={setShowSearch}
        filteredShows={filteredShows}
        onShowSelect={addShow}
        onRemoveShow={removeShow}
        showsLoading={showsLoading}
        showsLoadingProgress={showsLoadingProgress}
      />

      <PosterFormToursSection
        tourNames={formData.tourNames}
        tours={tours}
        availableTours={availableTours}
        tourPickKey={tourPickKey}
        onTourPick={(v) => {
          addTour(v)
          setTourPickKey((k) => k + 1)
        }}
        onRemoveTour={removeTour}
      />

      <PosterFormArtistsSection
        artists={formData.artists}
        knownArtists={knownArtists}
        availableKnownArtists={availableKnownArtists}
        artistPickKey={artistPickKey}
        onArtistPick={(v) => {
          addKnownArtist(v)
          setArtistPickKey((k) => k + 1)
        }}
        onAddArtistRow={addArtistRow}
        onUpdateArtist={updateArtist}
        onRemoveArtist={removeArtist}
      />

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

      <PosterFormImageSection
        formData={formData}
        setFormData={setFormData}
        uploading={uploading}
        onImageFile={onImageFile}
        imagePreview={imagePreview}
      />
    </div>
  )
}
