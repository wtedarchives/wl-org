"use client"

import { useMemo, useState, type Dispatch, type SetStateAction } from "react"
import { getShowDisplayData } from "@/lib/utils/show-utils"
import type { ShowData, ShowPosterArtist, TourData } from "@/types/admin"
import type { PosterFormFields } from "./poster-modal-form"

export interface UsePosterFormFieldsArgs {
  formData: PosterFormFields
  setFormData: Dispatch<SetStateAction<PosterFormFields>>
  shows: ShowData[]
  tours: TourData[]
  knownArtists: ShowPosterArtist[]
}

export function usePosterFormFields({
  formData,
  setFormData,
  shows,
  tours,
  knownArtists,
}: UsePosterFormFieldsArgs) {
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

  return {
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
  }
}
